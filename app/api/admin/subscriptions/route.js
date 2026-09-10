import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.js';
import { 
  verifyAdminAuth, 
  getGiftCodes, 
  saveGiftCode, 
  deleteGiftCode, 
  modifyMerchantSubscription 
} from '@/lib/adminSettings.js';

// GET: Fetch all merchants' subscription data & gift codes
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const { data: merchants, error: dbError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id, subscription_status, subscription_expires_at, setup_progress, created_at')
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    // Process status based on expiry
    const processed = (merchants || []).map(m => {
      let isExpired = false;
      let daysLeft = 0;
      if (m.subscription_expires_at) {
        const diff = new Date(m.subscription_expires_at).getTime() - Date.now();
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0 && m.subscription_status === 'active') {
          isExpired = true;
        }
      }
      return {
        ...m,
        is_expired: isExpired,
        days_left: daysLeft
      };
    });

    const giftCodes = await getGiftCodes();

    return NextResponse.json({
      success: true,
      merchants: processed,
      gift_codes: giftCodes
    });
  } catch (err) {
    console.error('GET /api/admin/subscriptions error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Manage merchant subscriptions & gift codes
export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // 1. Extend or modify merchant subscription
    if (action === 'extend_subscription') {
      const { merchantId, days, planType, note, customExpiry } = body;
      const updated = await modifyMerchantSubscription(merchantId, {
        action: 'extend',
        days: days || 30,
        planType: planType || `${days || 30}day_admin_granted`,
        customExpiry: customExpiry || null,
        note: note || `Admin granted ${days || 30} days`
      });
      return NextResponse.json({ success: true, merchant: updated, message: `Successfully extended subscription!` });
    }

    // 2. Toggle active/inactive
    if (action === 'toggle_status') {
      const { merchantId, status } = body;
      const updated = await modifyMerchantSubscription(merchantId, {
        action: 'toggle_status',
        status
      });
      return NextResponse.json({ success: true, merchant: updated, message: `Subscription status updated!` });
    }

    // 3. Create or update gift code
    if (action === 'create_gift_code') {
      const { code, discount_type, discount_value, plan_duration_days, plan_type, max_uses, expires_at, description } = body;
      if (!code) {
        return NextResponse.json({ error: 'Code name is required' }, { status: 400 });
      }

      const saved = await saveGiftCode({
        code,
        discount_type: discount_type || 'free',
        discount_value: parseFloat(discount_value || 0),
        plan_duration_days: parseInt(plan_duration_days || 30),
        plan_type: plan_type || 'gift_subscription',
        max_uses: max_uses ? parseInt(max_uses) : null,
        expires_at: expires_at || null,
        description: description || 'Gift Code'
      });

      const allCodes = await getGiftCodes();
      return NextResponse.json({ success: true, code: saved, gift_codes: allCodes, message: `Gift code ${saved.code} created successfully!` });
    }

    // 4. Delete/Disable gift code
    if (action === 'delete_gift_code') {
      const { code } = body;
      if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });
      await deleteGiftCode(code);
      const allCodes = await getGiftCodes();
      return NextResponse.json({ success: true, gift_codes: allCodes, message: `Gift code ${code} removed!` });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/admin/subscriptions error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
