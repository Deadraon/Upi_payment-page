import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerMerchantWebhook } from '@/lib/webhook';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, simulateStatus } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required for simulation.' }, { status: 400 });
    }

    // 1. Fetch order details to ensure it exists and is a test mode order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // CRITICAL SECURITY CHECK: Never allow simulating live orders
    if (order.mode !== 'test') {
      return NextResponse.json({ error: 'Simulations are only allowed for Sandbox Test Mode orders.' }, { status: 403 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order has already been processed.' }, { status: 400 });
    }

    if (simulateStatus === 'success') {
      const mockUtr = 'TS_MOCK_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      
      // Update order status to verified in the database
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'verified',
          utr: mockUtr,
          verified_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        throw updateError;
      }

      console.log(`[Sandbox Simulation] Order ${orderId} successfully simulated as SUCCESS. Dispatching webhooks...`);

      // Dispatch outbound webhook securely to the merchant endpoint
      try {
        await triggerMerchantWebhook(orderId);
      } catch (webhookErr) {
        console.error(`[Sandbox Simulation Webhook Error] Failed to fire webhook:`, webhookErr);
      }

      return NextResponse.json({ success: true, message: 'Payment simulated successfully as verified.', status: 'verified', utr: mockUtr });
    } else {
      // Simulate failed/expired checkout state
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'expired'
        })
        .eq('id', orderId);

      if (updateError) {
        throw updateError;
      }

      console.log(`[Sandbox Simulation] Order ${orderId} successfully simulated as FAILED/EXPIRED.`);
      return NextResponse.json({ success: true, message: 'Payment simulated as expired.', status: 'expired' });
    }

  } catch (err) {
    console.error('[Sandbox Simulation Error] Failed to run simulation endpoint:', err);
    return NextResponse.json({ error: err.message || 'Simulation execution failed' }, { status: 500 });
  }
}
