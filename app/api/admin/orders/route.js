import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerMerchantWebhook } from '@/lib/webhook';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, orderId, action, utr } = body;

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Verify password
    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: 'Unauthorized: Invalid password' }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be verify or reject' }, { status: 400 });
    }

    let updateFields = {};
    if (action === 'verify') {
      updateFields = {
        status: 'verified',
        utr: utr || `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
        verified_at: new Date().toISOString()
      };
    } else {
      updateFields = {
        status: 'rejected'
      };
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateFields)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error modifying order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger outbound webhook for the merchant upon verification
    if (action === 'verify') {
      await triggerMerchantWebhook(orderId);
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error('API admin orders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
