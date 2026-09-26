import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`crypto_submit_${clientIp}`, 20, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const { order_id, tx_hash, network } = await request.json();

    if (!order_id || !tx_hash) {
      return NextResponse.json({ error: 'Order ID and Transaction Hash (TxHash) are required.' }, { status: 400 });
    }

    const cleanTx = String(tx_hash).trim();
    if (cleanTx.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid Transaction Hash / TxID.' }, { status: 400 });
    }

    // 1. Fetch order
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

    // 2. Prevent duplicate TxHash
    const { data: existingTx } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', cleanTx)
      .eq('status', 'verified')
      .limit(1);

    if (existingTx && existingTx.length > 0) {
      return NextResponse.json({
        error: `TxHash ${cleanTx} has already been verified for another transaction.`,
        code: 'DUPLICATE_TXHASH'
      }, { status: 400 });
    }

    // 3. In test mode, allow instant sandbox simulation
    if (order.mode === 'test') {
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'verified',
          utr: cleanTx,
          customer_utr: cleanTx,
          verified_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Dispatch webhook to merchant
      try {
        await triggerMerchantWebhook(order.id);
      } catch (whErr) {
        console.error('[Crypto] Webhook trigger error:', whErr);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Test crypto payment recorded and verified successfully!',
        order: updatedOrder
      }, { status: 200 });
    }

    // 4. In live mode: Save tx hash and keep order pending awaiting on-chain block confirmations
    await supabaseAdmin
      .from('orders')
      .update({
        customer_utr: cleanTx
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      verified: false,
      message: 'Transaction hash recorded. Awaiting blockchain network block confirmations...'
    }, { status: 200 });

  } catch (err) {
    console.error('Verify Crypto error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
