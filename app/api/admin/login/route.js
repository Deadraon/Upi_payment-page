import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSettings, verifyTOTP, isAuthorizedEmail } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, totpCode, provider, token } = body;

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Google OAuth Session Validation
    if (provider === 'google') {
      if (!token) {
        return NextResponse.json({ error: 'Authorization token is required' }, { status: 400 });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid authentication session' }, { status: 401 });
      }

      const settings = await getAdminSettings();
      if (!settings.admin_email || !isAuthorizedEmail(user.email, settings.admin_email)) {
        return NextResponse.json({ 
          error: `Google account (${user.email}) is not registered as an administrator.` 
        }, { status: 403 });
      }

      return NextResponse.json({ success: true, user: { email: user.email } });
    }


    // 2. Standard Password / 2FA Login
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Incorrect Admin Password' }, { status: 401 });
    }

    // Load admin settings to verify 2FA
    const settings = await getAdminSettings();

    if (settings.totp_enabled) {
      if (!totpCode) {
        // Correct password, prompt for TOTP code
        return NextResponse.json({ success: true, require2fa: true });
      }

      const isValidTotp = verifyTOTP(settings.totp_secret, totpCode);
      if (!isValidTotp) {
        return NextResponse.json({ error: 'Invalid Google Authenticator code.' }, { status: 401 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API admin login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
