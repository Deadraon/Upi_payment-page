import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id, theme_color, subscription_status, subscription_expires_at')
      .eq('api_key', key)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Merchant not found or invalid API key' }, { status: 404 });
    }

    let isSubActive = data.subscription_status === 'active';
    if (isSubActive && data.subscription_expires_at) {
       if (new Date(data.subscription_expires_at) < new Date()) {
           isSubActive = false;
       }
    }

    const isAdminMerchant = data.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || key === CONFIG.platformApiKey;

    if (!isSubActive && !isAdminMerchant) {
      return NextResponse.json({ error: 'Merchant account is inactive or expired' }, { status: 403 });
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
