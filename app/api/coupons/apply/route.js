import { NextResponse } from 'next/server';
import { validateAndApplyGiftCode } from '@/lib/adminSettings.js';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit.js';

export async function POST(request) {
  try {
    // Rate limit: 10 attempts per minute per IP to prevent brute-forcing gift codes
    const clientIp = getClientIp(request);
    const limit = checkRateLimit(`coupon_apply_${clientIp}`, 10, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many code redemption attempts. Please wait ${limit.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { code, merchantId, orderId, amount } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid gift/promo code.' }, { status: 400 });
    }

    const originalAmount = typeof amount === 'number' ? amount : parseFloat(amount || '499');

    const result = await validateAndApplyGiftCode(
      code,
      merchantId || null,
      orderId || null,
      originalAmount
    );

    if (!result.valid) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      isFree: result.isFree,
      discountedAmount: result.discountedAmount,
      discount: result.discount,
      daysGranted: result.daysGranted,
      code: result.code?.code,
      message: result.message
    });
  } catch (err) {
    console.error('POST /api/coupons/apply error:', err);
    return NextResponse.json({ error: err.message || 'Error applying code' }, { status: 500 });
  }
}
