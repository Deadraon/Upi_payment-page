import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, password, businessName, upiId, phone } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (!businessName || !businessName.trim()) {
      return NextResponse.json({ error: 'Business or brand name is required.' }, { status: 400 });
    }

    if (!upiId || !upiId.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid UPI ID (e.g., merchant@upi).' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').toString().trim();

    // Check if user already exists in auth.users
    const { data: userListData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    let existingUser = null;
    if (!listError && userListData?.users) {
      existingUser = userListData.users.find(u => u.email?.toLowerCase() === cleanEmail);
    }

    let userId = null;

    if (existingUser) {
      // User exists in auth.users -> update their password and confirm their email
      userId = existingUser.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
        user_metadata: {
          business_name: businessName.trim(),
          upi_id: upiId.trim(),
          phone: cleanPhone,
        },
      });

      if (updateError) {
        console.error('[REGISTER API] User update error:', updateError);
      }
    } else {
      // Create new confirmed user in Supabase Auth
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          business_name: businessName.trim(),
          upi_id: upiId.trim(),
          phone: cleanPhone,
        },
      });

      if (createError) {
        console.error('[REGISTER API] User create error:', createError);
        return NextResponse.json({ error: createError.message || 'Failed to create user account' }, { status: 400 });
      }

      userId = createData.user?.id;
    }

    if (userId) {
      // Upsert merchant record in public.merchants
      const { error: merchantError } = await supabaseAdmin
        .from('merchants')
        .upsert({
          id: userId,
          business_name: businessName.trim(),
          upi_id: upiId.trim(),
          phone_number: cleanPhone || undefined,
          subscription_status: 'active',
          sandbox_mode: true,
          theme_color: '#3B82F6',
        }, { onConflict: 'id' });

      if (merchantError) {
        console.error('[REGISTER API] Merchant row upsert error:', merchantError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully! Logging you in...',
      userId,
    });

  } catch (err) {
    console.error('[REGISTER API] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
