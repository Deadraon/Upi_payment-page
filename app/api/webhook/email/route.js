import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseTransactionText } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body = {};
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Parse form-data if sent that way
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
    }

    const { secret, subject, text, html, plain, message } = body;

    // Validate webhook secret
    const validSecret = process.env.WEBHOOK_SECRET || CONFIG.webhookSecret;
    const providedSecret = secret || request.nextUrl.searchParams.get('secret');

    if (!providedSecret || providedSecret !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
    }

    // Combine common email fields
    let textToParse = [
      subject || '',
      text || '',
      plain || '',
      html || '',
      message || ''
    ].join(' ').trim();

    // Fallback for Testmail.app or other providers with nested JSON structures
    if (!textToParse && Object.keys(body).length > 0) {
      textToParse = JSON.stringify(body);
    }

    if (!textToParse) {
      return NextResponse.json({ error: 'No email content to parse' }, { status: 400 });
    }

    // Parse transaction details
    const parsed = parseTransactionText(textToParse);
    if (!parsed) {
      return NextResponse.json({
        success: false,
        code: 'EMAIL_NOT_PARSED',
        message: 'Email text did not match credit parameters or had no UTR/amount.'
      }, { status: 200 });
    }

    const { amount, utr } = parsed;

    // Search for matching pending order
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
    if (utr !== 'UNKNOWN_REF') {
      const { data: duplicateUtr, error: dupError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('utr', utr)
        .eq('status', 'verified')
        .limit(1);

      if (!dupError && duplicateUtr && duplicateUtr.length > 0) {
        return NextResponse.json({
          success: false,
          code: 'DUPLICATE_UTR',
          message: `Security alert: UTR ${utr} has already been verified on another invoice.`,
          parsed: { amount, utr }
        }, { status: 200 });
      }
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
      code: 'EMAIL_VERIFIED',
      message: `Verified transaction ${matchedOrder.id} for Rs. ${amount} via email credit alert.`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('API webhook email error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
