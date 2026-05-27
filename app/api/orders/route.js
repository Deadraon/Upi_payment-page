import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;

    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json({ 
        error: `Server configuration error: Missing ${!hasUrl ? 'SUPABASE_URL' : ''} ${!hasServiceKey ? 'SERVICE_KEY' : ''}`.trim()
      }, { status: 500 });
    }

    const body = await request.json();
    const { api_key, amount, method, note, customer_name, customer_phone, project, callback_url, external_ref } = body;

    if (!api_key) {
      return NextResponse.json({ error: 'API Key is required to create an order.' }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    let actualKey = api_key;
    let isTestFromKey = false;
    
    if (api_key.startsWith('test_')) {
      actualKey = api_key.replace('test_', '');
      isTestFromKey = true;
    } else if (api_key.startsWith('live_')) {
      actualKey = api_key.replace('live_', '');
    }

    // 1. Authenticate the merchant using the API Key
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, subscription_status, sandbox_mode, subscription_expires_at')
      .eq('api_key', actualKey)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Invalid API Key or Merchant not found.' }, { status: 401 });
    }

    let isSubActive = merchant.subscription_status === 'active';
    if (isSubActive && merchant.subscription_expires_at) {
       if (new Date(merchant.subscription_expires_at) < new Date()) {
           isSubActive = false;
       }
    }

    if (!isSubActive) {
      return NextResponse.json({ error: 'Merchant account is inactive or expired. Please renew subscription.' }, { status: 403 });
    }

    let finalAmount = parseFloat(amount);

    // 2. Auto-cancel: expire all pending orders older than 15 minutes FOR THIS MERCHANT
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('orders')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .eq('merchant_id', merchant.id)
      .lt('created_at', fifteenMinutesAgo);

    // 3. Fetch all active pending orders FOR THIS MERCHANT to ensure a unique amount offset
    const { data: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('amount')
      .eq('status', 'pending')
      .eq('merchant_id', merchant.id);

    const pendingAmounts = new Set(pendingOrders?.map(o => parseFloat(o.amount).toFixed(2)) || []);

    // 4. Find the first unique amount by adding a paise offset (e.g., 2.00, 2.01, 2.02)
    let offset = 0;
    const requestedAmount = parseFloat(amount);
    while (offset < 100) {
      const candidate = (requestedAmount + offset / 100).toFixed(2);
      if (!pendingAmounts.has(candidate)) {
        finalAmount = parseFloat(candidate);
        break;
      }
      offset++;
    }

    // 5. Generate a 4-character unique alphanumeric Order ID starting with O (e.g., O1B2)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let orderId = 'O';
    for (let i = 0; i < 3; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 6. Insert order into Supabase linked to the merchant
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          id: orderId,
          merchant_id: merchant.id,
          amount: finalAmount,
          method: method || 'GENERIC',
          note: note || '',
          customer_name: customer_name || '',
          customer_phone: customer_phone || '',
          project: project || merchant.business_name,
          callback_url: callback_url || null,
          external_ref: external_ref || null,
          status: 'pending',
          mode: (isTestFromKey || merchant.sandbox_mode !== false) ? 'test' : 'live'
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orderId: data.id, orderAmount: finalAmount, mode: (isTestFromKey || merchant.sandbox_mode !== false) ? 'test' : 'live' }, { status: 201 });
  } catch (err) {
    console.error('API orders error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, note, created_at, mode, utr')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      status: order.status, 
      note: order.note,
      mode: order.mode,
      utr: order.utr
    }, { status: 200 });

  } catch (err) {
    console.error('API get order error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
