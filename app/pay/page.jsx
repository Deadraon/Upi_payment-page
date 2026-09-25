'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import DesktopCheckoutView from '@/components/DesktopCheckoutView';

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
   Main checkout component:
   - Desktop (>= 768px): Exact Receipt design v2 (ticket-punch receipt + accordions + original logo)
   - Mobile (< 768px): Mobile checkout (circular timer ring + bottom fixed bar + mobile card)
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

  /* Desktop accordion selection: 'upi' | 'bank' | 'crypto' */
  const [activeOpt,    setActiveOpt]    = useState('upi');

  /* Mobile accordion selection: '' | 'pBank' | 'pUsdt' */
  const [activeAcc,    setActiveAcc]    = useState('');

  /* View navigation: 'vPay' | 'vWait' | 'vOk' | 'vExp' */
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

  const handleReturn = () => {
    const cb = typeof window !== 'undefined' ? (localStorage.getItem(`callback_${activeId}`) || paramCallback) : '';
    if (cb) {
      window.location.href = cb + (cb.includes('?') ? '&' : '?') + `order_id=${activeId}&status=verified`;
    } else {
      router.push(`/status/${activeId}`);
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

  /* Timing calculations */
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timerPct = ((timeLeft / SESSION_SECS) * 100).toFixed(1);
  const strokeOffset = (100 - (timeLeft / SESSION_SECS) * 100).toFixed(1);
  const isTimerLow = timeLeft <= 60;

  return (
    <>
      {/* ═════════════════════════════════════════════════════════
          DESKTOP WINDOW ONLY (>= 768px):
          Exact Receipt design v2 with original website logo
      ═════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════
          DESKTOP WINDOW ONLY (>= 768px):
          Custom Hosted Checkout Panel (from MyMobPay Checkout.html)
      ═════════════════════════════════════════════════════════ */}
      <div className="desktop-checkout-view">
        <DesktopCheckoutView
          merchant={merchant}
          orderId={orderId}
          paramRef={paramRef}
          paramCallback={paramCallback}
          activeId={activeId}
          displayAmt={displayAmt}
          amtWhole={amtWhole}
          amtFrac={amtFrac}
          bizName={bizName}
          bizInitial={bizInitial}
          upiId={upiId}
          upiQrValue={upiQrValue}
          orderDate={orderDate}
          timeLeft={timeLeft}
          mm={mm}
          ss={ss}
          activeOpt={activeOpt}
          setActiveOpt={setActiveOpt}
          copyFeedback={copyFeedback}
          handleCopyUpi={handleCopyUpi}
          isChecking={isChecking}
          triggerChecking={triggerChecking}
          checkMsg={checkMsg}
          handleReturn={handleReturn}
          bankName={bankName}
          bankAcc={bankAcc}
          bankIfsc={bankIfsc}
          bankBranch={bankBranch}
          copiedAcc={copiedAcc}
          copiedIfsc={copiedIfsc}
          handleCopyAcc={handleCopyAcc}
          handleCopyIfsc={handleCopyIfsc}
          cryptoWallet={cryptoWallet}
          usdtAmt={usdtAmt}
          txHash={txHash}
          setTxHash={setTxHash}
          submitTx={submitTx}
          txBusy={txBusy}
          txMsg={txMsg}
          copyUsdtDone={copyUsdtDone}
          handleCopyUsdt={handleCopyUsdt}
          showUtr={showUtr}
          setShowUtr={setShowUtr}
          utr={utr}
          setUtr={setUtr}
          submitUtr={submitUtr}
          utrBusy={utrBusy}
          utrMsg={utrMsg}
          showPromo={showPromo}
          setShowPromo={setShowPromo}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          submitPromo={submitPromo}
          promoLoading={promoLoading}
          promoMsg={promoMsg}
          promoApplied={promoApplied}
          curView={curView}
          setCurView={setCurView}
          okTime={okTime}
          orderMode={orderMode}
          fmtInr={fmtInr}
          buildUpiLink={buildUpiLink}
        />
      </div>

      {/* ═════════════════════════════════════════════════════════
          MOBILE WINDOW ONLY (< 768px):
          Mobile checkout with circular timer ring & bottom bar
      ═════════════════════════════════════════════════════════ */}
      <div className="mobile-checkout-view app">
        {/* ── HEADER ── */}
        <div className="hd">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <MyMobPayLogo />
          </Link>
          <div className="sec">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V8a4 4 0 018 0v3"/>
            </svg>
            Secure checkout
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className={`prog ${isTimerLow ? 'low' : ''}`}>
          <div style={{ width: `${timerPct}%` }} />
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="scr">
          {/* Test mode banner */}
          {orderMode === 'test' && (
            <div style={{ marginBottom: 14, background: '#fff8e7', border: '1px solid #f0c040', borderRadius: 12, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#856404', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Test mode &mdash; simulated sandbox transaction
            </div>
          )}

          {/* Amount card with circular timer ring */}
          {(curView === 'vPay' || curView === 'vWait') && (
            <div className="sum">
              <div className="top">
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
                <div className={`ringw ${isTimerLow ? 'low' : ''}`} role="timer" aria-label="Session time left">
                  <svg viewBox="0 0 60 60" aria-hidden="true">
                    <circle className="rg-bg" cx="30" cy="30" r="26" fill="none" strokeWidth="4"/>
                    <circle
                      className="rg-fg"
                      cx="30"
                      cy="30"
                      r="26"
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={strokeOffset}
                      transform="rotate(-90 30 30)"
                    />
                  </svg>
                  <span className="tm">{mm}:{ss}</span>
                </div>
              </div>

              <p className="lab">Amount to pay</p>
              <div className="amt">
                ₹{amtWhole}<s>{amtFrac}</s>
              </div>

              <div className="meta">
                <div>
                  <small>Order ID</small>
                  <b>#{activeId ? activeId.slice(-8).toUpperCase() : 'DEMO'}</b>
                </div>
                <div>
                  <small>Platform fee</small>
                  <b>₹0.00<span className="free">Free</span></b>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: PAY */}
          {curView === 'vPay' && (
            <div id="vPay">
              <div className="gh">Pay with UPI</div>
              <div className="card" id="pUpi">
                <div className="pc">
                  <p className="tip" style={{ textAlign: 'center', margin: '0 0 14px' }}>
                    Scan with any UPI app, or pay to the UPI ID
                  </p>

                  <div className="qrf">
                    <i /><i /><i /><i />
                    <div className="qrbox">
                      {upiQrValue ? (
                        <QRCode
                          value={upiQrValue}
                          size={166}
                          level="M"
                          fgColor="#101828"
                          bgColor="#ffffff"
                          style={{ display: 'block', width: '100%', height: 'auto' }}
                        />
                      ) : (
                        <div style={{ width: 166, height: 166, display: 'grid', placeItems: 'center', color: 'var(--mut)', fontSize: 13 }}>
                          Generating QR…
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="cap">Pay {fmtInr(displayAmt)}</div>

                  <div className="id">
                    <span>{upiId}</span>
                    <button
                      type="button"
                      className={`cp ${copyFeedback ? 'done' : ''}`}
                      onClick={handleCopyUpi}
                    >
                      {copyFeedback ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <ol className="how">
                    <li>On this phone? Copy the UPI ID above</li>
                    <li>Pay {fmtInr(displayAmt)} in any UPI app</li>
                    <li>Come back here and tap &quot;I&apos;ve paid&quot;</li>
                  </ol>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--mut)', textAlign: 'center', fontWeight: 600 }}>Or pay directly using your UPI app</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {UPI_CHIPS.map(app => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => {
                            if (!displayAmt) return;
                            window.location.href = buildUpiLink(app.id, displayAmt, activeId, merchant, isMandate);
                          }}
                          style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 12, background: '#fff', boxShadow: '0 1px 2px rgba(16,24,40,.04)' }}
                          title={`Pay with ${app.label}`}
                        >
                          <img src={app.logo} alt={app.label} style={{ maxHeight: app.h, maxWidth: '85%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Other ways to pay accordion */}
              <div className="gh">Other ways to pay</div>
              <div className="card">
                {/* Net Banking */}
                <button
                  type="button"
                  className="row acc"
                  aria-expanded={activeAcc === 'pBank'}
                  onClick={() => setActiveAcc(activeAcc === 'pBank' ? '' : 'pBank')}
                >
                  <span className="ic">
                    <svg viewBox="0 0 24 24"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/></svg>
                  </span>
                  <span>
                    Net Banking<span className="badge">0% fee</span>
                    <small>Pay from your bank account</small>
                  </span>
                  <span className="ch">›</span>
                </button>
                <div className={`pn ${activeAcc === 'pBank' ? 'show' : ''}`} id="pBank">
                  <div style={{ marginTop: 6, background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
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
                  <p className="tip">You&apos;ll return here after paying at your bank.</p>
                </div>

                {/* Crypto (USDT) */}
                <button
                  type="button"
                  className="row acc"
                  aria-expanded={activeAcc === 'pUsdt'}
                  onClick={() => setActiveAcc(activeAcc === 'pUsdt' ? '' : 'pUsdt')}
                >
                  <span className="ic">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 8h5a2 2 0 010 4H9m0 0h5.5a2 2 0 010 4H9M9 7v10"/></svg>
                  </span>
                  <span>
                    Crypto (USDT)
                    <small>TRC20 network</small>
                  </span>
                  <span className="ch">›</span>
                </button>
                <div className={`pn ${activeAcc === 'pUsdt' ? 'show' : ''}`} id="pUsdt">
                  <div style={{ textAlign: 'center', padding: '6px 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--mut)' }}>
                    Pay <strong style={{ color: 'var(--ink)', fontSize: 16, fontFamily: "'IBM Plex Mono', monospace" }}>{usdtAmt} USDT</strong>
                  </div>
                  <div className="id" style={{ marginTop: 8 }}>
                    <span>{cryptoWallet}</span>
                    <button
                      type="button"
                      className={`cp ${copyUsdtDone ? 'done' : ''}`}
                      onClick={handleCopyUsdt}
                    >
                      {copyUsdtDone ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="tip">Send only USDT on the TRC20 network to this address.</p>

                  <form onSubmit={submitTx} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input
                      type="text"
                      placeholder="Transaction hash (TxID)…"
                      value={txHash}
                      onChange={e => setTxHash(e.target.value)}
                      style={{ flex: 1, minHeight: 44, border: '1px solid #d0d5dd', borderRadius: 10, padding: '0 12px', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}
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

              {/* UTR reference accordion */}
              <div className="utrc">
                <button
                  type="button"
                  className="t"
                  onClick={() => setShowUtr(!showUtr)}
                >
                  <span>Already paid? Enter your UTR</span>
                  <span style={{ transform: showUtr ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
                </button>
                <div className={`utr ${showUtr ? '' : 'hide'}`}>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    placeholder="12-digit UTR"
                    value={utr}
                    onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  />
                  <button
                    type="button"
                    disabled={utr.length !== 12 || utrBusy}
                    onClick={submitUtr}
                  >
                    {utrBusy ? '…' : 'Verify'}
                  </button>
                </div>
                {utrMsg && (
                  <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 600, color: utrMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b' }}>
                    {utrMsg}
                  </p>
                )}
              </div>

              {/* Promo code link */}
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowPromo(!showPromo)}
                  style={{ fontSize: 13 }}
                >
                  {promoApplied ? `Promo applied: ${promoApplied.code} ✓` : 'Have a coupon code?'}
                </button>
              </div>
              {showPromo && (
                <form onSubmit={submitPromo} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    style={{ flex: 1, minHeight: 44, border: '1px solid #d0d5dd', borderRadius: 10, padding: '0 12px', fontSize: 13, textTransform: 'uppercase' }}
                  />
                  <button
                    type="submit"
                    disabled={promoLoading || !promoCode.trim()}
                    style={{ minHeight: 44, padding: '0 16px', border: 0, borderRadius: 10, background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    {promoLoading ? '…' : 'Apply'}
                  </button>
                </form>
              )}
              {promoMsg && (
                <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: promoMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b' }}>
                  {promoMsg}
                </p>
              )}

              <div className="trust">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span>0% transaction fee. Your payment goes straight to the merchant.</span>
              </div>
            </div>
          )}

          {/* VIEW 2: WAIT / CHECKING */}
          {curView === 'vWait' && (
            <div id="vWait">
              <div className="gh" style={{ marginTop: 16 }}>Payment status</div>
              <div className="panel">
                <div className="sp-wrap" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                  <svg className="sp-spinner" width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" stroke="var(--tint)" strokeWidth="4.5" fill="none" />
                    <circle cx="24" cy="24" r="20" stroke="var(--brand)" strokeWidth="4.5" strokeLinecap="round" fill="none" strokeDasharray="32 94" />
                  </svg>
                </div>
                <h2>Checking your payment</h2>
                <p>{checkMsg || 'Hang on, this takes a few seconds.'}</p>
                <div style={{ marginTop: 18, background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 14, padding: 12, textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Already paid? Verify 12-digit UTR now:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="12-digit UTR reference"
                      value={utr}
                      onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      style={{ flex: 1, minHeight: 44, border: '1px solid #d0d5dd', borderRadius: 10, padding: '0 12px', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", background: '#fff', outline: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={utr.length !== 12 || utrBusy}
                      onClick={submitUtr}
                      style={{ minHeight: 44, padding: '0 16px', border: 0, borderRadius: 10, background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                      {utrBusy ? '…' : 'Verify'}
                    </button>
                  </div>
                  {utrMsg && <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 600, color: utrMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b' }}>{utrMsg}</p>}
                </div>
                <div style={{ marginTop: 14 }}>
                  <button type="button" className="ghost" onClick={() => setCurView('vPay')}>Back to payment options</button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: SUCCESS */}
          {curView === 'vOk' && (
            <div id="vOk">
              <div className="panel">
                <svg className="okc" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="40"/><path d="M26 43l11 11 21-23"/></svg>
                <h2>Payment received</h2>
                <p>{fmtInr(displayAmt)} paid to {bizName}</p>
                <div className="rcp">
                  <div><span>Order ID</span><span>#{activeId ? activeId.slice(-8).toUpperCase() : 'DEMO'}</span></div>
                  <div><span>Method</span><span>UPI</span></div>
                  <div><span>Platform fee</span><span>₹0.00</span></div>
                  <div><span>Time</span><span>{okTime || new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}</span></div>
                </div>
                <button type="button" className="pri wide" onClick={handleReturn}>Return to {bizName}</button>
              </div>
            </div>
          )}

          {/* VIEW 4: EXPIRED */}
          {curView === 'vExp' && (
            <div id="vExp">
              <div className="panel">
                <div className="xic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                <h2>Session expired</h2>
                <p>This payment session has ended. Start again to get a fresh code.</p>
                <button type="button" className="pri wide" style={{ marginTop: 22 }} onClick={() => { setTimeLeft(SESSION_SECS); setCurView('vPay'); }}>Start again</button>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM FIXED BAR (Only shown on mobile vPay) ── */}
        {curView === 'vPay' && (
          <div className="bar" id="bar">
            <div className="t">
              <small>Total</small>
              <b>{fmtInr(displayAmt)}</b>
            </div>
            <button
              type="button"
              className="pri"
              id="paid"
              onClick={() => {
                setCurView('vWait');
                triggerChecking();
              }}
            >
              I&apos;ve paid
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Page Wrapper with Combined Responsive Styles:
   - >= 768px: Exact Receipt design v2 (Desktop)
   - < 768px: Mobile checkout screen (Mobile)
────────────────────────────────────────────────────────────── */
export default function PayPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500;700&family=Orbitron:wght@800;900&family=Outfit:wght@700;800&display=swap');

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
          --warn: #b76e00;
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
          -webkit-text-size-adjust: 100%;
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

        button, input {
          font-family: inherit;
        }

        .hide {
          display: none !important;
        }

        /* ══════════════════════════════════════════════════════════
           DESKTOP VIEWPORT STYLES (>= 768px): Exact Receipt design v2
        ══════════════════════════════════════════════════════════ */
        @media (min-width: 768px) {
          .mobile-checkout-view {
            display: none !important;
          }

          .desktop-checkout-view {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            width: 100%;
            min-height: 100vh;
            padding: 32px 16px 48px;
            background: #f2f3ff;
          }

          .desktop-checkout-view header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            gap: 14px;
          }

          .desktop-checkout-view .logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .desktop-checkout-view .secure {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--hmut);
            text-align: right;
          }

          .desktop-checkout-view .secure i {
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

          .desktop-checkout-view .grid {
            display: grid;
            grid-template-columns: .82fr 1.18fr;
            gap: 28px;
            align-items: start;
          }

          /* ── Receipt ticket card (serrated punch) ── */
          .desktop-checkout-view .rc {
            background: var(--card);
            padding: 28px 26px 44px;
            font-family: "IBM Plex Mono", monospace;
            font-size: 13px;
            border-radius: 18px 18px 0 0;
            filter: drop-shadow(0 20px 26px rgba(15,27,45,.16));
            -webkit-mask: radial-gradient(7px at 7px 100%, #0000 98%, #000) 0 100%/14px 100% repeat-x;
            mask: radial-gradient(7px at 7px 100%, #0000 98%, #000) 0 100%/14px 100% repeat-x;
          }

          .desktop-checkout-view .mer {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: "DM Sans", sans-serif;
            padding-bottom: 16px;
          }

          .desktop-checkout-view .mer .av {
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

          .desktop-checkout-view .mer b {
            display: block;
            font-size: 16px;
            line-height: 1.2;
            color: var(--ink);
          }

          .desktop-checkout-view .mer small {
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--ok);
            font-weight: 600;
            font-size: 12.5px;
          }

          .desktop-checkout-view .date {
            color: var(--mut);
            font-size: 12px;
            margin: 0 0 6px;
            padding-top: 14px;
            border-top: 1px dashed var(--line);
          }

          .desktop-checkout-view .ln {
            display: flex;
            justify-content: space-between;
            padding: 9px 0;
            border-bottom: 1px dashed var(--line);
            color: var(--mut);
          }

          .desktop-checkout-view .ln span:last-child {
            color: var(--ink);
            font-weight: 600;
          }

          .desktop-checkout-view .ln.free span:last-child {
            color: var(--ok);
            font-weight: 600;
          }

          .desktop-checkout-view .tot {
            margin-top: 20px;
            font-family: "DM Sans", sans-serif;
          }

          .desktop-checkout-view .tot small {
            display: block;
            color: var(--mut);
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 2px;
          }

          .desktop-checkout-view .tot b {
            font: 600 50px/1.05 "Fraunces", serif;
            letter-spacing: -.025em;
            color: var(--ink);
            display: block;
          }

          .desktop-checkout-view .tot b s {
            text-decoration: none;
            font-size: 26px;
            color: #8a99ad;
          }

          .desktop-checkout-view .exp {
            margin-top: 20px;
            font: 600 13px "DM Sans", sans-serif;
            color: var(--brand-d);
          }

          .desktop-checkout-view .exp .lab {
            display: flex;
            justify-content: space-between;
            margin-bottom: 7px;
          }

          .desktop-checkout-view .track {
            height: 5px;
            border-radius: 9px;
            background: var(--tint);
            overflow: hidden;
          }

          .desktop-checkout-view .track div {
            height: 100%;
            background: var(--brand);
            border-radius: 9px;
            transition: width 1s linear;
          }

          .desktop-checkout-view .tm {
            font-variant-numeric: tabular-nums;
          }

          /* ── Right Column ── */
          .desktop-checkout-view .pay h3 {
            font: 800 21px "DM Sans", sans-serif;
            margin: 2px 0 14px;
            letter-spacing: -.015em;
            color: var(--head);
          }

          .desktop-checkout-view .opt {
            background: var(--card);
            border: 2px solid transparent;
            border-radius: 18px;
            margin-bottom: 10px;
            overflow: hidden;
            box-shadow: 0 1px 0 var(--line), 0 10px 22px -18px rgba(15,27,45,.35);
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }

          .desktop-checkout-view .opt > button.opt-btn {
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

          .desktop-checkout-view .opt > button.opt-btn:focus-visible {
            outline: 3px solid #7fb0ff;
            outline-offset: -3px;
          }

          .desktop-checkout-view .l {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .desktop-checkout-view .ic {
            width: 36px;
            height: 36px;
            border-radius: 11px;
            background: var(--tint);
            color: var(--brand-d);
            display: grid;
            place-items: center;
            flex: none;
          }

          .desktop-checkout-view .ic svg {
            width: 19px;
            height: 19px;
            stroke: currentColor;
            fill: none;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .desktop-checkout-view .l small {
            display: block;
            font-weight: 500;
            font-size: 12.5px;
            color: var(--mut);
            line-height: 1.2;
            margin-top: 1px;
          }

          .desktop-checkout-view .badge {
            background: #dcf5e8;
            color: #0d7a47;
            font-size: 11.5px;
            border-radius: 999px;
            padding: 2px 8px;
            margin-left: 8px;
            font-weight: 700;
          }

          .desktop-checkout-view .dot {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #b8c6d7;
            flex: none;
            transition: border .15s;
          }

          .desktop-checkout-view .opt.on {
            border-color: var(--brand);
          }

          .desktop-checkout-view .opt.on .dot {
            border: 6px solid var(--brand);
          }

          .desktop-checkout-view .body {
            display: none;
            padding: 2px 18px 20px;
          }

          .desktop-checkout-view .opt.on .body {
            display: block;
          }

          .desktop-checkout-view .upi {
            display: flex;
            gap: 22px;
            align-items: center;
          }

          .desktop-checkout-view .qrw {
            position: relative;
            width: 168px;
            flex: none;
            padding: 14px;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 16px;
          }

          .desktop-checkout-view .qrw i {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 3px solid var(--brand);
            border-radius: 6px;
          }

          .desktop-checkout-view .qrw i:nth-child(1) { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
          .desktop-checkout-view .qrw i:nth-child(2) { top: -2px; right: -2px; border-left: 0; border-bottom: 0; }
          .desktop-checkout-view .qrw i:nth-child(3) { bottom: -2px; left: -2px; border-right: 0; border-top: 0; }
          .desktop-checkout-view .qrw i:nth-child(4) { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }

          .desktop-checkout-view .qrw svg {
            display: block;
            width: 100%;
            height: auto;
          }

          .desktop-checkout-view .qcap {
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            margin-top: 8px;
            color: var(--ink);
          }

          .desktop-checkout-view .side {
            flex: 1;
            min-width: 0;
          }

          .desktop-checkout-view .side p {
            margin: 0 0 8px;
            font-size: 13px;
            color: var(--mut);
          }

          .desktop-checkout-view .id {
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

          .desktop-checkout-view .id span {
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
          }

          .desktop-checkout-view .copy {
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

          .desktop-checkout-view .copy:focus-visible {
            outline: 3px solid #7fb0ff;
          }

          .desktop-checkout-view .copy.done {
            background: #dcf5e8;
            color: #0d7a47;
          }

          .desktop-checkout-view .chips {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .desktop-checkout-view .chips button {
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

          .desktop-checkout-view .chips button:hover {
            border-color: var(--brand);
          }

          .desktop-checkout-view .chips button:focus-visible {
            outline: 3px solid #7fb0ff;
          }

          .desktop-checkout-view .note {
            font-size: 13px;
            color: var(--mut);
            margin: 0;
          }

          .desktop-checkout-view .extra {
            display: none;
            margin-top: 12px;
            gap: 8px;
          }

          .desktop-checkout-view .extra.show {
            display: flex;
          }

          .desktop-checkout-view .extra input {
            flex: 1;
            min-width: 0;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 12px 14px;
            font: 500 14px "IBM Plex Mono", monospace;
            background: #fff;
            color: var(--ink);
          }

          .desktop-checkout-view .extra input:focus {
            outline: 3px solid #b9d5ff;
            border-color: var(--brand);
          }

          .desktop-checkout-view .extra button {
            border: 0;
            border-radius: 12px;
            padding: 0 18px;
            font: 700 14px "DM Sans", sans-serif;
            background: var(--brand);
            color: #fff;
            cursor: pointer;
            transition: background 0.15s;
          }

          .desktop-checkout-view .extra button:disabled {
            background: #b9d0f3;
            cursor: not-allowed;
          }

          .desktop-checkout-view .cta {
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

          .desktop-checkout-view .cta:hover {
            background: var(--brand-d);
          }

          .desktop-checkout-view .cta:focus-visible {
            outline: 3px solid #7fb0ff;
            outline-offset: 3px;
          }

          .desktop-checkout-view .sp {
            width: 16px;
            height: 16px;
            border: 2.5px solid #ffffff66;
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin .7s linear infinite;
            display: none;
          }

          .desktop-checkout-view .cta.busy .sp {
            display: block;
          }

          .desktop-checkout-view .status {
            min-height: 22px;
            text-align: center;
            font-size: 13.5px;
            font-weight: 600;
            color: var(--hmut);
            margin-top: 10px;
          }

          .desktop-checkout-view .links {
            display: flex;
            justify-content: center;
            gap: 22px;
            margin-top: 8px;
            font-size: 13px;
            font-weight: 600;
          }

          .desktop-checkout-view .links button {
            all: unset;
            cursor: pointer;
            color: var(--brand-d);
          }

          .desktop-checkout-view .links button:hover {
            text-decoration: underline;
          }

          .desktop-checkout-view .links button:focus-visible {
            outline: 3px solid #7fb0ff;
            border-radius: 4px;
          }

          .desktop-checkout-view .foot {
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
        }

        /* ══════════════════════════════════════════════════════════
           MOBILE VIEWPORT STYLES (< 768px):
           Exact Mobile checkout (circular timer ring + bottom bar)
        ══════════════════════════════════════════════════════════ */
        @media (max-width: 767px) {
          .desktop-checkout-view {
            display: none !important;
          }

          .mobile-checkout-view {
            display: flex !important;
          }

          .app {
            max-width: 440px;
            margin: 0 auto;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            background: var(--page);
          }

          .hd {
            background: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 18px;
            border-bottom: 1px solid var(--line);
          }

          .sec {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12.5px;
            font-weight: 600;
            color: var(--mut);
          }

          .sec svg {
            color: var(--ok);
          }

          .prog {
            height: 3px;
            background: var(--tint);
          }

          .prog div {
            height: 100%;
            width: 100%;
            background: var(--brand);
            transition: width 1s linear, background 0.3s;
          }

          .prog.low div {
            background: #e8a317;
          }

          .scr {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 16px 16px 90px;
          }

          .sum {
            background: #fff;
            border-radius: 22px;
            padding: 18px 18px 16px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 14px 28px -18px rgba(16,24,40,.22);
          }

          .top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .mer {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .av {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            background: var(--tint);
            color: var(--brand-d);
            display: grid;
            place-items: center;
            font-weight: 800;
            font-size: 18px;
            flex: none;
          }

          .mer b {
            display: block;
            font-size: 17px;
            line-height: 1.2;
          }

          .mer small {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12.5px;
            color: var(--ok);
            font-weight: 600;
            margin-top: 2px;
          }

          .ringw {
            position: relative;
            width: 60px;
            height: 60px;
            flex: none;
            text-align: center;
          }

          .ringw svg {
            display: block;
            width: 100%;
            height: 100%;
          }

          .ringw .tm {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            font-size: 12.5px;
            font-weight: 700;
            color: var(--ink);
          }

          .rg-bg {
            stroke: var(--tint);
          }

          .rg-fg {
            stroke: var(--brand);
            transition: stroke-dashoffset 1s linear, stroke 0.3s;
          }

          .ringw.low .rg-fg {
            stroke: #e8a317;
          }

          .ringw.low .tm {
            color: #8a5a00;
          }

          .lab {
            margin: 20px 0 0;
            font-size: 13.5px;
            font-weight: 600;
            color: var(--mut);
          }

          .amt {
            font-size: 46px;
            font-weight: 800;
            letter-spacing: -0.035em;
            line-height: 1.1;
            margin: 2px 0 16px;
            font-variant-numeric: tabular-nums;
          }

          .amt s {
            text-decoration: none;
            font-size: 26px;
            color: #98a2b3;
            font-weight: 700;
          }

          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .meta div {
            background: var(--soft);
            border-radius: 14px;
            padding: 10px 12px;
          }

          .meta small {
            display: block;
            font-size: 12px;
            color: var(--mut);
            line-height: 1.2;
          }

          .meta b {
            font-size: 14.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 3px;
            font-variant-numeric: tabular-nums;
          }

          .meta .free {
            background: #dcf5e8;
            color: #0d7a47;
            font-size: 11px;
            border-radius: 999px;
            padding: 1px 7px;
          }

          .gh {
            margin: 22px 4px 8px;
            font-size: 13.5px;
            font-weight: 700;
            color: var(--mut);
          }

          .card {
            background: var(--card);
            border-radius: 18px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 10px 24px -16px rgba(16,24,40,.18);
            overflow: hidden;
          }

          .row {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            min-height: 62px;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 16px;
            border-bottom: 1px solid var(--line);
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            color: var(--ink);
            text-decoration: none;
          }

          .row .ch {
            margin-left: auto;
            color: #98a2b3;
            font-size: 20px;
            transition: transform 0.2s;
          }

          .row[aria-expanded="true"] .ch {
            transform: rotate(90deg);
          }

          .row small {
            display: block;
            font-weight: 500;
            color: var(--mut);
            font-size: 13px;
            line-height: 1.3;
            margin-top: 1px;
          }

          .ic {
            width: 42px;
            height: 42px;
            border-radius: 13px;
            background: var(--tint);
            color: var(--brand-d);
            display: grid;
            place-items: center;
            flex: none;
          }

          .ic svg {
            width: 20px;
            height: 20px;
            stroke: currentColor;
            fill: none;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .badge {
            background: #dcf5e8;
            color: #0d7a47;
            font-size: 11.5px;
            border-radius: 999px;
            padding: 2px 8px;
            font-weight: 700;
            margin-left: 6px;
          }

          .pn {
            display: none;
            padding: 6px 16px 18px;
            border-bottom: 1px solid var(--line);
            background: var(--soft);
          }

          .pn.show {
            display: block;
          }

          .qrf {
            position: relative;
            width: 190px;
            margin: 10px auto 16px;
            padding: 12px;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 16px;
          }

          .qrf i {
            position: absolute;
            width: 18px;
            height: 18px;
            border: 3px solid var(--brand);
            border-radius: 6px;
          }

          .qrf i:nth-child(1) { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
          .qrf i:nth-child(2) { top: -2px; right: -2px; border-left: 0; border-bottom: 0; }
          .qrf i:nth-child(3) { bottom: -2px; left: -2px; border-right: 0; border-top: 0; }
          .qrf i:nth-child(4) { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }

          .qrbox svg {
            display: block;
            width: 100%;
            height: auto;
          }

          .id {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 6px 6px 6px 12px;
            font: 500 13px "IBM Plex Mono", monospace;
            min-height: 48px;
          }

          .id span {
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
          }

          .cp {
            border: 0;
            background: var(--tint);
            color: var(--brand-d);
            font-weight: 700;
            font-size: 13px;
            padding: 0 14px;
            min-height: 36px;
            border-radius: 9px;
            cursor: pointer;
            min-width: 64px;
            flex: none;
            transition: background 0.15s, color 0.15s;
          }

          .cp.done {
            background: #dcf5e8;
            color: #0d7a47;
          }

          .tip {
            font-size: 13px;
            color: var(--mut);
            margin: 10px 0 0;
          }

          .utrc {
            margin-top: 14px;
            background: var(--card);
            border-radius: 16px;
            padding: 4px 16px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06);
          }

          .utrc > button.t {
            all: unset;
            width: 100%;
            min-height: 52px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 14.5px;
            color: var(--brand-d);
            cursor: pointer;
          }

          .utr {
            display: flex;
            gap: 8px;
            padding-bottom: 14px;
          }

          .utr input {
            flex: 1;
            min-width: 0;
            min-height: 50px;
            border: 1px solid #d0d5dd;
            border-radius: 12px;
            padding: 0 14px;
            font: 500 16px "IBM Plex Mono", monospace;
            background: #fff;
            color: var(--ink);
            letter-spacing: 0.04em;
          }

          .utr button {
            min-height: 50px;
            padding: 0 18px;
            border: 0;
            border-radius: 12px;
            background: var(--brand);
            color: #fff;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
          }

          .utr button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .trust {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 7px;
            margin: 18px 8px 0;
            font-size: 12.5px;
            color: var(--mut);
            text-align: center;
          }

          .trust svg {
            flex: none;
            color: var(--ok);
          }

          .pc {
            padding: 18px 16px 18px;
          }

          .pc .qrf {
            margin: 0 auto 12px;
          }

          .pc .cap {
            text-align: center;
            font-weight: 700;
            font-size: 14px;
            margin: 0 0 14px;
          }

          .how {
            list-style: none;
            margin: 16px 0 0;
            padding: 0;
            counter-reset: h;
          }

          .how li {
            counter-increment: h;
            display: flex;
            gap: 10px;
            align-items: center;
            font-size: 13.5px;
            color: var(--mut);
            padding: 5px 0;
          }

          .how li::before {
            content: counter(h);
            flex: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--tint);
            color: var(--brand-d);
            font-weight: 700;
            font-size: 12px;
            display: grid;
            place-items: center;
          }

          /* ── Fixed Bottom bar on mobile ── */
          .bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 50;
            max-width: 440px;
            margin: 0 auto;
            background: #fff;
            border-top: 1px solid var(--line);
            padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .bar .t small {
            display: block;
            color: var(--mut);
            font-size: 12px;
            line-height: 1.2;
          }

          .bar .t b {
            font-size: 19px;
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
          }

          .pri {
            border: 0;
            background: var(--brand);
            color: #fff;
            border-radius: 14px;
            min-height: 52px;
            padding: 0 22px;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 12px 22px -14px var(--brand);
            transition: background 0.15s, transform 0.1s;
          }

          .pri:active {
            background: var(--brand-d);
            transform: scale(0.99);
          }

          .bar .pri {
            flex: 1;
          }

          .wide {
            width: 100%;
          }

          .ghost {
            border: 0;
            background: none;
            color: var(--brand-d);
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            min-height: 44px;
            padding: 0 4px;
          }

          .panel {
            background: var(--card);
            border-radius: 22px;
            padding: 34px 20px 22px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 10px 24px -16px rgba(16,24,40,.18);
            text-align: center;
          }

          .panel h2 {
            margin: 18px 0 6px;
            font-size: 22px;
            letter-spacing: -0.02em;
          }

          .panel p {
            margin: 0 auto;
            color: var(--mut);
            font-size: 14.5px;
            max-width: 30ch;
          }

          .sp-spinner {
            width: 48px;
            height: 48px;
            margin: 0 auto;
            display: block;
            animation: spin 0.85s linear infinite !important;
            transform-origin: 50% 50%;
          }

          .okc {
            width: 84px;
            height: 84px;
            margin: 0 auto;
            display: block;
          }

          .okc circle {
            fill: #e6f7ee;
            stroke: var(--ok);
            stroke-width: 3;
            stroke-dasharray: 252;
            stroke-dashoffset: 252;
            animation: dr 0.6s ease-out forwards;
          }

          .okc path {
            fill: none;
            stroke: var(--ok);
            stroke-width: 5;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: dr 0.4s 0.5s ease-out forwards;
          }

          @keyframes dr {
            to { stroke-dashoffset: 0; }
          }

          .rcp {
            margin: 24px 0 18px;
            background: var(--soft);
            border-radius: 16px;
            padding: 4px 16px;
            text-align: left;
          }

          .rcp div {
            display: flex;
            justify-content: space-between;
            padding: 11px 0;
            font-size: 14px;
            color: var(--mut);
            border-bottom: 1px dashed #d8dde6;
          }

          .rcp div:last-child {
            border-bottom: 0;
          }

          .rcp div span:last-child {
            color: var(--ink);
            font-weight: 600;
          }

          .xic {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #fff1d6;
            color: var(--warn);
            display: grid;
            place-items: center;
            margin: 0 auto;
          }

          .xic svg {
            width: 30px;
            height: 30px;
            stroke: currentColor;
            fill: none;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .track div, .prog div, .rg-fg { transition: none; }
          .sp, .sp-spinner { animation-duration: 2s; }
          .secure i { animation: none; }
          .okc circle, .okc path { animation-duration: 0.01s; animation-delay: 0s; }
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
