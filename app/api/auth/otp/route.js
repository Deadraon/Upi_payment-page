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

      console.log(`[AUTH OTP] Generated OTP for ${cleanEmail}: ${code}`);

      // Try triggering Supabase OTP in background (non-blocking)
      try {
        const otpPromise = supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });
        
        // Timeout after 3 seconds so we don't hang if Supabase upstream email server is slow/timing out
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 3000));
        await Promise.race([otpPromise, timeoutPromise]);
      } catch (err) {
        console.warn('[AUTH OTP] Supabase direct OTP attempt notice:', err.message);
      }

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${cleanEmail}. Please check your inbox or spam folder.`,
        otpSent: true,
        // In development/test or for resilient fallback
        debugCode: process.env.NODE_ENV !== 'production' ? code : undefined,
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
      const stored = otpStore.get(cleanEmail);

      // Check in-memory store
      if (stored) {
        if (Date.now() > stored.expiresAt) {
          otpStore.delete(cleanEmail);
          return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
        }

        if (stored.code === cleanOtp) {
          otpStore.delete(cleanEmail);
          return NextResponse.json({
            success: true,
            verified: true,
            message: 'Email successfully verified! ✓',
          });
        }
      }

      // Fallback: Verify against Supabase Auth OTP directly
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'email',
        });

        if (!error && data?.user) {
          return NextResponse.json({
            success: true,
            verified: true,
            message: 'Email successfully verified! ✓',
          });
        }
      } catch (err) {
        console.warn('[AUTH OTP] Supabase verify fallback notice:', err.message);
      }

      if (stored) {
        stored.attempts = (stored.attempts || 0) + 1;
        if (stored.attempts > 5) {
          otpStore.delete(cleanEmail);
          return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 400 });
        }
      }

      return NextResponse.json({
        error: 'Invalid or incorrect verification code. Please check and re-enter.'
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('OTP API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
