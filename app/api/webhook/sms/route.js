import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseBankSms } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';
import { triggerMerchantWebhook } from '@/lib/webhook';

export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, message } = body;

    const validSecret = process.env.WEBHOOK_SECRET || CONFIG.webhookSecret;
    const apiKey = body.api_key || request.headers.get('x-api-key') || request.headers.get('X-MyMobPay-API-Key');
    
    let merchant = null;
    let isAuthorized = false;

    // Check if the global secret is provided
    if (secret && secret === validSecret) {
      isAuthorized = true;
    }

    // Authenticate merchant using api_key if provided
    if (apiKey) {
      const { data, error } = await supabaseAdmin
        .from('merchants')
        .select('id, subscription_status, subscription_expires_at')
        .eq('api_key', apiKey)
        .single();
      
      if (!error && data) {
        merchant = data;
        isAuthorized = true;
      }
    }

    // Fallback: Check if the 'secret' sent is actually a merchant's private API Key
    if (!merchant && secret && secret !== validSecret) {
      const { data, error } = await supabaseAdmin
        .from('merchants')
        .select('id, subscription_status, subscription_expires_at')
        .eq('api_key', secret)
        .single();
        
      if (!error && data) {
        merchant = data;
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret or API Key' }, { status: 401 });
    }

    if (merchant) {
       let isSubActive = merchant.subscription_status === 'active';
       if (isSubActive && merchant.subscription_expires_at) {
          if (new Date(merchant.subscription_expires_at) < new Date()) {
              isSubActive = false;
          }
       }
       if (!isSubActive) {
         return NextResponse.json({ error: 'Merchant subscription is inactive or expired' }, { status: 403 });
       }
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

    // Find the most recent pending order matching the amount (isolated by merchant if authenticated)
    let orderQuery = supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('amount', amount);
      
    if (merchant) {
      orderQuery = orderQuery.eq('merchant_id', merchant.id);
    }

    const { data: order, error: findError } = await orderQuery
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

    // Trigger outbound webhook safely
    await triggerMerchantWebhook(matchedOrder.id);

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
