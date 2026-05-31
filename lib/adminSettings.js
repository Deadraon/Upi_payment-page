import crypto from 'crypto';
import { supabaseAdmin } from './supabase';
import { CONFIG } from './config';

// Base32 Decoding for TOTP (RFC 6238/4226)
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let clean = base32.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  let len = clean.length;
  let val = 0;
  let count = 0;
  let bytes = [];

  for (let i = 0; i < len; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    val = (val << 5) | idx;
    count += 5;
    if (count >= 8) {
      bytes.push((val >>> (count - 8)) & 255);
      count -= 8;
    }
  }
  return Buffer.from(bytes);
}

// Generate standard 16-character Base32 Secret Key for Authenticator apps
export function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Verify a 6-digit TOTP code against the secret (with time window offset)
export function verifyTOTP(secret, code, window = 1) {
  if (!secret || !code) return false;
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const c = counter + i;
      // Convert counter to 8-byte buffer
      const buf = Buffer.alloc(8);
      buf.writeUInt32BE(0, 0); // High 32 bits
      buf.writeUInt32BE(c, 4); // Low 32 bits

      const hmac = crypto.createHmac('sha1', key).update(buf).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const binary = ((hmac[offset] & 0x7f) << 24) |
                     ((hmac[offset + 1] & 0xff) << 16) |
                     ((hmac[offset + 2] & 0xff) << 8) |
                     (hmac[offset + 3] & 0xff);

      const calculatedCode = String(binary % 1000000).padStart(6, '0');
      if (calculatedCode === code.trim()) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('TOTP verification error:', err);
    return false;
  }
}

// Ensure Platform Admin Merchant row exists in the database
export async function ensureAdminMerchant() {
  try {
    const { data: existing, error } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('api_key', CONFIG.platformApiKey)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // Attempt to register a default Admin user inside auth.users to satisfy foreign key
    const email = 'platform_admin@mymobpay.local';
    let userId = '';

    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'PlatformAdminPassword123!',
      email_confirm: true
    });

    if (authError) {
      // Fetch user ID if already created
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = list?.users?.find(u => u.email === email);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Fallback unique email
        const uniqueEmail = `admin_${Date.now()}@mymobpay.local`;
        const { data: retryUser, error: retryError } = await supabaseAdmin.auth.admin.createUser({
          email: uniqueEmail,
          password: 'PlatformAdminPassword123!',
          email_confirm: true
        });
        if (retryError) throw retryError;
        userId = retryUser.user.id;
      }
    } else {
      userId = newUser.user.id;
    }

    // Insert admin merchant record
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('merchants')
      .insert({
        id: userId,
        business_name: CONFIG.businessName + ' (Admin)',
        upi_id: CONFIG.upiId,
        api_key: CONFIG.platformApiKey,
        subscription_status: 'active',
        subscription_expires_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting admin merchant record:', insertError);
      return null;
    }

    return inserted;
  } catch (err) {
    console.error('ensureAdminMerchant failed:', err);
    return null;
  }
}

// Fetch Admin configurations stored inside setup_progress JSONB field
export async function getAdminSettings() {
  const adminMerchant = await ensureAdminMerchant();
  if (!adminMerchant) return {};

  const setupProgress = adminMerchant.setup_progress || {};
  return setupProgress.admin_settings || {
    totp_secret: null,
    totp_enabled: false,
    admin_email: null
  };
}

// Update Admin settings inside setup_progress JSONB field
export async function updateAdminSettings(updates) {
  const adminMerchant = await ensureAdminMerchant();
  if (!adminMerchant) return false;

  const setupProgress = adminMerchant.setup_progress || {};
  const currentSettings = setupProgress.admin_settings || {};
  
  const updatedSettings = {
    ...currentSettings,
    ...updates
  };

  const newSetupProgress = {
    ...setupProgress,
    admin_settings: updatedSettings
  };

  // Perform database update
  const { error } = await supabaseAdmin
    .from('merchants')
    .update({ setup_progress: newSetupProgress })
    .eq('id', adminMerchant.id);

  if (error) {
    console.error('Failed to update admin settings:', error);
    return false;
  }

  return true;
}

// Helper to check if a user email matches configured admin email list (comma-separated, matches prefixes)
export function isAuthorizedEmail(userEmail, configuredAdminEmails) {
  if (!userEmail || !configuredAdminEmails) return false;
  const allowedList = configuredAdminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const emailLower = userEmail.toLowerCase();
  return allowedList.some(allowed => emailLower.startsWith(allowed));
}

// Verify Admin Request Authorization (from header token or password)
export async function verifyAdminAuth(request) {
  try {
    const password = request.headers.get('x-admin-password');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Password check
    if (password && password === adminPassword) {
      return true;
    }

    // 2. Google OAuth Bearer Token Verification
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        const settings = await getAdminSettings();
        if (settings && settings.admin_email && isAuthorizedEmail(user.email, settings.admin_email)) {
          return true;
        }
      }
    }

    return false;
  } catch (e) {
    console.error('verifyAdminAuth failed:', e);
    return false;
  }
}


// Centralized Subscription Processing on verification
export async function checkAndProcessSubscription(order, apiKey) {
  try {
    let isPlatformMerchant = apiKey === CONFIG.platformApiKey || order.merchant_id === '677d9312-a53f-4b96-815f-53e0eee1b292';
    
    if (!isPlatformMerchant && order.merchant_id) {
      const { data: merchantRecord } = await supabaseAdmin
        .from('merchants')
        .select('api_key')
        .eq('id', order.merchant_id)
        .single();
      if (merchantRecord && merchantRecord.api_key === CONFIG.platformApiKey) {
        isPlatformMerchant = true;
      }
    }
    
    if (isPlatformMerchant && order.external_ref && (order.note?.startsWith('Subscription_') || order.note === 'Autopay_Setup_3DayTrial' || order.note === 'Trial_Setup_3Day')) {
      const targetMerchantId = order.external_ref;
      let months = 1;
      let isTrial = false;
      let isOneTimeTrial = false;

      if (order.note === 'Autopay_Setup_3DayTrial') {
        isTrial = true;
      } else if (order.note === 'Trial_Setup_3Day') {
        isOneTimeTrial = true;
      } else {
        const monthsMatch = order.note.match(/Subscription_(\d+)Month/);
        months = monthsMatch ? parseInt(monthsMatch[1]) : 1;
      }

      // Get current merchant subscription
      const { data: merchant } = await supabaseAdmin
        .from('merchants')
        .select('subscription_expires_at, subscription_status')
        .eq('id', targetMerchantId)
        .single();

      let baseDate = new Date();
      if (merchant && merchant.subscription_status === 'active' && merchant.subscription_expires_at) {
        const expiry = new Date(merchant.subscription_expires_at);
        if (expiry > baseDate) {
          baseDate = expiry;
        }
      }

      // Add months or trial days
      const newExpiry = new Date(baseDate);
      if (isTrial) {
        newExpiry.setDate(newExpiry.getDate() + 3 + 30); // 3 days trial + 30 days active sub
      } else if (isOneTimeTrial) {
        newExpiry.setDate(newExpiry.getDate() + 3); // 3 days trial
      } else {
        newExpiry.setMonth(newExpiry.getMonth() + months);
      }

      const { error } = await supabaseAdmin
        .from('merchants')
        .update({
          subscription_status: 'active',
          subscription_expires_at: newExpiry.toISOString()
        })
        .eq('id', targetMerchantId);

      if (error) {
        console.error(`Failed to renew subscription for ${targetMerchantId}:`, error);
      } else {
        console.log(`Successfully renewed subscription for ${targetMerchantId} (${isTrial ? '3-Day Autopay Trial + 30 days' : isOneTimeTrial ? '3-Day Trial Activation' : `${months} month(s)`}).`);
      }
    }
  } catch (err) {
    console.error('checkAndProcessSubscription failed:', err);
  }
}
