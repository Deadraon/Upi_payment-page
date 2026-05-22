import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseTransactionText } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';

export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, title, message, text } = body;

    // Validate webhook secret
    const validSecret = process.env.WEBHOOK_SECRET || CONFIG.webhookSecret;
    if (!secret || secret !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
    }

    // Combine title and description text to parse
    const textToParse = [
      title || '',
      message || '',
      text || ''
    ].join(' ').trim();

    if (!textToParse) {
      return NextResponse.json({ error: 'Notification message content is empty' }, { status: 400 });
    }

    // Parse notification text
    const parsed = parseTransactionText(textToParse);
    if (!parsed) {
      return NextResponse.json({
        success: false,
        code: 'NOTIFICATION_NOT_PARSED',
        message: 'Notification alert text did not match transaction parameters.'
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
      console.error('Error finding matching order:', findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!order || order.length === 0) {
      return NextResponse.json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `No matching pending order found for amount ₹${amount}`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    const matchedOrder = order[0];

    // Check for double spending UTR
    const { data: duplicateUtr, error: dupError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', utr)
      .limit(1);

    if (!dupError && duplicateUtr && duplicateUtr.length > 0) {
      return NextResponse.json({
        success: false,
        code: 'DUPLICATE_UTR',
        message: `Security warning: UTR ${utr} has already been verified on another invoice.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // Auto verify matched order
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
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code: 'NOTIFICATION_VERIFIED',
      message: `Verified transaction ${matchedOrder.id} for Rs. ${amount} via push notification webhook.`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('API webhook notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
