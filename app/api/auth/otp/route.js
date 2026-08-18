import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory OTP storage with timestamp expiry (10 minutes)
const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { action, email, otp } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ──────────────────────────────────────────
    // 1. ACTION: SEND OTP
    // ──────────────────────────────────────────
    if (action === 'send') {
      const code = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

      otpStore.set(cleanEmail, {
        code,
        expiresAt,
        attempts: 0,
      });

      console.log(`[AUTH OTP] Dispatching OTP for ${cleanEmail}...`);

      // Trigger Supabase OTP email dispatch via configured SMTP
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('[AUTH OTP] Supabase signInWithOtp error:', error);
        return NextResponse.json({
          error: error.message || 'Failed to send OTP email.',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `6-digit verification code sent to ${cleanEmail}. Please check your inbox or spam folder.`,
        otpSent: true,
      });
    }

    // ──────────────────────────────────────────
    // 2. ACTION: VERIFY OTP
    // ──────────────────────────────────────────
    if (action === 'verify') {
      if (!otp || typeof otp !== 'string' || otp.trim().length < 4) {
        return NextResponse.json({ error: 'Please enter a valid OTP code' }, { status: 400 });
      }

      const cleanOtp = otp.trim();
      let isVerified = false;

      // 1. Verify against Supabase Auth OTP
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'email',
        });

        if (!error && (data?.user || data?.session)) {
          isVerified = true;
        }
      } catch (err) {
        console.warn('[AUTH OTP] Supabase verify notice:', err.message);
      }

      // 2. Verify against in-memory fallback store
      const stored = otpStore.get(cleanEmail);
      if (!isVerified && stored) {
        if (Date.now() <= stored.expiresAt && stored.code === cleanOtp) {
          isVerified = true;
          otpStore.delete(cleanEmail);
        }
      }

      if (isVerified) {
        if (stored) otpStore.delete(cleanEmail);
        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Email successfully verified! ✓',
        });
      }

      if (stored) {
        stored.attempts = (stored.attempts || 0) + 1;
        if (stored.attempts > 5) {
          otpStore.delete(cleanEmail);
          return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP code.' }, { status: 400 });
        }
      }

      return NextResponse.json({
        error: 'Invalid or expired OTP code. Please check your email and re-enter.'
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('OTP API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
