import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, utr } = body;

    if (!orderId || !utr) {
      return NextResponse.json({ error: 'Order ID and UTR number are required.' }, { status: 400 });
    }

    const cleanUtr = utr.trim();
    // Validate standard 12-digit UPI UTR / Ref format
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json({ error: 'Please enter a valid 12-digit numeric UTR / Ref number.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ utr: cleanUtr })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating UTR in database:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error('API payments utr error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
