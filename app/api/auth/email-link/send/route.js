import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { sendMagicLinkEmail, isSmtpConfigured } from '@/lib/mailer';

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

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mymob.tech';
    const redirectUrl = `${origin}/dashboard`;

    // 1. Generate the official Supabase one-click Magic Link for this email
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkErr) {
      console.error('[EMAIL LINK API] generateLink error:', linkErr);
      return NextResponse.json(
        { error: linkErr.message || 'Could not generate sign-in link.' },
        { status: 400 }
      );
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: 'Could not generate sign-in link. Please try again.' },
        { status: 500 }
      );
    }

    // 2. If SMTP is configured, send the dedicated LINK-ONLY email
    if (isSmtpConfigured()) {
      await sendMagicLinkEmail({ to: cleanEmail, actionLink });
      return NextResponse.json({
        success: true,
        message: `Magic sign-in link dispatched to ${cleanEmail}. Check your inbox!`,
      });
    }

    // 3. Fallback: If custom SMTP is not configured in .env.local, use Supabase's mailer
    console.warn(`[EMAIL LINK] Using Supabase mailer with Magic Link template.`);

    // Tag user metadata with auth_type = 'link' so the conditional template displays the Sign-In button
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { ...(existingUser.user_metadata || {}), auth_type: 'link' },
        });
      }
    } catch (tagErr) {
      console.warn('[EMAIL LINK API] Metadata tag notice:', tagErr?.message);
    }

    await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        data: { auth_type: 'link' },
        emailRedirectTo: redirectUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Magic sign-in link dispatched to ${cleanEmail}. Check your inbox!`,
    });

  } catch (err) {
    console.error('[EMAIL LINK API] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Could not send sign-in link.' },
      { status: 500 }
    );
  }
}
