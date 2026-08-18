import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, businessName, upiId, phone } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').toString().trim();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mymob.tech'}/dashboard`;

    // Send the magic link email via Supabase's configured SMTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true,
        data: {
          business_name: businessName ? businessName.trim() : undefined,
          upi_id: upiId ? upiId.trim() : undefined,
          phone: cleanPhone || undefined,
        }
      }
    });

    if (error) {
      console.error('[SEND-LINK API] signInWithOtp error:', error);
      return NextResponse.json({
        error: error.message || 'Failed to send verification email.',
        code: error.status || 400
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification link sent to ${cleanEmail}! Please check your email inbox to log in.`,
    });

  } catch (err) {
    console.error('[SEND-LINK API] Unexpected error:', err);
    const detailedError = err?.message || err?.cause?.message || 'Server error while sending verification link.';
    return NextResponse.json({ 
      error: `Send Link Error: ${detailedError}`,
      cause: err?.cause?.toString() || undefined,
    }, { status: 500 });
  }
}
