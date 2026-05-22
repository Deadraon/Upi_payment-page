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

    // Auto-cancel: expire all pending orders older than 5 minutes to free up price slots
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('orders')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo);

    // Dynamic Pricing: Use the lowest available paise value first (.01, .02, .03...)
    // If the exact amount is available, use it. Otherwise increment from .01 upward.
    let isUnique = false;
    let attempts = 0;

    // First try the exact base amount
    const { data: exactMatch } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .eq('amount', finalAmount)
      .limit(1);

    if (!exactMatch || exactMatch.length === 0) {
      isUnique = true;
    } else {
      // Base amount is taken, try lowest paise values sequentially: .01, .02, .03...
      for (let paise = 1; paise <= 99 && !isUnique; paise++) {
        finalAmount = parseFloat((baseAmount + paise / 100).toFixed(2));
        const { data: existing } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('status', 'pending')
          .eq('amount', finalAmount)
          .limit(1);

        if (!existing || existing.length === 0) {
          isUnique = true;
        }
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
