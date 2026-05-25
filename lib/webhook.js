import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

/**
 * Triggers an outbound webhook POST request to the merchant's endpoint
 * when a payment is verified. Sign the payload using their API key as HMAC secret.
 * 
 * @param {string} orderId The ID of the verified order.
 * @returns {Promise<{ success: boolean, message: string }>} Result of the webhook call.
 */
export async function triggerMerchantWebhook(orderId) {
  if (!orderId) {
    return { success: false, message: 'Missing Order ID' };
  }

  try {
    // 1. Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[Webhook Dispatch] Order ${orderId} not found:`, orderError);
      return { success: false, message: 'Order not found' };
    }

    // 2. Fetch merchant details
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('webhook_url, api_key')
      .eq('id', order.merchant_id)
      .single();

    if (merchantError || !merchant) {
      console.error(`[Webhook Dispatch] Merchant profile not found for order ${orderId}:`, merchantError);
      return { success: false, message: 'Merchant not found' };
    }

    const webhookUrl = merchant.webhook_url;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      // Quiet return if no webhook url is configured
      return { success: true, message: 'No webhook URL configured for merchant' };
    }

    // 3. Formulate standard webhook payload
    const payload = {
      event: 'payment.verified',
      order_id: order.id,
      amount: parseFloat(order.amount),
      utr: order.utr || 'AUTO_VERIFIED',
      status: order.status,
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      external_ref: order.external_ref || '',
      note: order.note || '',
      verified_at: order.verified_at,
      created_at: order.created_at
    };

    const payloadString = JSON.stringify(payload);

    // 4. Compute SHA-256 HMAC signature using merchant's api_key
    const signature = crypto
      .createHmac('sha256', merchant.api_key)
      .update(payloadString)
      .digest('hex');

    console.log(`[Webhook Dispatch] Firing webhook for Order ${order.id} to ${webhookUrl}...`);

    // 5. Fire webhook request with a 6-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MyMobPay-Signature': signature,
        'X-MyMobPay-Event': 'payment.verified',
        'User-Agent': 'MyMobPay-Webhook-Dispatcher/2.0'
      },
      body: payloadString,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Endpoint returned status ${response.status}: ${errorText.slice(0, 100)}`);
    }

    console.log(`[Webhook Dispatch] Webhook successfully delivered to ${webhookUrl} for Order ${order.id}`);
    return { success: true, message: 'Webhook successfully delivered' };

  } catch (err) {
    console.error(`[Webhook Dispatch Error] Failed to deliver webhook for Order ${orderId}:`, err.message);
    return { success: false, message: err.message };
  }
}
