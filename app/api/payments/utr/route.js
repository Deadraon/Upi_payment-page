import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, utr } = body;

    if (!orderId || !utr) {
      return NextResponse.json({ error: 'Order ID and UTR number are required.' }, { status: 400 });
    }

    const cleanUtr = String(utr).trim();
    if (cleanUtr.length < 8 || cleanUtr.length > 35) {
      return NextResponse.json({ error: 'Please enter a valid 10-16 digit numeric UTR / Ref number.' }, { status: 400 });
    }

    // Fetch order to check mode and status
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'verified') {
      return NextResponse.json({ success: true, verified: true, message: 'Order already verified.' }, { status: 200 });
    }

    // Check for duplicate UTR
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', cleanUtr)
      .eq('status', 'verified')
      .neq('id', orderId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: `UTR ${cleanUtr} has already been verified for another transaction.` }, { status: 400 });
    }

    // Check for matching bank credit in email_logs
    let isBankConfirmed = false;
    const { data: matchedEmail } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .ilike('body_snippet', `%${cleanUtr}%`)
      .limit(1);

    if (matchedEmail && matchedEmail.length > 0) {
      isBankConfirmed = true;
    }

    // In test mode OR if bank alert has already matched, verify the order
    if (order.mode === 'test' || isBankConfirmed) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({
          utr: cleanUtr,
          customer_utr: cleanUtr,
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating UTR in database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger subscription processing only for live authentic orders
      if (order.mode !== 'test') {
        try {
          await checkAndProcessSubscription(data, '');
        } catch (sErr) {
          console.error('Subscription error on payments/utr:', sErr);
        }
      }

      // Trigger merchant webhook
      try {
        await triggerMerchantWebhook(orderId);
      } catch (wErr) {
        console.error('Webhook error on payments/utr:', wErr);
      }

      return NextResponse.json({ success: true, verified: true, order: data });
    }

    // In live mode without immediate bank match: Save customer_utr and keep pending
    await supabaseAdmin
      .from('orders')
      .update({ customer_utr: cleanUtr })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      verified: false,
      message: 'UTR recorded. Automatic verification in progress via bank alert...'
    }, { status: 200 });
  } catch (err) {
    console.error('API payments utr error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
