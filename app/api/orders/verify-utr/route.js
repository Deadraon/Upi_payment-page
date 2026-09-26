import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`utr_submit_${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const { order_id, utr } = await request.json();

    if (!order_id || !utr) {
      return NextResponse.json({ error: 'Order ID and UTR / Reference No. are required.' }, { status: 400 });
    }

    const cleanUtr = String(utr).trim();
    if (cleanUtr.length < 8 || cleanUtr.length > 35) {
      return NextResponse.json({ error: 'Invalid UTR format. Please enter a valid 10-16 digit bank reference or UTR.' }, { status: 400 });
    }

    // 1. Fetch the order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, merchant_id, mode, note, external_ref')
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

    // 2. Check for duplicate UTR fraud against already verified orders
    const { data: existingUtr } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', cleanUtr)
      .eq('status', 'verified')
      .neq('id', order.id)
      .limit(1);

    if (existingUtr && existingUtr.length > 0) {
      return NextResponse.json({
        error: `UTR ${cleanUtr} has already been verified for another transaction.`,
        code: 'DUPLICATE_UTR'
      }, { status: 400 });
    }

    // 3. Mark the order verified with the customer's submitted UTR
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'verified',
        utr: cleanUtr,
        customer_utr: cleanUtr,
        verified_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error verifying order with UTR:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 4. Trigger subscription activation if this order is a subscription / trial setup order
    try {
      await checkAndProcessSubscription(updatedOrder, '');
    } catch (subErr) {
      console.error('Subscription process error on UTR verify:', subErr);
    }

    // 5. Trigger outbound merchant webhook
    try {
      await triggerMerchantWebhook(order.id);
    } catch (whErr) {
      console.error('Webhook error on UTR verify:', whErr);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Payment verified successfully!',
      order: updatedOrder
    }, { status: 200 });

  } catch (err) {
    console.error('Verify UTR error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
