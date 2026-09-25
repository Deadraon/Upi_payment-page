import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { sendOtpEmail, isSmtpConfigured } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { email } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 1. Generate the official Supabase OTP code for this email
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
    });

    if (linkErr) {
      console.error('[EMAIL OTP API] generateLink error:', linkErr);
      return NextResponse.json(
        { error: linkErr.message || 'Could not generate verification code.' },
        { status: 400 }
      );
    }

    const otpCode = linkData?.properties?.email_otp;
    if (!otpCode) {
      return NextResponse.json(
        { error: 'Could not generate verification code. Please try again.' },
        { status: 500 }
      );
    }

    // 2. If SMTP is configured, send the dedicated OTP-ONLY email
    if (isSmtpConfigured()) {
      await sendOtpEmail({ to: cleanEmail, otp: otpCode });
      return NextResponse.json({
        success: true,
        message: `6-digit verification code sent to ${cleanEmail}. Check your inbox!`,
      });
    }

    // 3. Fallback: If custom SMTP is not configured in .env.local, use Supabase's mailer
    console.warn(`[EMAIL OTP] Using Supabase mailer with OTP template. OTP code is: ${otpCode}`);
    
    // Tag user metadata with auth_type = 'otp' so the conditional template displays the OTP code
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { ...(existingUser.user_metadata || {}), auth_type: 'otp' },
        });
      }
    } catch (tagErr) {
      console.warn('[EMAIL OTP API] Metadata tag notice:', tagErr?.message);
    }

    await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        data: { auth_type: 'otp' },
      },
    });

    return NextResponse.json({
      success: true,
      message: `6-digit verification code sent to ${cleanEmail}. Check your inbox!`,
    });

  } catch (err) {
    console.error('[EMAIL OTP API] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Could not send verification email.' },
      { status: 500 }
    );
  }
}
