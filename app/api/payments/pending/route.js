import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, method } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const updateFields = { status: 'pending' };
    if (method) {
      updateFields.method = method;
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateFields)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order to pending:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error('API payments pending error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
