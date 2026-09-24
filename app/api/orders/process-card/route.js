import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`card_submit_${clientIp}`, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many card payment attempts. Please wait a moment.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const body = await request.json();
    const { order_id, card_brand, card_last4, cardholder_name, otp } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    // 1. Fetch order details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'verified') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Order is already verified.'
      }, { status: 200 });
    }

    // 2. Validate OTP
    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit OTP.' }, { status: 400 });
    }

    // In simulation / test flow, any 6-digit OTP (e.g. 123456 or generated) succeeds
    const brandPrefix = (card_brand || 'CARD').toUpperCase();
    const cardRef = `CRD_${brandPrefix}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 3. Update order in database to verified
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'verified',
        utr: cardRef,
        verified_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 4. Handle SaaS billing subscription if this was a subscription order
    try {
      await checkAndProcessSubscription(updatedOrder, '');
    } catch (subErr) {
      console.error('[Card Payment] Subscription check error:', subErr);
    }

    // 5. Fire merchant webhook
    try {
      await triggerMerchantWebhook(order.id);
    } catch (webhookErr) {
      console.error('[Card Payment] Webhook dispatch error:', webhookErr);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Card payment processed and verified successfully!',
      transaction_id: cardRef,
      order: updatedOrder
    }, { status: 200 });

  } catch (err) {
    console.error('Process card payment error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process card payment' }, { status: 500 });
  }
}
