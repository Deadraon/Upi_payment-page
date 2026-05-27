import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseTransactionText } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';
import { triggerMerchantWebhook } from '@/lib/webhook';

export async function POST(request) {
  try {
    const { api_key, body: emailBody } = await request.json();

    if (!api_key || !emailBody) {
      return NextResponse.json({ error: 'Missing API key or email body' }, { status: 400 });
    }

    // 1. Authenticate the merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, subscription_status, subscription_expires_at')
      .eq('api_key', api_key)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    // -- NEW: Intercept Gmail Forwarding Confirmation Link --
    const gmailLinkMatch = emailBody.match(/(https:\/\/(?:mail|mail-settings)\.google\.com\/mail\/vf-[^"'\s<>]+)/i);
    if (gmailLinkMatch) {
      const link = gmailLinkMatch[1];
      
      // Save the link to the merchant's database row
      await supabaseAdmin
        .from('merchants')
        .update({ gmail_verification_code: link })
        .eq('id', merchant.id);
        
      console.log(`✅ Intercepted Gmail verification link for merchant ${merchant.id}`);
      return NextResponse.json({ success: true, message: 'Saved Gmail verification link' }, { status: 200 });
    }

    // Block actual payment processing if subscription is inactive or expired
    let isSubActive = merchant.subscription_status === 'active';
    if (isSubActive && merchant.subscription_expires_at) {
       if (new Date(merchant.subscription_expires_at) < new Date()) {
           isSubActive = false;
       }
    }

    if (!isSubActive && api_key !== CONFIG.platformApiKey) {
      return NextResponse.json({ error: 'Merchant subscription is inactive or expired' }, { status: 403 });
    }


    // 2. Parse the email text to extract UTR and Amount
    // We reuse the robust transaction parsing engine
    const parsed = parseTransactionText(emailBody);
    
    if (!parsed || !parsed.amount || !parsed.utr) {
      return NextResponse.json({
        success: false,
        code: 'EMAIL_NOT_PARSED',
        message: 'Could not extract valid Amount and UTR from the email body.'
      }, { status: 200 }); // Return 200 so Cloudflare doesn't retry
    }

    const { amount, utr } = parsed;

    // 3. Find the most recent pending order matching the amount FOR THIS MERCHANT
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('amount', amount)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Error searching for matching order:', findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!order || order.length === 0) {
      return NextResponse.json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `No matching pending order found for amount ${amount} on this merchant account.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    const matchedOrder = order[0];

    // 4. Check for duplicate UTR fraud
    const { data: duplicateUtr, error: dupError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', utr)
      .limit(1);

    if (!dupError && duplicateUtr && duplicateUtr.length > 0) {
      return NextResponse.json({
        success: false,
        code: 'DUPLICATE_UTR',
        message: `Fraud warning: UTR ${utr} has already been used.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // 5. Update the matched order to verified
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

    // 6. SaaS Subscription Renewal Logic
    // If the merchant receiving this payment is the Platform Admin AND it is a subscription renewal
    if (api_key === CONFIG.platformApiKey && matchedOrder.note === 'Subscription_Renewal' && matchedOrder.external_ref) {
      const targetMerchantId = matchedOrder.external_ref;
      
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30); // Add 30 days

      const { error: subUpdateError } = await supabaseAdmin
        .from('merchants')
        .update({
          subscription_status: 'active',
          subscription_expires_at: newExpiry.toISOString()
        })
        .eq('id', targetMerchantId);

      if (subUpdateError) {
        console.error('Failed to update subscription status for merchant:', targetMerchantId);
      } else {
        console.log(`Successfully renewed subscription for merchant: ${targetMerchantId}`);
      }
    }

    // 7. Trigger merchant outbound webhook safely
    await triggerMerchantWebhook(matchedOrder.id);

    return NextResponse.json({
      success: true,
      code: 'ORDER_VERIFIED',
      message: `Successfully verified order ${matchedOrder.id} for Rs. ${amount}`,
      order: updatedOrder
    });

  } catch (err) {
    console.error('API Email Webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
