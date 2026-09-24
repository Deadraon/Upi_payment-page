'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';

/* ── Original MyMobPay Logo (Outfit + Orbitron brand fonts) ─── */
const MyMobPayLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, lineHeight: 1, userSelect: 'none' }}>
    <span style={{
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800,
      fontSize: 24,
      color: '#0f1b2d',
      letterSpacing: '-0.02em',
    }}>MyMob</span>
    <span style={{
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: 900,
      fontStyle: 'italic',
      fontSize: 24,
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
  { id: 'phonepe', label: 'PhonePe',    logo: '/logos/phonepe.svg', h: 18 },
  { id: 'gpay',    label: 'Google Pay', logo: '/logos/gpay.svg',    h: 17 },
  { id: 'paytm',   label: 'Paytm',      logo: '/logos/paytm.svg',   h: 13 },
  { id: 'bhim',    label: 'BHIM',       logo: '/logos/bhim.svg',    h: 14 },
];

/* ──────────────────────────────────────────────────────────────
   Main checkout component
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

  /* View navigation: 'vPay' | 'vWait' | 'vOk' | 'vExp' */
  const [curView,      setCurView]      = useState('vPay');
  const [checkMsg,     setCheckMsg]     = useState('');

  /* Accordion state: '' | 'pBank' | 'pUsdt' */
  const [activeAcc,    setActiveAcc]    = useState('');

  /* Session Countdown Timer (327 seconds default) */
  const SESSION_SECS = 327;
  const [timeLeft, setTimeLeft] = useState(SESSION_SECS);

  /* Copy feedback state */
  const [copied,       setCopied]       = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyUsdtDone, setCopyUsdtDone] = useState(false);
  const copiedRef = useRef(false);
  const curViewRef = useRef('vPay');

  useEffect(() => {
    curViewRef.current = curView;
  }, [curView]);

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

  /* Success timestamp */
  const [okTime,       setOkTime]       = useState('');

  /* Bank copy states */
  const [copiedAcc,    setCopiedAcc]    = useState(false);
  const [copiedIfsc,   setCopiedIfsc]   = useState(false);

  const autoCreated = useRef(false);
  const [tempId, setTempId] = useState('MMP-DEMO');
  useEffect(() => {
    setTempId('MMP' + Math.random().toString(36).substring(2, 7).toUpperCase());
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
      if (paramAmount) {
        setOrderAmount(parseFloat(paramAmount));
      } else {
        fetch(`/api/orders?id=${paramOrderId}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => {
            if (!d) return;
            if (d.amount != null) setOrderAmount(parseFloat(d.amount));
            if (d.mode)           setOrderMode(d.mode);
            if (d.note)           setOrderNote(d.note);
            if (d.merchant)       setMerchant(d.merchant);
          })
          .catch(() => {});
      }
      return;
    }

    if (paramAmount || paramLid) {
      autoCreated.current = true;
      createOrder(parseFloat(paramAmount || 0), paramName, paramPhone, paramRef, paramNote, paramCallback, paramProject, paramLid);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Countdown timer ── */
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (curViewRef.current === 'vOk') return prev;
        if (prev <= 1) {
          setCurView('vExp');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Realtime Order updates ── */
  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`pay-${activeId}`).on('postgres_changes', { event:'UPDATE', schema:'public', table:'orders', filter:`id=eq.${activeId}` }, p => {
      if (p.new?.status === 'verified') {
        handleSuccess();
      }
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Polling fallback ── */
  useEffect(() => {
    if (!orderId || confirmed) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/orders?id=${orderId}`);
        if (r.ok) {
          const d = await r.json();
          if (d?.status === 'verified') {
            handleSuccess();
          }
        }
      } catch {}
    }, 3500);
    return () => clearInterval(t);
  }, [orderId, confirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-check on visibility change when returning from UPI app ── */
  useEffect(() => {
    const handleVis = () => {
      if (!document.hidden && copiedRef.current && curViewRef.current === 'vPay') {
        copiedRef.current = false;
        triggerChecking();
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSuccess() {
    setConfirmed(true);
    setOkTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    setCurView('vOk');
    try { navigator.vibrate?.(40); } catch {}
  }

  function triggerChecking() {
    if (curViewRef.current !== 'vPay' && curViewRef.current !== 'vWait') return;
    setCurView('vWait');
    setCheckMsg('Hang on, this takes a few seconds.');
    
    // Check order status
    if (orderId) {
      fetch(`/api/orders?id=${orderId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.status === 'verified') {
            handleSuccess();
          } else {
            setTimeout(() => {
              if (curViewRef.current === 'vWait') {
                setCheckMsg("No payment matched yet. If you have completed the transfer, submit your 12-digit UTR below.");
              }
            }, 3000);
          }
        })
        .catch(() => {
          setCheckMsg("Could not verify status. Please try again or enter your UTR.");
        });
    } else {
      // Demo simulation
      setTimeout(() => {
        handleSuccess();
      }, 2600);
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
    try { navigator.clipboard.writeText(upiId); } catch {}
    try { navigator.vibrate?.(15); } catch {}
    setCopied(true);
    copiedRef.current = true;
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  /* Copy USDT Address */
  const handleCopyUsdt = () => {
    try { navigator.clipboard.writeText(cryptoWallet); } catch {}
    try { navigator.vibrate?.(15); } catch {}
    setCopyUsdtDone(true);
    setTimeout(() => setCopyUsdtDone(false), 1500);
  };

  /* Copy Bank Account Number */
  const handleCopyAcc = () => {
    try { navigator.clipboard.writeText(bankAcc); } catch {}
    try { navigator.vibrate?.(15); } catch {}
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 1500);
  };

  /* Copy Bank IFSC Code */
  const handleCopyIfsc = () => {
    try { navigator.clipboard.writeText(bankIfsc); } catch {}
    try { navigator.vibrate?.(15); } catch {}
    setCopiedIfsc(true);
    setTimeout(() => setCopiedIfsc(false), 1500);
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
        body: JSON.stringify({ order_id: activeId, tx_hash: txHash.trim(), network: cryptoNetwork, wallet_address: cryptoWallet })
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
      <div className="app" style={{ justifyContent: 'center' }}>
        <div className="hd">
          <div className="lg"><MyMobPayLogo /></div>
          <div className="sec">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V8a4 4 0 018 0v3"/>
            </svg>
            Secure checkout
          </div>
        </div>

        <div className="scr" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="sum">
            <h1 style={{ font: '800 20px/1.2 "DM Sans",sans-serif', color: 'var(--ink)', margin: '0 0 6px' }}>Enter payment amount</h1>
            <p style={{ font: '500 13.5px "DM Sans",sans-serif', color: 'var(--mut)', margin: '0 0 20px' }}>Generate a direct UPI checkout session.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!amount || parseFloat(amount) <= 0) {
                setError('Please enter a valid amount.');
                return;
              }
              createOrder(parseFloat(amount), custName, custPhone, paramRef, paramNote, paramCallback, paramProject, paramLid);
            }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Amount (INR)</label>
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
                    style={{ padding: '8px 0', font: '700 12.5px "DM Sans",sans-serif', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', color: 'var(--mut)', cursor: 'pointer' }}
                  >
                    ₹{q}
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Your name <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                style={{ width: '100%', minHeight: 46, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px', font: '500 14px "DM Sans",sans-serif', color: 'var(--ink)', background: 'var(--soft)', outline: 'none', marginBottom: 14 }}
              />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Phone <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
              <input
                type="tel"
                placeholder="9876543210"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                style={{ width: '100%', minHeight: 46, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px', font: '500 14px "DM Sans",sans-serif', color: 'var(--ink)', background: 'var(--soft)', outline: 'none', marginBottom: 18 }}
              />

              {error && <p style={{ color: '#c0392b', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="pri wide"
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}
              >
                {loading ? <span className="sp" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
                <span>{loading ? 'Creating session…' : 'Generate Payment QR'}</span>
              </button>
            </form>

            <div className="trust">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <span>0% transaction fee. Funds go straight to merchant.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────
     MAIN CHECKOUT UI (Mirrors 'MyMobPay checkout (no deep links).html')
  ─────────────────────────────────────────────────────────── */
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timerPct = ((timeLeft / SESSION_SECS) * 100).toFixed(1);
  const strokeOffset = (100 - (timeLeft / SESSION_SECS) * 100).toFixed(1);
  const isTimerLow = timeLeft <= 60;

  return (
    <div className="app">
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
      <div className={`prog ${isTimerLow ? 'low' : ''}`} id="prog">
        <div id="pg" style={{ width: `${timerPct}%` }} />
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="scr" id="scr">
        
        {/* Test mode banner */}
        {orderMode === 'test' && (
          <div style={{ marginBottom: 14, background: '#fff8e7', border: '1px solid #f0c040', borderRadius: 12, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#856404', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            Test mode &mdash; simulated sandbox transaction
          </div>
        )}

        {/* ── AMOUNT CARD WITH TIMER RING (Hidden on success/expired) ── */}
        {(curView === 'vPay' || curView === 'vWait') && (
          <div className="sum" id="hero">
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
              <div className={`ringw ${isTimerLow ? 'low' : ''}`} id="chip" role="timer" aria-label="Session time left">
                <svg viewBox="0 0 60 60" aria-hidden="true">
                  <circle className="rg-bg" cx="30" cy="30" r="26" fill="none" strokeWidth="4"/>
                  <circle
                    className="rg-fg"
                    id="ring"
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

        {/* ── VIEW 1: PAY ── */}
        {curView === 'vPay' && (
          <div id="vPay">
            <div className="gh">Pay with UPI</div>
            <div className="card" id="pUpi">
              <div className="pc">
                <p className="tip" style={{ textAlign: 'center', margin: '0 0 14px' }}>
                  Scan with any UPI app, or pay to the UPI ID
                </p>
                
                {/* QR Box with corner brackets */}
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
                
                {/* UPI ID Copy box */}
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

                {/* 3-Step Guide */}
                <ol className="how">
                  <li>On this phone? Copy the UPI ID above</li>
                  <li>Pay {fmtInr(displayAmt)} in any UPI app</li>
                  <li>Come back here and tap &quot;I&apos;ve paid&quot;</li>
                </ol>

                {/* Direct UPI App launcher chips with original app logos */}
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
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 40,
                          padding: '6px 8px',
                          border: '1px solid var(--line)',
                          borderRadius: 12,
                          background: '#fff',
                          boxShadow: '0 1px 2px rgba(16,24,40,.04)',
                          transition: 'all 0.15s'
                        }}
                        title={`Pay with ${app.label}`}
                      >
                        <img
                          src={app.logo}
                          alt={app.label}
                          style={{ maxHeight: app.h, maxWidth: '85%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }}
                        />
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
                {/* Bank Account Details */}
                <div style={{ marginTop: 6, background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Account Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                    <span style={{ color: 'var(--mut)', fontWeight: 600 }}>Account Name</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{bankName}</span>
                  </div>

                  {/* Account Number with Copy button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 13, background: 'var(--soft)' }}>
                    <div>
                      <span style={{ color: 'var(--mut)', fontWeight: 600, display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Number</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{bankAcc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAcc}
                      style={{
                        border: 0,
                        background: copiedAcc ? '#dcf5e8' : 'var(--tint)',
                        color: copiedAcc ? '#0d7a47' : 'var(--brand-d)',
                        fontWeight: 700,
                        fontSize: 12,
                        padding: '6px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {copiedAcc ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  {/* IFSC Code with Copy button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: bankBranch ? '1px solid var(--line)' : 'none', fontSize: 13, background: 'var(--soft)' }}>
                    <div>
                      <span style={{ color: 'var(--mut)', fontWeight: 600, display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>IFSC Code</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{bankIfsc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyIfsc}
                      style={{
                        border: 0,
                        background: copiedIfsc ? '#dcf5e8' : 'var(--tint)',
                        color: copiedIfsc ? '#0d7a47' : 'var(--brand-d)',
                        fontWeight: 700,
                        fontSize: 12,
                        padding: '6px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {copiedIfsc ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  {/* Bank Name (only if merchant configured a bank name) */}
                  {bankBranch && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                      <span style={{ color: 'var(--mut)', fontWeight: 600 }}>Bank</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{bankBranch}</span>
                    </div>
                  )}

                  {/* Amount to transfer */}
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
                id="utrT"
                aria-expanded={showUtr}
                onClick={() => setShowUtr(!showUtr)}
              >
                <span>Already paid? Enter your UTR</span>
                <span aria-hidden="true" style={{ transform: showUtr ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
              </button>
              <div className={`utr ${showUtr ? '' : 'hide'}`} id="utrB">
                <input
                  id="utr"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={12}
                  autoComplete="off"
                  placeholder="12-digit UTR"
                  aria-label="UTR reference"
                  value={utr}
                  onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                />
                <button
                  id="utrV"
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

            {/* Promo code link & expander */}
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
                  type="text"
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

            {/* Trust footer */}
            <div className="trust">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <span>0% transaction fee. Your payment goes straight to the merchant.</span>
            </div>
          </div>
        )}

        {/* ── VIEW 2: WAIT / CHECKING ── */}
        {curView === 'vWait' && (
          <div id="vWait">
            <div className="gh" style={{ marginTop: 16 }}>Payment status</div>
            <div className="panel">
              <div className="sp-wrap" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                <svg className="sp-spinner" width="48" height="48" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <circle cx="24" cy="24" r="20" stroke="var(--tint)" strokeWidth="4.5" fill="none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="var(--brand)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="32 94"
                  />
                </svg>
              </div>
              <h2 id="wT">Checking your payment</h2>
              <p id="wP">{checkMsg || 'Hang on, this takes a few seconds.'}</p>

              {/* Inline UTR verification box */}
              <div style={{ marginTop: 18, background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 14, padding: 12, textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Already paid? Verify 12-digit UTR now:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                    style={{ minHeight: 44, padding: '0 16px', border: 0, borderRadius: 10, background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: (utr.length !== 12 || utrBusy) ? 0.5 : 1 }}
                  >
                    {utrBusy ? '…' : 'Verify'}
                  </button>
                </div>
                {utrMsg && <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 600, color: utrMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b' }}>{utrMsg}</p>}
              </div>

              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="ghost"
                  id="wBack"
                  onClick={() => setCurView('vPay')}
                >
                  Back to payment options
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: SUCCESS ── */}
        {curView === 'vOk' && (
          <div id="vOk">
            <div className="panel">
              <svg className="okc" viewBox="0 0 84 84" aria-hidden="true">
                <circle cx="42" cy="42" r="40"/>
                <path d="M26 43l11 11 21-23"/>
              </svg>
              <h2>Payment received</h2>
              <p>{fmtInr(displayAmt)} paid to {bizName}</p>
              <div className="rcp">
                <div><span>Order ID</span><span>#{activeId ? activeId.slice(-8).toUpperCase() : 'DEMO'}</span></div>
                <div><span>Method</span><span>UPI</span></div>
                <div><span>Platform fee</span><span>₹0.00</span></div>
                <div><span>Time</span><span id="okTime">{okTime || new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}</span></div>
              </div>
              <button
                type="button"
                className="pri wide"
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
          </div>
        )}

        {/* ── VIEW 4: EXPIRED ── */}
        {curView === 'vExp' && (
          <div id="vExp">
            <div className="panel">
              <div className="xic">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              </div>
              <h2>Session expired</h2>
              <p>This payment session has ended. Start again to get a fresh code.</p>
              <button
                type="button"
                className="pri wide"
                id="again"
                style={{ marginTop: 22 }}
                onClick={() => {
                  setTimeLeft(SESSION_SECS);
                  setCurView('vPay');
                }}
              >
                Start again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM FIXED BAR (Only shown on vPay) ── */}
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
            onClick={triggerChecking}
          >
            I&apos;ve paid
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Page Wrapper with Styles
────────────────────────────────────────────────────────────── */
export default function PayPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Orbitron:wght@800;900&family=Outfit:wght@700;800&display=swap');

        :root {
          color-scheme: light;
          --page: #eef2f8;
          --card: #fff;
          --ink: #101828;
          --mut: #667085;
          --line: #eaecf0;
          --soft: #f6f8fb;
          --tint: #eaf2fe;
          --brand: #2f86f6;
          --brand-d: #1c6ee0;
          --ok: #12995d;
          --warn: #b76e00;
          box-sizing: border-box;
          padding-top: env(safe-area-inset-top, 0px);
          background: var(--page);
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

        .app {
          max-width: 430px;
          margin: 0 auto;
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--page);
        }

        /* ── Header ── */
        .hd {
          background: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          border-bottom: 1px solid var(--line);
        }

        .lg {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .mk {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(160deg, #4a9bff, #2378f0);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 15px;
          box-shadow: 0 6px 12px -6px #2f86f6;
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
          padding: 16px 16px 20px;
        }

        /* ── Amount card with timer ring ── */
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

        .tm {
          font-variant-numeric: tabular-nums;
        }

        /* ── Groups ── */
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

        .row:active {
          background: var(--soft);
        }

        .row:focus-visible {
          outline: 3px solid #7fb0ff;
          outline-offset: -3px;
        }

        .card > :last-child {
          border-bottom: 0;
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

        .banks {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .banks button {
          min-height: 48px;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }

        .banks button:hover {
          border-color: var(--brand);
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

        .utrc > button.t:focus-visible {
          outline: 3px solid #7fb0ff;
          border-radius: 8px;
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

        .utr input:focus {
          outline: 3px solid #b9d5ff;
          border-color: var(--brand);
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

        /* ── Bottom bar ── */
        .bar {
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

        button:focus-visible {
          outline: 3px solid #7fb0ff;
          outline-offset: 2px;
        }

        /* ── States panels ── */
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

        @-webkit-keyframes sp-spin {
          0% { -webkit-transform: rotate(0deg); transform: rotate(0deg); }
          100% { -webkit-transform: rotate(360deg); transform: rotate(360deg); }
        }

        @keyframes sp-spin {
          0% { -webkit-transform: rotate(0deg); transform: rotate(0deg); }
          100% { -webkit-transform: rotate(360deg); transform: rotate(360deg); }
        }

        .sp-spinner {
          width: 48px;
          height: 48px;
          margin: 0 auto;
          display: block;
          -webkit-animation: sp-spin 0.85s linear infinite !important;
          animation: sp-spin 0.85s linear infinite !important;
          -webkit-transform-origin: 50% 50%;
          transform-origin: 50% 50%;
        }

        .sp {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 4.5px solid var(--tint);
          border-top-color: var(--brand);
          margin: 0 auto;
          -webkit-animation: sp-spin 0.85s linear infinite !important;
          animation: sp-spin 0.85s linear infinite !important;
          box-sizing: border-box;
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

        /* ── Centered Card on larger viewports (> 520px) ── */
        @media (min-width: 520px) {
          body {
            padding: 24px 0;
          }
          .app {
            height: min(860px, calc(100vh - 48px));
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 30px 80px -30px rgba(16,24,40,.35), 0 0 0 1px var(--line);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sp, .sp-spinner { animation-duration: 2s; }
          .okc circle, .okc path { animation-duration: 0.01s; animation-delay: 0s; }
          .prog div, .rg-fg { transition: none; }
        }
      `}</style>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', background: '#eef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: '"DM Sans",sans-serif', color: '#667085', fontSize: 14, fontWeight: 600 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #eaf2fe', borderTopColor: '#2f86f6', borderRadius: '50%', animation: 'sp-spin .8s linear infinite' }} />
          Loading checkout…
        </div>
      }>
        <PayPageContent />
      </Suspense>
    </>
  );
}
