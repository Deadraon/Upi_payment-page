import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, businessName, upiId, phone } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').toString().trim();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mymob.tech'}/dashboard`;

    let actionLink = null;
    let linkSentSuccess = false;

    // 1. Try admin.generateLink if service key is available
    if (process.env.SUPABASE_SERVICE_KEY) {
      try {
        let result = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: cleanEmail,
          options: {
            redirectTo: redirectUrl,
            data: {
              business_name: businessName?.trim() || undefined,
              upi_id: upiId?.trim() || undefined,
              phone: cleanPhone || undefined,
            }
          }
        });

        if (result?.data?.properties?.action_link) {
          actionLink = result.data.properties.action_link;
          linkSentSuccess = true;
        }
      } catch (adminErr) {
        console.warn('[SEND-LINK API] admin.generateLink bypass:', adminErr.message);
      }
    }

    // 2. Fallback to standard Supabase signInWithOtp (dispatches magic link email directly)
    if (!linkSentSuccess) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
          data: {
            business_name: businessName?.trim() || undefined,
            upi_id: upiId?.trim() || undefined,
            phone: cleanPhone || undefined,
          }
        }
      });

      if (otpError) {
        return NextResponse.json({
          error: `Could not send verification email: ${otpError.message}`,
          code: otpError.status || 400
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verification link sent to ${cleanEmail}! Please check your email inbox to log in.`,
      actionLink,
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
