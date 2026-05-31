import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { api_key, webhook_url, amount, note, payload } = body;

    if (!api_key) {
      return NextResponse.json({ error: 'Merchant API Key is required to authorize the test webhook.' }, { status: 400 });
    }

    if (!webhook_url) {
      return NextResponse.json({ error: 'Outbound Webhook URL is required. Please set it in your Settings tab.' }, { status: 400 });
    }

    // Standard raw API key configuration
    let rawApiKey = api_key;
    if (api_key.startsWith('test_')) {
      rawApiKey = api_key.replace('test_', '');
    } else if (api_key.startsWith('live_')) {
      rawApiKey = api_key.replace('live_', '');
    }

    // Generate high-fidelity simulated checkout verification payload
    const mockPayload = payload || {
      event: 'payment.verified',
      orderId: 'O_TEST_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      amount: parseFloat(amount) || 500.00,
      note: note || 'Test_Simulation_Order',
      utr: 'TS_MOCK_' + Math.floor(100000000000 + Math.random() * 900000000000),
      mode: 'test',
      created_at: new Date().toISOString()
    };

    const payloadString = JSON.stringify(mockPayload);

    // Compute secure cryptographic HMAC signature using API Key as secret
    const signature = crypto
      .createHmac('sha256', rawApiKey)
      .update(payloadString)
      .digest('hex');

    const startTime = Date.now();
    let responseStatus = 0;
    let responseStatusText = '';
    let responseText = '';
    let latency = 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout guard

      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MyMobPay-Signature': signature,
          'X-MyMobPay-Event': 'payment.verified',
          'User-Agent': 'MyMobPay-Webhook-Tester/1.0'
        },
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      latency = Date.now() - startTime;
      responseStatus = response.status;
      responseStatusText = response.statusText;
      responseText = await response.text();
    } catch (fetchError) {
      latency = Date.now() - startTime;
      responseStatusText = fetchError.name === 'AbortError' ? 'Connection Timeout' : fetchError.message;
      responseText = 'Failed to execute outbound HTTP POST. Make sure your webhook server is online and accepting connections.';
    }

    return NextResponse.json({
      success: responseStatus >= 200 && responseStatus < 300,
      status: responseStatus,
      statusText: responseStatusText,
      latency,
      response: responseText.slice(0, 1000), // Truncate large payloads safely
      payload: mockPayload,
      signature
    }, { status: 200 });

  } catch (err) {
    console.error('Test webhook api error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
