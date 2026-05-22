import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseBankSms } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';

export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, message } = body;

    // Validate webhook secret
    const validSecret = process.env.WEBHOOK_SECRET || CONFIG.webhookSecret;
    if (!secret || secret !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Parse the SMS text
    const parsed = parseBankSms(message);
    if (!parsed) {
      // Return 200 OK so that SMS forwarder doesn't keep retrying spam or non-bank SMS
      return NextResponse.json({
        success: false,
        code: 'SMS_NOT_PARSED',
        message: 'SMS message does not match credit format or has no valid UTR/amount.'
      }, { status: 200 });
    }

    const { amount, utr } = parsed;

    // Find the most recent pending order matching the amount
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('amount', amount)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Error searching for matching order:', findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!order || order.length === 0) {
      // Order not found
      return NextResponse.json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `No matching pending order found for amount ${amount}`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    const matchedOrder = order[0];

    // Check if another order already has this UTR to prevent double-spending / fraud
    const { data: duplicateUtr, error: dupError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', utr)
      .limit(1);

    if (!dupError && duplicateUtr && duplicateUtr.length > 0) {
      return NextResponse.json({
        success: false,
        code: 'DUPLICATE_UTR',
        message: `Fraud warning: UTR ${utr} has already been used for another transaction.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // Update the matched order to verified
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'verified',
        utr: utr,
        verified_at: new Date().toISOString()
      })
      .eq('id', matchedOrder.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code: 'ORDER_VERIFIED',
      message: `Successfully verified order ${matchedOrder.id} for Rs. ${amount}`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('API webhook SMS error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
