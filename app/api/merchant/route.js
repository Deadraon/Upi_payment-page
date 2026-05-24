import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id, theme_color, subscription_status')
      .eq('api_key', key)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Merchant not found or invalid API key' }, { status: 404 });
    }

    if (data.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Merchant account is inactive' }, { status: 403 });
    }

    // Never return the api_key itself or webhook_urls to the client
    return NextResponse.json({
      business_name: data.business_name,
      upi_id: data.upi_id,
      theme_color: data.theme_color
    });

  } catch (err) {
    console.error('Merchant fetch error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
