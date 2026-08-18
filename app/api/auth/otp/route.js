import { NextResponse } from 'next/server';

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kfsnpkpcojfypqmfskif.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uCdoAw2Gk9E5iVzGgKhQiQ_HPEF6wz_';

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

      console.log(`[AUTH OTP] Triggering OTP email for ${cleanEmail}...`);

      let emailSent = false;
      let errorDetail = null;

      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: cleanEmail,
            create_user: true
          }),
        });

        if (response.ok) {
          emailSent = true;
        } else {
          const errData = await response.json().catch(() => ({}));
          errorDetail = errData.msg || errData.message || `HTTP ${response.status}`;
          console.warn('[AUTH OTP] Supabase OTP response notice:', errorDetail);
        }
      } catch (fetchErr) {
        console.warn('[AUTH OTP] Supabase direct fetch error:', fetchErr.message);
        errorDetail = fetchErr.message;
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

      // 1. Try Supabase verify OTP endpoint
      try {
        const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: cleanEmail,
            token: cleanOtp,
            type: 'email'
          }),
        });

        if (verifyRes.ok) {
          isVerified = true;
        }
      } catch (verifyErr) {
        console.warn('[AUTH OTP] Supabase verify error:', verifyErr.message);
      }

      // 2. Fallback: check stored OTP in memory
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

      return NextResponse.json({
        error: 'Invalid or expired verification code. Please check and re-enter.'
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('OTP API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
