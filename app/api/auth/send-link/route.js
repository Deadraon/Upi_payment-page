import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, businessName, upiId, phone } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').toString().trim();

    // Check if user exists in auth.users
    const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userListData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

    let linkType = existingUser ? 'magiclink' : 'signup';

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: linkType,
      email: cleanEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mymob.tech'}/dashboard`,
        data: {
          business_name: businessName ? businessName.trim() : undefined,
          upi_id: upiId ? upiId.trim() : undefined,
          phone: cleanPhone || undefined,
        }
      }
    });

    if (error) {
      console.error('[SEND-LINK API] generateLink error:', error);
      return NextResponse.json({ error: error.message || 'Failed to generate verification link.' }, { status: 400 });
    }

    // If user exists, ensure merchant profile exists
    if (existingUser) {
      await supabaseAdmin.from('merchants').upsert({
        id: existingUser.id,
        business_name: businessName ? businessName.trim() : 'My Business',
        upi_id: upiId ? upiId.trim() : 'pending@upi',
        phone_number: cleanPhone || undefined,
        subscription_status: 'active',
        sandbox_mode: true,
      }, { onConflict: 'id' });
    }

    return NextResponse.json({
      success: true,
      message: `Verification link sent to ${cleanEmail}! Please check your email inbox to log in.`,
      actionLink: data?.properties?.action_link,
    });

  } catch (err) {
    console.error('[SEND-LINK API] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
