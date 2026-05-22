import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// This endpoint cancels all pending orders older than 5 minutes
// Can be called via Vercel Cron or externally
export async function GET(request) {
  try {
    // Verify cron secret if provided (optional security layer)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Find and cancel all pending orders older than 5 minutes
    const { data: expiredOrders, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id, amount, created_at')
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo);

    if (findError) {
      console.error('Error finding expired orders:', findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired pending orders found.',
        cancelled: 0
      });
    }

    // Cancel all expired orders
    const expiredIds = expiredOrders.map(o => o.id);
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'expired',
        verified_at: new Date().toISOString()
      })
      .in('id', expiredIds);

    if (updateError) {
      console.error('Error cancelling expired orders:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cancelled ${expiredOrders.length} expired pending order(s).`,
      cancelled: expiredOrders.length,
      orders: expiredOrders.map(o => ({ id: o.id, amount: o.amount }))
    });
  } catch (err) {
    console.error('Cron cancel-expired error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
