import { NextResponse } from 'next/server';
import { createHash, randomInt } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

// ── Telegram Bot OTP ─────────────────────────────────────────────────
// How it works:
//   1. Merchant enters their Telegram username OR phone-linked chat_id
//   2. We send OTP via Telegram Bot API (100% free, unlimited messages)
//   3. Merchant enters OTP in login form
//
// Setup in .env.local:
//   TELEGRAM_BOT_TOKEN=your_bot_token   (get from @BotFather on Telegram → /newbot)
//
// The merchant must have started a chat with your bot at least once!
// Show them: "Start a chat with @YourBotName on Telegram first"
// ──────────────────────────────────────────────────────────────────────

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_PER_HOUR = 5;

function hashOtp(otp, identifier) {
  return createHash('sha256')
    .update(`${otp}:${identifier}:${process.env.SUPABASE_SERVICE_KEY || 'mymobpay'}`)
    .digest('hex');
}

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }
  return data;
}

export async function POST(req) {
  try {
    const { telegramUsername, purpose = 'login' } = await req.json();

    // Accept @username or numeric chat_id
    const identifier = (telegramUsername || '').toString().trim().replace(/^@/, '').toLowerCase();
    if (!identifier || identifier.length < 3) {
      return NextResponse.json(
        { error: 'Please enter your Telegram username (e.g. @yourname or your chat ID).' },
        { status: 400 }
      );
    }

    const dbKey = `tg:${identifier}`;

    // ── Rate limiting ───────────────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('*', { count: 'exact', head: true })
      .eq('phone', dbKey)
      .eq('purpose', `telegram_${purpose}`)
      .gte('created_at', oneHourAgo);

    if (recentCount >= MAX_OTP_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many Telegram OTP requests. Please wait 1 hour.' },
        { status: 429 }
      );
    }

    // ── Resend cooldown ─────────────────────────────────────────────
    const cooldownAgo = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString();
    const { data: recentOtp } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('created_at')
      .eq('phone', dbKey)
      .eq('purpose', `telegram_${purpose}`)
      .eq('verified', false)
      .gte('created_at', cooldownAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentOtp) {
      const secondsLeft = Math.ceil(
        (new Date(recentOtp.created_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `Please wait ${secondsLeft}s before requesting another Telegram OTP.`, secondsLeft },
        { status: 429 }
      );
    }

    // ── Generate & store OTP ────────────────────────────────────────
    const otp = randomInt(100000, 999999).toString();
    const hash = hashOtp(otp, dbKey);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_otps')
      .insert({
        phone: dbKey,
        otp_hash: hash,
        purpose: `telegram_${purpose}`,
        expires_at: expiresAt,
      });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create OTP session.' }, { status: 500 });
    }

    // ── Send via Telegram ───────────────────────────────────────────
    if (TELEGRAM_BOT_TOKEN) {
      const message = `
🔐 <b>MyMobPay Login OTP</b>

Your one-time password is:

<code>${otp.slice(0, 3)} ${otp.slice(3)}</code>

⏳ Valid for <b>${OTP_EXPIRY_MINUTES} minutes</b>
🚫 Do not share this OTP with anyone.

— MyMobPay Security Team`;

      try {
        // Try sending to @username (Telegram allows this only if user has messaged the bot)
        await sendTelegramMessage(`@${identifier}`, message);
      } catch (tgErr) {
        // If @username fails, the user hasn't started the bot chat
        await supabaseAdmin.from('whatsapp_otps').delete().eq('phone', dbKey).eq('otp_hash', hash);
        if (tgErr.message?.includes('chat not found') || tgErr.message?.includes('blocked')) {
          return NextResponse.json({
            error: `Please start a chat with our Telegram bot first: t.me/${process.env.TELEGRAM_BOT_USERNAME || 'mymobpay_bot'}. Then try again.`,
            botUrl: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'mymobpay_bot'}`,
          }, { status: 400 });
        }
        throw tgErr;
      }
    } else {
      // DEV MODE
      console.warn(`[TELEGRAM OTP DEV MODE] OTP for @${identifier}: ${otp}`);
      console.warn(`Add TELEGRAM_BOT_TOKEN to .env.local to send real Telegram messages.`);
    }

    return NextResponse.json({
      success: true,
      message: TELEGRAM_BOT_TOKEN
        ? `OTP sent to your Telegram (@${identifier}). Valid for ${OTP_EXPIRY_MINUTES} minutes.`
        : `[DEV] OTP logged to server console. Add TELEGRAM_BOT_TOKEN for real delivery.`,
      dev: !TELEGRAM_BOT_TOKEN,
      identifier: `@${identifier}`,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });

  } catch (err) {
    console.error('[TELEGRAM OTP SEND]', err);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
