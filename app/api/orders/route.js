import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    // Debug: Check if environment variables are set
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;

    if (!hasUrl || !hasServiceKey) {
      console.error('Missing env vars:', { hasUrl, hasAnonKey, hasServiceKey });
      return NextResponse.json({ 
        error: `Server configuration error: Missing ${!hasUrl ? 'SUPABASE_URL' : ''} ${!hasServiceKey ? 'SERVICE_KEY' : ''}`.trim()
      }, { status: 500 });
    }

    const body = await request.json();
    const { amount, method, note, customer_name, customer_phone } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    let finalAmount = parseFloat(amount);

    // Auto-cancel: expire all pending orders older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('orders')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', fifteenMinutesAgo);

    // Generate a shorter, unique alphanumeric Order ID (e.g., ORD-A1B2C3D4)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const orderId = `ORD-${randomPart}`;

    // Insert order into Supabase
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          id: orderId,
          amount: finalAmount,
          method: method || 'UPI',
          note: note || '',
          customer_name: customer_name || '',
          customer_phone: customer_phone || '',
          status: 'pending' // Default status is pending
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orderId: data.id, orderAmount: finalAmount }, { status: 201 });
  } catch (err) {
    console.error('API orders error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
