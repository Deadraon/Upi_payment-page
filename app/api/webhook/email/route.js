import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseTransactionText } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const { api_key, body: emailBody, from: emailSender } = await request.json();

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

    const isAdminMerchant = merchant.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || api_key === CONFIG.platformApiKey;

    if (!isSubActive && !isAdminMerchant) {
      return NextResponse.json({ error: 'Merchant subscription is inactive or expired' }, { status: 403 });
    }


    // 2. Parse the email text to extract UTR and Amount
    const parsed = parseTransactionText(emailBody);
    
    // Helper to log emails to the database
    const logEmail = async (status) => {
      await supabaseAdmin.from('email_logs').insert({
        merchant_id: merchant.id,
        sender: emailSender || 'Unknown',
        body_snippet: emailBody.substring(0, 150) + (emailBody.length > 150 ? '...' : ''),
        status: status
      });
    };

    if (!parsed || !parsed.amount || !parsed.utr) {
      await logEmail('ignored');
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
      await logEmail('parsed'); // It was parsed, but no matching order found
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
      await logEmail('parsed'); // Parsed, but duplicate UTR
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
    await checkAndProcessSubscription(updatedOrder, api_key);

    // 7. Trigger merchant outbound webhook safely
    await triggerMerchantWebhook(matchedOrder.id);
    
    // Log the successful match!
    await logEmail('matched');

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
