'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';

/* ── Original MyMobPay Website Logo (Outfit 800 + Orbitron 900 italic #3B82F6) ── */
const MyMobPayLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, lineHeight: 1, userSelect: 'none' }}>
    <span style={{
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800,
      fontSize: 26,
      color: 'var(--head)',
      letterSpacing: '-0.02em',
    }}>MyMob</span>
    <span style={{
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: 900,
      fontStyle: 'italic',
      fontSize: 26,
      color: '#3B82F6',
      letterSpacing: '-0.01em',
      marginLeft: 4,
    }}>Pay</span>
  </div>
);

/* ── UPI deep-link builder ──────────────────────────────────── */
function buildUpiLink(appId, amount, orderId, merchant, isMandate) {
  const pa    = merchant?.upi_id || CONFIG.upiId;
  const pn    = encodeURIComponent(merchant?.business_name || CONFIG.businessName);
  const upath = isMandate ? 'mandate' : 'pay';
  let qs = `pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${orderId}`;
  if (isMandate) {
    const d = new Date(); d.setDate(d.getDate() + 3);
    const ds = String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + d.getFullYear();
    qs += `&validitystart=${ds}&recur=MONTHLY&amrule=EXACT&share=Y`;
  }
  const amap = { gpay:'com.google.android.apps.nbu.paisa.user', phonepe:'com.phonepe.app', paytm:'net.one97.paytm', bhim:'in.org.npci.upiapp' };
  const imap = { gpay:`gpay://upi/${upath}?${qs}`, phonepe:`phonepe://${upath}?${qs}`, paytm:`paytmmp://upi/${upath}?${qs}`, bhim:`upi://${upath}?${qs}` };
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    const pkg = amap[appId];
    return pkg ? `intent://upi/${upath}?${qs}#Intent;scheme=upi;package=${pkg};end;` : `intent://upi/${upath}?${qs}#Intent;scheme=upi;end;`;
  }
  return imap[appId] || `upi://${upath}?${qs}`;
}

/* ── UPI QR string — always upi:// (NOT device deep-link) ─── */
function buildUpiQrValue(amount, orderId, merchant, isMandate) {
  const pa    = merchant?.upi_id || CONFIG.upiId;
  const pn    = encodeURIComponent(merchant?.business_name || CONFIG.businessName);
  const upath = isMandate ? 'mandate' : 'pay';
  let qs = `pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${orderId}`;
  if (isMandate) {
    const d = new Date(); d.setDate(d.getDate() + 3);
    const ds = String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + d.getFullYear();
    qs += `&validitystart=${ds}&recur=MONTHLY&amrule=EXACT&share=Y`;
  }
  return `upi://${upath}?${qs}`;
}

const UPI_CHIPS = [
  { id: 'phonepe', label: 'PhonePe',    logo: '/logos/phonepe.svg', color: '#5f259f', h: 18 },
  { id: 'gpay',    label: 'Google Pay', logo: '/logos/gpay.svg',    color: '#1a73e8', h: 17 },
  { id: 'paytm',   label: 'Paytm',      logo: '/logos/paytm.svg',   color: '#00b9f1', h: 13 },
  { id: 'bhim',    label: 'BHIM',       logo: '/logos/bhim.svg',    color: '#0b5cab', h: 14 },
];

/* ──────────────────────────────────────────────────────────────
   Main checkout component: Receipt design v2
────────────────────────────────────────────────────────────── */
function PayPageContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();

  const paramApiKey   = searchParams.get('api_key') || searchParams.get('key') || '';
  const paramAmount   = searchParams.get('amount')   || '';
  const paramProject  = searchParams.get('project')  || '';
  const paramCallback = searchParams.get('callback') || '';
  const paramName     = searchParams.get('name')     || '';
  const paramPhone    = searchParams.get('phone')    || '';
  const paramRef      = searchParams.get('ref')      || '';
  const paramNote     = searchParams.get('note')     || '';
  const paramLid      = searchParams.get('lid')      || '';
  const paramOrderId  = searchParams.get('order_id') || searchParams.get('id') || '';

  /* Core state */
  const [merchant,     setMerchant]     = useState(null);
  const [orderId,      setOrderId]      = useState(paramOrderId || null);
  const [orderAmount,  setOrderAmount]  = useState(paramAmount ? parseFloat(paramAmount) : null);
  const [orderMode,    setOrderMode]    = useState('live');
  const [orderNote,    setOrderNote]    = useState(paramNote);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [confirmed,    setConfirmed]    = useState(false);

  /* Entry form state (when visiting without pre-set amount) */
  const [amount,       setAmount]       = useState(paramAmount);
  const [custName,     setCustName]     = useState(paramName);
  const [custPhone,    setCustPhone]    = useState(paramPhone);

  /* Active payment option accordion: 'upi' | 'bank' | 'crypto' */
  const [activeOpt,    setActiveOpt]    = useState('upi');

  /* View navigation: 'vPay' | 'vOk' | 'vExp' */
  const [curView,      setCurView]      = useState('vPay');
  const [checkMsg,     setCheckMsg]     = useState('');
  const [isChecking,   setIsChecking]   = useState(false);

  /* Session Countdown Timer (327 seconds default matching prototype) */
  const SESSION_SECS = 327;
  const [timeLeft, setTimeLeft] = useState(SESSION_SECS);

  /* Copy feedback state */
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyUsdtDone, setCopyUsdtDone] = useState(false);
  const [copiedAcc,    setCopiedAcc]    = useState(false);
  const [copiedIfsc,   setCopiedIfsc]   = useState(false);

  /* UTR state */
  const [showUtr,      setShowUtr]      = useState(false);
  const [utr,          setUtr]          = useState('');
  const [utrBusy,      setUtrBusy]      = useState(false);
  const [utrMsg,       setUtrMsg]       = useState('');

  /* Promo code state */
  const [showPromo,    setShowPromo]    = useState(false);
  const [promoCode,    setPromoCode]    = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg,     setPromoMsg]     = useState('');

  /* Crypto USDT state */
  const [txHash,       setTxHash]       = useState('');
  const [txBusy,       setTxBusy]       = useState(false);
  const [txMsg,        setTxMsg]        = useState('');

  /* Dynamic order timestamp */
  const [orderDate,    setOrderDate]    = useState('');
  const [okTime,       setOkTime]       = useState('');

  const autoCreated = useRef(false);
  const [tempId, setTempId] = useState('A7F2-9C41');

  useEffect(() => {
    setTempId(Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase());
    try {
      const d = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date());
      setOrderDate(d);
    } catch {
      setOrderDate('24 Sep 2026, 3:59 PM');
    }
  }, []);

  /* Derived values */
  const isMandate     = orderNote === 'Trial_Setup_3Day' || orderNote === 'Autopay_Setup_3DayTrial';
  const displayAmt    = orderAmount ?? (amount ? parseFloat(amount) : null);
  const activeId      = orderId || tempId;
  const upiId         = merchant?.upi_id || CONFIG.upiId;
  const bizName       = merchant?.business_name || CONFIG.businessName;
  const bankAcc       = merchant?.bank_account_number || CONFIG.bankAccountNumber || '919410181307';
  const bankIfsc      = merchant?.bank_ifsc || CONFIG.bankIfsc || 'PYTM0123456';
  const bankName      = merchant?.bank_account_name || bizName;
  const bankBranch    = merchant?.bank_name || '';
  const cryptoWallet  = merchant?.crypto_wallet_address || CONFIG.defaultCryptoWallet;
  const cryptoNetwork = merchant?.crypto_network || CONFIG.defaultCryptoNetwork;
  const usdtAmt       = displayAmt ? (displayAmt / (CONFIG.usdtInrRate || 90)).toFixed(4) : '0.0000';
  const upiQrValue    = displayAmt ? buildUpiQrValue(displayAmt, activeId, merchant, isMandate) : '';

  /* Format currency matching template: ₹2,499.00 */
  const fmtInr = (n) => {
    if (n == null) return '—';
    const parts = parseFloat(n).toFixed(2).split('.');
    return '\u20b9' + parseInt(parts[0]).toLocaleString('en-IN') + '.' + parts[1];
  };

  const amtWhole = displayAmt ? Math.floor(displayAmt).toLocaleString('en-IN') : '0';
  const amtFrac  = displayAmt ? ('.' + parseFloat(displayAmt).toFixed(2).split('.')[1]) : '.00';

  /* ── Load merchant branding ── */
  useEffect(() => {
    const key = (paramApiKey || CONFIG.platformApiKey || '').replace(/^(test_|live_)/, '');
    if (!key) return;
    supabase.from('merchants')
      .select('id, business_name, upi_id, theme_color, sandbox_mode, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer, crypto_wallet_address, crypto_network')
      .eq('api_key', key).single()
      .then(({ data }) => { if (data) setMerchant(data); });
  }, [paramApiKey]);

  /* ── Auto-create / Hydrate order ── */
  useEffect(() => {
    if (autoCreated.current) return;

    if (paramOrderId) {
      autoCreated.current = true;
      setOrderId(paramOrderId);
      if (paramAmount) setOrderAmount(parseFloat(paramAmount));
      if (paramCallback) localStorage.setItem(`callback_${paramOrderId}`, paramCallback);
      return;
    }

    if (paramAmount && parseFloat(paramAmount) > 0) {
      autoCreated.current = true;
      createOrder(
        parseFloat(paramAmount),
        paramName,
        paramPhone,
        paramRef,
        paramNote,
        paramCallback,
        paramProject,
        paramLid
      );
    }
  }, [paramOrderId, paramAmount]);

  /* ── Real-time order verification polling ── */
  useEffect(() => {
    if (!orderId || confirmed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && (data.status === 'verified' || data.status === 'completed' || data.status === 'paid')) {
          clearInterval(interval);
          handleSuccess();
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [orderId, confirmed]);

  /* ── Countdown timer ── */
  useEffect(() => {
    if (curView === 'vOk') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCurView('vExp');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [curView]);

  /* ── Success Handler ── */
  function handleSuccess() {
    setConfirmed(true);
    setOkTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    setCurView('vOk');
    try { navigator.vibrate?.(40); } catch {}
  }

  /* ── Check Status CTA Handler ── */
  function triggerChecking() {
    if (isChecking) return;
    setIsChecking(true);
    setCheckMsg('Checking transaction status…');

    if (orderId) {
      fetch(`/api/orders?id=${orderId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.status === 'verified' || d?.status === 'completed') {
            handleSuccess();
          } else {
            setTimeout(() => {
              setIsChecking(false);
              setCheckMsg('No payment found yet. It can take a few seconds, so try again shortly.');
            }, 1800);
          }
        })
        .catch(() => {
          setIsChecking(false);
          setCheckMsg('Could not verify status. Please enter your 12-digit UTR below.');
        });
    } else {
      // Demo simulation
      setTimeout(() => {
        setIsChecking(false);
        handleSuccess();
      }, 2000);
    }
  }

  /* ── Order creation API call ── */
  async function createOrder(amt, name, phone, ref, note, callback, project, lid) {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: paramApiKey || CONFIG.platformApiKey,
          amount: amt,
          customer_name: name,
          customer_phone: phone,
          external_ref: ref,
          note,
          callback_url: callback,
          project,
          lid,
          is_mandate: note === 'Trial_Setup_3Day' || note === 'Autopay_Setup_3DayTrial'
        })
      });
      const data = await res.json();
      if (res.ok && data) {
        const id = data.order_id || data.orderId;
        const am = data.amount ?? data.orderAmount;
        if (id) setOrderId(id);
        if (am != null) setOrderAmount(am);
        setOrderMode(data.mode || 'live');
        if (data.note) setOrderNote(data.note);
        if (callback && id) localStorage.setItem(`callback_${id}`, callback);
      } else {
        setOrderAmount(amt);
      }
    } catch {
      setOrderAmount(amt);
    } finally {
      setLoading(false);
    }
  }

  /* Copy UPI ID */
  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    try { navigator.vibrate?.(25); } catch {}
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1600);
  };

  /* Copy Bank Details */
  const handleCopyAcc = () => {
    navigator.clipboard?.writeText(bankAcc);
    try { navigator.vibrate?.(15); } catch {}
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 1500);
  };

  const handleCopyIfsc = () => {
    navigator.clipboard?.writeText(bankIfsc);
    try { navigator.vibrate?.(15); } catch {}
    setCopiedIfsc(true);
    setTimeout(() => setCopiedIfsc(false), 1500);
  };

  /* Copy USDT */
  const handleCopyUsdt = () => {
    navigator.clipboard?.writeText(cryptoWallet);
    try { navigator.vibrate?.(25); } catch {}
    setCopyUsdtDone(true);
    setTimeout(() => setCopyUsdtDone(false), 1600);
  };

  /* Submit UTR */
  const submitUtr = async (e) => {
    if (e) e.preventDefault();
    if (!utr.trim()) return;
    setUtrBusy(true); setUtrMsg('');
    try {
      const r = await fetch('/api/orders/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: activeId, utr: utr.trim() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      if (d.verified) {
        setUtrMsg('✓ Payment verified! Redirecting…');
        handleSuccess();
      } else {
        setUtrMsg(d.message || 'UTR recorded. Checking in background…');
      }
    } catch (err) {
      setUtrMsg(err.message);
    } finally {
      setUtrBusy(false);
    }
  };

  /* Submit Promo */
  const submitPromo = async (e) => {
    if (e) e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoMsg('');
    try {
      const r = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: activeId, code: promoCode.trim().toUpperCase() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Invalid code');
      setPromoApplied(d.coupon);
      setOrderAmount(d.new_amount);
      setPromoMsg(`✓ Saved ₹${d.discount}!`);
    } catch (err) {
      setPromoMsg(err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  /* Submit Crypto */
  const submitTx = async (e) => {
    if (e) e.preventDefault();
    if (!txHash.trim()) return;
    setTxBusy(true); setTxMsg('');
    try {
      const r = await fetch('/api/orders/verify-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: activeId, tx_hash: txHash.trim() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setTxMsg('✓ Transaction submitted! Redirecting…');
      handleSuccess();
    } catch (err) {
      setTxMsg(err.message);
    } finally {
      setTxBusy(false);
    }
  };

  /* ───────────────────────────────────────────────────────────
     ENTRY FORM (when loaded with no amount / order ID)
  ─────────────────────────────────────────────────────────── */
  if (!orderId && !displayAmt) {
    return (
      <div className="shell" style={{ maxWidth: 580, margin: '40px auto' }}>
        <header>
          <div className="logo">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <MyMobPayLogo />
            </Link>
          </div>
          <div className="secure">
            <i></i><span>Secure checkout, powered by MyMobPay</span>
          </div>
        </header>

        <div className="rc" style={{ filter: 'none', WebkitMask: 'none', mask: 'none', borderRadius: 20, border: '1px solid var(--line)' }}>
          <h1 style={{ font: '800 22px/1.2 "DM Sans",sans-serif', color: 'var(--head)', margin: '0 0 6px' }}>Enter payment amount</h1>
          <p style={{ font: '500 14px "DM Sans",sans-serif', color: 'var(--mut)', margin: '0 0 20px' }}>Generate a direct UPI checkout session.</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!amount || parseFloat(amount) <= 0) {
              setError('Please enter a valid amount.');
              return;
            }
            createOrder(parseFloat(amount), custName, custPhone, paramRef, paramNote, paramCallback, paramProject, paramLid);
          }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: '"DM Sans",sans-serif' }}>Amount (INR)</label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', font: '600 20px "IBM Plex Mono",monospace', color: 'var(--mut)' }}>₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                autoFocus
                value={amount}
                placeholder="999"
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                style={{ width: '100%', minHeight: 52, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px 0 36px', font: '700 22px "IBM Plex Mono",monospace', color: 'var(--ink)', background: 'var(--soft)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {[500, 1000, 2000, 5000].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  style={{ padding: '8px 0', font: '700 13px "DM Sans",sans-serif', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', color: 'var(--mut)', cursor: 'pointer' }}
                >
                  ₹{q}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: '"DM Sans",sans-serif' }}>Your name <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
            <input
              type="text"
              placeholder="Rahul Sharma"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              style={{ width: '100%', minHeight: 46, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px', font: '500 14px "DM Sans",sans-serif', color: 'var(--ink)', background: 'var(--soft)', outline: 'none', marginBottom: 14 }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: '"DM Sans",sans-serif' }}>Phone <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
            <input
              type="tel"
              placeholder="9876543210"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              style={{ width: '100%', minHeight: 46, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px', font: '500 14px "DM Sans",sans-serif', color: 'var(--ink)', background: 'var(--soft)', outline: 'none', marginBottom: 18 }}
            />

            {error && <p style={{ color: '#c0392b', fontSize: 13, fontWeight: 600, margin: '0 0 12px', fontFamily: '"DM Sans",sans-serif' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="cta"
            >
              <span>{loading ? 'Creating session…' : 'Generate Payment QR'}</span>
            </button>
          </form>

          <div className="foot" style={{ marginTop: 18 }}>
            0% transaction fee. Funds go straight to merchant.
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────
     MAIN CHECKOUT UI (Mirrors 'MyMobPay checkout_ Receipt design v2.html')
  ─────────────────────────────────────────────────────────── */
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timerPct = ((timeLeft / SESSION_SECS) * 100).toFixed(1);

  return (
    <div className="shell">
      {/* ── HEADER ── */}
      <header>
        <div className="logo">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <MyMobPayLogo />
          </Link>
        </div>
        <div className="secure">
          <i></i><span>Secure checkout, powered by MyMobPay</span>
        </div>
      </header>

      {/* Test mode banner */}
      {orderMode === 'test' && (
        <div style={{ marginBottom: 18, background: '#fff8e7', border: '1px solid #f0c040', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#856404', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          Test mode &mdash; simulated sandbox transaction
        </div>
      )}

      {/* ── SUCCESS VIEW ── */}
      {curView === 'vOk' && (
        <div className="pay-status-card">
          <div className="okc">
            <svg viewBox="0 0 84 84" aria-hidden="true" style={{ width: 80, height: 80, margin: '0 auto', display: 'block' }}>
              <circle cx="42" cy="42" r="40" fill="#e6f7ee" stroke="var(--ok)" strokeWidth="3" />
              <path d="M26 43l11 11 21-23" fill="none" stroke="var(--ok)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ font: '800 24px "DM Sans",sans-serif', margin: '16px 0 6px', color: 'var(--head)' }}>Payment received</h2>
          <p style={{ color: 'var(--mut)', fontSize: 15, margin: '0 0 20px' }}>{fmtInr(displayAmt)} paid to {bizName}</p>
          <div style={{ background: 'var(--soft)', borderRadius: 16, padding: '8px 18px', textAlign: 'left', margin: '0 auto 24px', maxWidth: 420 }}>
            <div className="ln"><span>Order ID</span><span>#{activeId ? activeId.slice(-8).toUpperCase() : 'DEMO'}</span></div>
            <div className="ln"><span>Method</span><span>UPI</span></div>
            <div className="ln free"><span>Platform fee</span><span>₹0.00</span></div>
            <div className="ln" style={{ borderBottom: 'none' }}><span>Time</span><span>{okTime || new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}</span></div>
          </div>
          <button
            type="button"
            className="cta"
            style={{ maxWidth: 360, margin: '0 auto' }}
            onClick={() => {
              const cb = typeof window !== 'undefined' ? (localStorage.getItem(`callback_${activeId}`) || paramCallback) : '';
              if (cb) {
                window.location.href = cb + (cb.includes('?') ? '&' : '?') + `order_id=${activeId}&status=verified`;
              } else {
                router.push(`/status/${activeId}`);
              }
            }}
          >
            Return to {bizName}
          </button>
        </div>
      )}

      {/* ── EXPIRED VIEW ── */}
      {curView === 'vExp' && (
        <div className="pay-status-card">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff1d6', color: '#b76e00', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 2"/>
            </svg>
          </div>
          <h2 style={{ font: '800 24px "DM Sans",sans-serif', margin: '0 0 6px', color: 'var(--head)' }}>Session expired</h2>
          <p style={{ color: 'var(--mut)', fontSize: 15, margin: '0 0 24px' }}>This payment session has ended. Start again to get a fresh code.</p>
          <button
            type="button"
            className="cta"
            style={{ maxWidth: 280, margin: '0 auto' }}
            onClick={() => {
              setTimeLeft(SESSION_SECS);
              setCurView('vPay');
            }}
          >
            Start again
          </button>
        </div>
      )}

      {/* ── TWO-COLUMN RECEIPT DESIGN V2 (vPay) ── */}
      {curView === 'vPay' && (
        <div className="grid">
          {/* ── LEFT COLUMN: RECEIPT ── */}
          <aside className="rc" aria-label="Order summary">
            <div className="mer">
              <div className="av">{bizName.charAt(0).toUpperCase()}</div>
              <div>
                <b>{bizName}</b>
                <small>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  Verified merchant
                </small>
              </div>
            </div>

            <p className="date">{orderDate || '24 Sep 2026, 3:59 PM'}</p>
            <div className="ln"><span>Order ID</span><span>#{activeId ? activeId.slice(-8).toUpperCase() : 'A7F2-9C41'}</span></div>
            <div className="ln"><span>Subtotal</span><span>{fmtInr(displayAmt).replace('₹', '')}</span></div>
            <div className="ln free"><span>Platform fee</span><span>0.00 Free</span></div>

            <div className="tot">
              <small>Total to pay</small>
              <b>₹{amtWhole}<s>{amtFrac}</s></b>
            </div>

            <div className="exp">
              <div className="lab">
                <span>Session expires in</span>
                <span className="tm">{mm}:{ss}</span>
              </div>
              <div className="track" aria-hidden="true">
                <div id="bar" style={{ width: `${timerPct}%` }}></div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT COLUMN: PAYMENT OPTIONS ── */}
          <main className="pay">
            <h3>How would you like to pay?</h3>

            {/* UPI Option */}
            <div className={`opt ${activeOpt === 'upi' ? 'on' : ''}`} data-o>
              <button
                type="button"
                className="opt-btn"
                aria-expanded={activeOpt === 'upi'}
                onClick={() => setActiveOpt('upi')}
              >
                <span className="l">
                  <span className="ic">
                    <svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>
                  </span>
                  <span>
                    UPI
                    <small>PhonePe, Google Pay, Paytm, BHIM</small>
                  </span>
                </span>
                <span className="dot"></span>
              </button>

              <div className="body">
                <div className="upi">
                  <div>
                    {/* QR Box with corner brackets */}
                    <div className="qrw">
                      <i></i><i></i><i></i><i></i>
                      <div id="qr">
                        {upiQrValue ? (
                          <QRCode
                            value={upiQrValue}
                            size={168}
                            level="M"
                            fgColor="#0f1b2d"
                            bgColor="#ffffff"
                            style={{ display: 'block', width: '100%', height: 'auto' }}
                          />
                        ) : (
                          <div style={{ width: 140, height: 140, display: 'grid', placeItems: 'center', color: 'var(--mut)', fontSize: 13 }}>
                            Generating QR…
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="qcap">Pay {fmtInr(displayAmt)}</div>
                  </div>

                  <div className="side">
                    <p>Scan with any UPI app, or pay to this ID</p>
                    <div className="id">
                      <span>{upiId}</span>
                      <button
                        type="button"
                        className={`copy ${copyFeedback ? 'done' : ''}`}
                        id="copy"
                        onClick={handleCopyUpi}
                      >
                        {copyFeedback ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <p>Or open your app directly</p>
                    <div className="chips">
                      {UPI_CHIPS.map(app => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => {
                            if (!displayAmt) return;
                            window.location.href = buildUpiLink(app.id, displayAmt, activeId, merchant, isMandate);
                          }}
                          title={`Pay with ${app.label}`}
                        >
                          <img
                            src={app.logo}
                            alt={app.label}
                            style={{ maxHeight: app.h, maxWidth: 64, width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }}
                          />
                          <span>{app.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Banking Option */}
            <div className={`opt ${activeOpt === 'bank' ? 'on' : ''}`} data-o>
              <button
                type="button"
                className="opt-btn"
                aria-expanded={activeOpt === 'bank'}
                onClick={() => setActiveOpt(activeOpt === 'bank' ? '' : 'bank')}
              >
                <span className="l">
                  <span className="ic">
                    <svg viewBox="0 0 24 24"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/></svg>
                  </span>
                  <span>
                    Net Banking
                    <span className="badge">0% fee</span>
                    <small>Pay from your bank account</small>
                  </span>
                </span>
                <span className="dot"></span>
              </button>

              <div className="body">
                <div style={{ marginTop: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                    <span style={{ color: 'var(--mut)', fontWeight: 600 }}>Account Name</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{bankName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 13, background: 'var(--soft)' }}>
                    <div>
                      <span style={{ color: 'var(--mut)', fontWeight: 600, display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Number</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{bankAcc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAcc}
                      style={{ border: 0, background: copiedAcc ? '#dcf5e8' : 'var(--tint)', color: copiedAcc ? '#0d7a47' : 'var(--brand-d)', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {copiedAcc ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: bankBranch ? '1px solid var(--line)' : 'none', fontSize: 13, background: 'var(--soft)' }}>
                    <div>
                      <span style={{ color: 'var(--mut)', fontWeight: 600, display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>IFSC Code</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{bankIfsc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyIfsc}
                      style={{ border: 0, background: copiedIfsc ? '#dcf5e8' : 'var(--tint)', color: copiedIfsc ? '#0d7a47' : 'var(--brand-d)', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {copiedIfsc ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  {bankBranch && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                      <span style={{ color: 'var(--mut)', fontWeight: 600 }}>Bank</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{bankBranch}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', fontSize: 13, background: 'var(--tint)' }}>
                    <span style={{ color: 'var(--mut)', fontWeight: 600 }}>Amount to Transfer</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 800, fontSize: 15, color: 'var(--brand-d)' }}>{fmtInr(displayAmt)}</span>
                  </div>
                </div>
                <p className="note" style={{ marginTop: 8 }}>You&apos;ll return here after paying at your bank.</p>
              </div>
            </div>

            {/* Crypto (USDT) Option */}
            <div className={`opt ${activeOpt === 'crypto' ? 'on' : ''}`} data-o>
              <button
                type="button"
                className="opt-btn"
                aria-expanded={activeOpt === 'crypto'}
                onClick={() => setActiveOpt(activeOpt === 'crypto' ? '' : 'crypto')}
              >
                <span className="l">
                  <span className="ic">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 8h5a2 2 0 010 4H9m0 0h5.5a2 2 0 010 4H9M9 7v10"/></svg>
                  </span>
                  <span>
                    Crypto (USDT)
                    <small>TRC20 network</small>
                  </span>
                </span>
                <span className="dot"></span>
              </button>

              <div className="body">
                <div style={{ textAlign: 'center', padding: '6px 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--mut)' }}>
                  Pay <strong style={{ color: 'var(--ink)', fontSize: 16, fontFamily: "'IBM Plex Mono', monospace" }}>{usdtAmt} USDT</strong>
                </div>
                <div className="id" style={{ marginTop: 8 }}>
                  <span>{cryptoWallet}</span>
                  <button
                    type="button"
                    className={`copy ${copyUsdtDone ? 'done' : ''}`}
                    onClick={handleCopyUsdt}
                  >
                    {copyUsdtDone ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="note">Send only USDT on the TRC20 network to this address.</p>

                <form onSubmit={submitTx} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input
                    type="text"
                    placeholder="Transaction hash (TxID)…"
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                    style={{ flex: 1, minHeight: 44, border: '1px solid var(--line)', borderRadius: 10, padding: '0 12px', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}
                  />
                  <button
                    type="submit"
                    disabled={txBusy || !txHash.trim()}
                    style={{ minHeight: 44, padding: '0 14px', border: 0, borderRadius: 10, background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    {txBusy ? '…' : 'Verify'}
                  </button>
                </form>
                {txMsg && <p style={{ fontSize: 12, fontWeight: 600, color: txMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b', margin: '6px 0 0' }}>{txMsg}</p>}
              </div>
            </div>

            {/* UTR reference expander */}
            <div className={`extra ${showUtr ? 'show' : ''}`} id="utrbox">
              <input
                id="utr"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                placeholder="12-digit UTR, e.g. 425619283741"
                aria-label="UTR reference"
                value={utr}
                onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
              />
              <button
                id="verify"
                disabled={utr.length !== 12 || utrBusy}
                onClick={submitUtr}
              >
                {utrBusy ? '…' : 'Verify'}
              </button>
            </div>
            {utrMsg && (
              <p style={{ margin: '6px 0 0', fontSize: 12.5, fontWeight: 600, color: utrMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b' }}>
                {utrMsg}
              </p>
            )}

            {/* Promo code expander */}
            <div className={`extra ${showPromo ? 'show' : ''}`} id="promobox">
              <input
                placeholder="Promo or gift code"
                aria-label="Promo or gift code"
                style={{ fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' }}
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
              />
              <button
                disabled={promoLoading || !promoCode.trim()}
                onClick={submitPromo}
              >
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
            {promoMsg && (
              <p style={{ margin: '6px 0 0', fontSize: 12.5, fontWeight: 600, color: promoMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b' }}>
                {promoMsg}
              </p>
            )}

            {/* CTA Button */}
            <button
              type="button"
              className={`cta ${isChecking ? 'busy' : ''}`}
              id="cta"
              onClick={triggerChecking}
            >
              <span className="sp"></span>
              <span id="ctat">{isChecking ? 'Checking status…' : "I've paid, check status"}</span>
            </button>

            {/* Live status feedback */}
            <div className="status" id="status" role="status" aria-live="polite">
              {checkMsg}
            </div>

            {/* Action links */}
            <div className="links">
              <button type="button" id="utrl" onClick={() => setShowUtr(!showUtr)}>
                {showUtr ? 'Hide UTR box' : 'Already paid? Enter UTR'}
              </button>
              <button type="button" id="promol" onClick={() => setShowPromo(!showPromo)}>
                {promoApplied ? `Promo applied: ${promoApplied.code} ✓` : 'Have a promo code?'}
              </button>
            </div>

            <div className="foot">
              0% transaction fee. Your payment goes straight to the merchant.
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Page Wrapper with Styles: Exact Receipt Design v2
────────────────────────────────────────────────────────────── */
export default function PayPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=Orbitron:wght@800;900&family=Outfit:wght@700;800&display=swap');

        :root {
          --page: #e8eef6;
          --card: #fff;
          --ink: #0f1b2d;
          --mut: #5b6b80;
          --line: #d6dfea;
          --brand: #2f86f6;
          --brand-d: #1c6ee0;
          --tint: #eaf2fe;
          --ok: #12995d;
          --soft: #f3f7fc;
          --head: #0f1b2d;
          --hmut: #5b6b80;
          box-sizing: border-box;
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --page: #0b111d;
            --head: #f2f6fb;
            --hmut: #9fb0c6;
          }
        }
        :root[data-theme="dark"] {
          --page: #0b111d;
          --head: #f2f6fb;
          --hmut: #9fb0c6;
        }

        html {
          scroll-padding-top: env(safe-area-inset-top, 0px);
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        body {
          margin: 0;
          background: var(--page);
          font: 16px/1.5 "DM Sans", system-ui, sans-serif;
          color: var(--ink);
          -webkit-tap-highlight-color: transparent;
        }

        .shell {
          max-width: 1000px;
          margin: 0 auto;
          padding: 28px 20px 44px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 14px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .secure {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--hmut);
          text-align: right;
        }

        .secure i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ok);
          flex: none;
          box-shadow: 0 0 0 4px rgba(18,153,93,.2);
          animation: pulse-dot 2.4s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 4px rgba(18,153,93,.2); }
          50% { box-shadow: 0 0 0 7px rgba(18,153,93,.1); }
        }

        .grid {
          display: grid;
          grid-template-columns: .82fr 1.18fr;
          gap: 28px;
          align-items: start;
        }

        /* ── Receipt ticket card (serrated punch) ── */
        .rc {
          background: var(--card);
          padding: 28px 26px 44px;
          font-family: "IBM Plex Mono", monospace;
          font-size: 13px;
          border-radius: 18px 18px 0 0;
          filter: drop-shadow(0 20px 26px rgba(15,27,45,.16));
          -webkit-mask: radial-gradient(7px at 7px 100%, #0000 98%, #000) 0 100%/14px 100% repeat-x;
          mask: radial-gradient(7px at 7px 100%, #0000 98%, #000) 0 100%/14px 100% repeat-x;
        }

        .mer {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: "DM Sans", sans-serif;
          padding-bottom: 16px;
        }

        .mer .av {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--tint);
          color: var(--brand-d);
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 17px;
          flex: none;
        }

        .mer b {
          display: block;
          font-size: 16px;
          line-height: 1.2;
          color: var(--ink);
        }

        .mer small {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--ok);
          font-weight: 600;
          font-size: 12.5px;
        }

        .date {
          color: var(--mut);
          font-size: 12px;
          margin: 0 0 6px;
          padding-top: 14px;
          border-top: 1px dashed var(--line);
        }

        .ln {
          display: flex;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px dashed var(--line);
          color: var(--mut);
        }

        .ln span:last-child {
          color: var(--ink);
          font-weight: 600;
        }

        .ln.free span:last-child {
          color: var(--ok);
          font-weight: 600;
        }

        .tot {
          margin-top: 20px;
          font-family: "DM Sans", sans-serif;
        }

        .tot small {
          display: block;
          color: var(--mut);
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .tot b {
          font: 600 50px/1.05 "Fraunces", serif;
          letter-spacing: -.025em;
          color: var(--ink);
          display: block;
        }

        .tot b s {
          text-decoration: none;
          font-size: 26px;
          color: #8a99ad;
        }

        .exp {
          margin-top: 20px;
          font: 600 13px "DM Sans", sans-serif;
          color: var(--brand-d);
        }

        .exp .lab {
          display: flex;
          justify-content: space-between;
          margin-bottom: 7px;
        }

        .track {
          height: 5px;
          border-radius: 9px;
          background: var(--tint);
          overflow: hidden;
        }

        .track div {
          height: 100%;
          background: var(--brand);
          border-radius: 9px;
          transition: width 1s linear;
        }

        .tm {
          font-variant-numeric: tabular-nums;
        }

        /* ── Pay Column ── */
        .pay h3 {
          font: 800 21px "DM Sans", sans-serif;
          margin: 2px 0 14px;
          letter-spacing: -.015em;
          color: var(--head);
        }

        .opt {
          background: var(--card);
          border: 2px solid transparent;
          border-radius: 18px;
          margin-bottom: 10px;
          overflow: hidden;
          box-shadow: 0 1px 0 var(--line), 0 10px 22px -18px rgba(15,27,45,.35);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .opt > button.opt-btn {
          all: unset;
          box-sizing: border-box;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          font: 700 15px "DM Sans", sans-serif;
          cursor: pointer;
          gap: 12px;
        }

        .opt > button.opt-btn:focus-visible {
          outline: 3px solid #7fb0ff;
          outline-offset: -3px;
        }

        .l {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ic {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          background: var(--tint);
          color: var(--brand-d);
          display: grid;
          place-items: center;
          flex: none;
        }

        .ic svg {
          width: 19px;
          height: 19px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .l small {
          display: block;
          font-weight: 500;
          font-size: 12.5px;
          color: var(--mut);
          line-height: 1.2;
          margin-top: 1px;
        }

        .badge {
          background: #dcf5e8;
          color: #0d7a47;
          font-size: 11.5px;
          border-radius: 999px;
          padding: 2px 8px;
          margin-left: 8px;
          font-weight: 700;
        }

        .dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #b8c6d7;
          flex: none;
          transition: border .15s;
        }

        .opt.on {
          border-color: var(--brand);
        }

        .opt.on .dot {
          border: 6px solid var(--brand);
        }

        .body {
          display: none;
          padding: 2px 18px 20px;
        }

        .opt.on .body {
          display: block;
        }

        .upi {
          display: flex;
          gap: 22px;
          align-items: center;
        }

        .qrw {
          position: relative;
          width: 168px;
          flex: none;
          padding: 14px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 16px;
        }

        .qrw i {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 3px solid var(--brand);
          border-radius: 6px;
        }

        .qrw i:nth-child(1) { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
        .qrw i:nth-child(2) { top: -2px; right: -2px; border-left: 0; border-bottom: 0; }
        .qrw i:nth-child(3) { bottom: -2px; left: -2px; border-right: 0; border-top: 0; }
        .qrw i:nth-child(4) { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }

        .qrw svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .qcap {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          margin-top: 8px;
          color: var(--ink);
        }

        .side {
          flex: 1;
          min-width: 0;
        }

        .side p {
          margin: 0 0 8px;
          font-size: 13px;
          color: var(--mut);
        }

        .id {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          background: var(--soft);
          border: 1px solid var(--line);
          border-radius: 11px;
          padding: 8px 8px 8px 12px;
          font: 500 12.5px "IBM Plex Mono", monospace;
          margin-bottom: 14px;
        }

        .id span {
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
        }

        .copy {
          all: unset;
          cursor: pointer;
          font: 700 12px "DM Sans", sans-serif;
          color: var(--brand-d);
          padding: 5px 10px;
          border-radius: 8px;
          background: var(--tint);
          flex: none;
          min-width: 58px;
          text-align: center;
          transition: all 0.15s;
        }

        .copy:focus-visible {
          outline: 3px solid #7fb0ff;
        }

        .copy.done {
          background: #dcf5e8;
          color: #0d7a47;
        }

        .chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .chips button {
          all: unset;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font: 600 12.5px "DM Sans", sans-serif;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 6px 12px 6px 9px;
          background: #fff;
          transition: border-color 0.15s;
        }

        .chips button:hover {
          border-color: var(--brand);
        }

        .chips button:focus-visible {
          outline: 3px solid #7fb0ff;
        }

        .note {
          font-size: 13px;
          color: var(--mut);
          margin: 0;
        }

        .extra {
          display: none;
          margin-top: 12px;
          gap: 8px;
        }

        .extra.show {
          display: flex;
        }

        .extra input {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
          font: 500 14px "IBM Plex Mono", monospace;
          background: #fff;
          color: var(--ink);
        }

        .extra input:focus {
          outline: 3px solid #b9d5ff;
          border-color: var(--brand);
        }

        .extra button {
          border: 0;
          border-radius: 12px;
          padding: 0 18px;
          font: 700 14px "DM Sans", sans-serif;
          background: var(--brand);
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }

        .extra button:disabled {
          background: #b9d0f3;
          cursor: not-allowed;
        }

        .cta {
          width: 100%;
          margin-top: 12px;
          border: 0;
          background: var(--brand);
          color: #fff;
          border-radius: 16px;
          padding: 17px;
          font: 700 16px "DM Sans", sans-serif;
          cursor: pointer;
          box-shadow: 0 14px 26px -16px var(--brand);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          transition: background 0.15s;
        }

        .cta:hover {
          background: var(--brand-d);
        }

        .cta:focus-visible {
          outline: 3px solid #7fb0ff;
          outline-offset: 3px;
        }

        .sp {
          width: 16px;
          height: 16px;
          border: 2.5px solid #ffffff66;
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          display: none;
        }

        .cta.busy .sp {
          display: block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status {
          min-height: 22px;
          text-align: center;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--hmut);
          margin-top: 10px;
        }

        .links {
          display: flex;
          justify-content: center;
          gap: 22px;
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
        }

        .links button {
          all: unset;
          cursor: pointer;
          color: var(--brand-d);
        }

        .links button:hover {
          text-decoration: underline;
        }

        .links button:focus-visible {
          outline: 3px solid #7fb0ff;
          border-radius: 4px;
        }

        .foot {
          text-align: center;
          color: var(--hmut);
          font-size: 12.5px;
          margin-top: 20px;
        }

        .pay-status-card {
          max-width: 580px;
          margin: 30px auto;
          background: var(--card);
          border-radius: 24px;
          padding: 40px 32px;
          text-align: center;
          border: 1px solid var(--line);
          box-shadow: 0 16px 40px -12px rgba(15,27,45,.14);
        }

        @media (max-width: 800px) {
          .shell { padding: 16px 14px 36px; }
          .grid { grid-template-columns: 1fr; gap: 20px; }
          .upi { flex-direction: column; align-items: stretch; }
          .qrw { align-self: center; margin: 0 auto; }
          .secure span { max-width: 170px; }
          .tot b { font-size: 44px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .track div { transition: none; }
          .sp { animation-duration: 2s; }
          .secure i { animation: none; }
        }
      `}</style>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', background: '#e8eef6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: '"DM Sans",sans-serif', color: '#5b6b80', fontSize: 14, fontWeight: 600 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #d6dfea', borderTopColor: '#2f86f6', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          Loading checkout…
        </div>
      }>
        <PayPageContent />
      </Suspense>
    </>
  );
}
