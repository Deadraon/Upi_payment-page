import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to authenticate the merchant via Bearer token or API key
async function authenticateMerchant(request) {
  let merchant = null;

  // 1. Try Bearer Token (Dashboard Session)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) {
      const { data } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();
      merchant = data;
    }
  }

  // 2. Fallback: Try API Key in Headers or Query Params
  if (!merchant) {
    const apiKey = request.headers.get('x-api-key') || new URL(request.url).searchParams.get('api_key');
    if (apiKey) {
      const { data } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .eq('api_key', apiKey)
        .single();
      merchant = data;
    }
  }

  return merchant;
}

// GET: Fetch merchant's staff verification status or allocate a gateway number
export async function GET(request) {
  try {
    const merchant = await authenticateMerchant(request);
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider'); // 'gpay', 'phonepe', 'paytm'

    // Fetch current linked gateway details if any
    let linkedGateway = null;
    if (merchant.staff_gateway_id) {
      const { data } = await supabaseAdmin
        .from('staff_gateway_pool')
        .select('*')
        .eq('id', merchant.staff_gateway_id)
        .single();
      linkedGateway = data;
    }

    // If merchant requests staff setup for a specific provider and does not have it linked yet
    if (provider && !linkedGateway) {
      // Find the best available gateway number from the pool
      const { data: poolNumbers, error: poolError } = await supabaseAdmin
        .from('staff_gateway_pool')
        .select('*')
        .eq('provider', provider)
        .eq('is_active', true)
        .order('current_merchant_count', { ascending: true })
        .limit(1);

      if (poolError || !poolNumbers || poolNumbers.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No active staff gateway numbers are currently available in the system pool.' 
        }, { status: 200 });
      }

      const bestGateway = poolNumbers[0];

      // Update merchant to link this gateway
      const { data: updatedMerchant, error: updateError } = await supabaseAdmin
        .from('merchants')
        .update({
          verification_method: 'staff_verification',
          staff_gateway_id: bestGateway.id,
          staff_connection_status: 'pending_invite'
        })
        .eq('id', merchant.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to allocate staff gateway number' }, { status: 500 });
      }

      // Increment merchant count on the allocated gateway number
      await supabaseAdmin
        .from('staff_gateway_pool')
        .update({ current_merchant_count: bestGateway.current_merchant_count + 1 })
        .eq('id', bestGateway.id);

      return NextResponse.json({
        success: true,
        method: 'staff_verification',
        status: 'pending_invite',
        gateway: bestGateway
      });
    }

    return NextResponse.json({
      success: true,
      method: merchant.verification_method,
      status: merchant.staff_connection_status,
      gateway: linkedGateway
    });

  } catch (err) {
    console.error('API merchant staff GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Manage staff connection state transitions
export async function POST(request) {
  try {
    const merchant = await authenticateMerchant(request);
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'confirm_connected') {
      // Simulate that the merchant successfully added the staff number to GPay/PhonePe
      const { data: updatedMerchant, error } = await supabaseAdmin
        .from('merchants')
        .update({ staff_connection_status: 'connected' })
        .eq('id', merchant.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        status: 'connected', 
        message: '🟢 Staff connection monitoring is now active.' 
      });
    }

    if (action === 'disconnect') {
      const oldGatewayId = merchant.staff_gateway_id;

      // Reset merchant staff configuration
      const { error } = await supabaseAdmin
        .from('merchants')
        .update({
          verification_method: 'sms_forwarder', // Fall back to SMS app default
          staff_gateway_id: null,
          staff_connection_status: 'disconnected'
        })
        .eq('id', merchant.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Decrement merchant count on the old gateway number if existed
      if (oldGatewayId) {
        const { data: gateway } = await supabaseAdmin
          .from('staff_gateway_pool')
          .select('current_merchant_count')
          .eq('id', oldGatewayId)
          .single();

        if (gateway) {
          const newCount = Math.max(0, gateway.current_merchant_count - 1);
          await supabaseAdmin
            .from('staff_gateway_pool')
            .update({ current_merchant_count: newCount })
            .eq('id', oldGatewayId);
        }
      }

      return NextResponse.json({ 
        success: true, 
        status: 'disconnected', 
        message: 'Successfully disconnected staff verification.' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('API merchant staff POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
