import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, method, note, customer_name, customer_phone } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Insert order into Supabase
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          amount: parseFloat(amount),
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

    return NextResponse.json({ orderId: data.id }, { status: 201 });
  } catch (err) {
    console.error('API orders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
