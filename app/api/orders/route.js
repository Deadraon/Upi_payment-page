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
    const baseAmount = Math.floor(finalAmount);

    // Dynamic Pricing: Ensure no other 'pending' order has this exact amount
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 50) {
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('status', 'pending')
        .eq('amount', finalAmount)
        .limit(1);

      if (!existing || existing.length === 0) {
        isUnique = true;
      } else {
        // Collision detected! Generate a new random paise amount between 0.01 and 0.99
        const randomPaise = Math.floor(Math.random() * 99) + 1;
        finalAmount = parseFloat((baseAmount + randomPaise / 100).toFixed(2));
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Gateway busy. Please try again.' }, { status: 429 });
    }

    // Insert order into Supabase
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
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
