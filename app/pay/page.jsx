'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import DesktopCheckoutView from '@/components/DesktopCheckoutView';

/* ── Original MyMobPay Website Logo (Dual-color Blue/Orange M mark + MyMobPay) ── */
const MyMobPayLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, userSelect: 'none' }}>
    <svg width="28" height="25" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {/* Left Blue Stroke */}
      <path
        d="M 7 28.5 V 13.5 C 7 7.5 12 5.5 16 8.5 L 19 19"
        stroke="#0284C7"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Orange Stroke */}
      <path
        d="M 19 19 L 22 8.5 C 26 5.5 31 7.5 31 13.5 V 28.5"
        stroke="#FF7800"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span style={{
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: 800,
      fontSize: 24,
      color: 'var(--head)',
      letterSpacing: '-0.02em',
    }}>MyMobPay</span>
  </div>
);

/* ── Robust UPI VPA Resolver (Safeguard against 'pending@upi' or empty VPA) ── */
function getValidUpiId(merchant) {
  const vpa = merchant?.upi_id?.trim();
  if (vpa && vpa !== 'pending@upi' && vpa.includes('@') && !vpa.startsWith('pending@')) {
    return vpa;
  }
  return CONFIG.upiId || '9410181307@okbizaxis';
}

/* ── UPI deep-link builder ──────────────────────────────────── */
function buildUpiLink(appId, amount, orderId, merchant, isMandate) {
  const pa    = getValidUpiId(merchant);
  const rawPn = merchant?.business_name && merchant.business_name !== 'Demo Store'
    ? merchant.business_name
    : (CONFIG.businessName && CONFIG.businessName !== 'Demo Store' ? CONFIG.businessName : 'MyMobPay');
  const pn    = encodeURIComponent(rawPn);
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
  const pa    = getValidUpiId(merchant);
  const rawPn = merchant?.business_name && merchant.business_name !== 'Demo Store'
    ? merchant.business_name
    : (CONFIG.businessName && CONFIG.businessName !== 'Demo Store' ? CONFIG.businessName : 'MyMobPay');
  const pn    = encodeURIComponent(rawPn);
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
  const paramProject  = searchParams.get('project')  || searchParams.get('merchant') || searchParams.get('biz') || searchParams.get('business_name') || searchParams.get('store') || '';
  const paramCallback = searchParams.get('callback') || searchParams.get('callback_url') || searchParams.get('redirect_url') || searchParams.get('return_url') || searchParams.get('redirect') || '';
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
  const isPlatformKey = (paramApiKey || '').replace(/^(test_|live_)/, '') === CONFIG.platformApiKey;
  const isSetupOrSubscription = isMandate || (orderNote && (orderNote.includes('Trial_Setup') || orderNote.includes('Autopay') || orderNote.includes('Subscription')));

  const upiId         = getValidUpiId(merchant);
  const rawBizName    = (merchant?.business_name && merchant.business_name !== 'Demo Store')
    ? merchant.business_name
    : (paramProject || (isPlatformKey || isSetupOrSubscription ? 'MyMobPay' : (CONFIG.businessName && CONFIG.businessName !== 'Demo Store' ? CONFIG.businessName : 'Merchant')));
  const bizName       = rawBizName === 'Demo Store' ? (isPlatformKey || isSetupOrSubscription ? 'MyMobPay' : 'Merchant') : rawBizName;
  const bizInitial    = (bizName || 'M').charAt(0).toUpperCase();
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

    fetch(`/api/merchant?key=${encodeURIComponent(key)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.business_name) {
          if (data.business_name === 'Demo Store') {
            data.business_name = (key === CONFIG.platformApiKey) ? 'MyMobPay' : 'Merchant';
          }
          setMerchant(prev => ({ ...prev, ...data }));
        } else {
          supabase.from('merchants')
            .select('id, business_name, upi_id, theme_color, sandbox_mode, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer, crypto_wallet_address, crypto_network')
            .eq('api_key', key).single()
            .then(({ data: sbData }) => {
              if (sbData) {
                if (sbData.business_name === 'Demo Store') {
                  sbData.business_name = (key === CONFIG.platformApiKey) ? 'MyMobPay' : 'Merchant';
                }
                setMerchant(sbData);
              }
            });
        }
      })
      .catch(() => {
        supabase.from('merchants')
          .select('id, business_name, upi_id, theme_color, sandbox_mode, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer, crypto_wallet_address, crypto_network')
          .eq('api_key', key).single()
          .then(({ data: sbData }) => {
            if (sbData) {
              if (sbData.business_name === 'Demo Store') {
                sbData.business_name = (key === CONFIG.platformApiKey) ? 'MyMobPay' : 'Merchant';
              }
              setMerchant(sbData);
            }
          });
      });
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

  /* ── Real-time order verification polling (Minimum delay) ── */
  useEffect(() => {
    if (!orderId || confirmed) return;

    let isMounted = true;

    const checkOrderStatus = async () => {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data && (data.status === 'verified' || data.status === 'completed' || data.status === 'paid')) {
          handleSuccess();
        }
      } catch {}
    };

    // Immediate check on mount/ID update
    checkOrderStatus();

    // Fast polling: check every 1000ms for minimum verification latency
    const interval = setInterval(checkOrderStatus, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
  async function triggerChecking() {
    if (isChecking) return;
    setIsChecking(true);
    setCheckMsg('Checking transaction status…');

    const targetId = orderId || activeId;
    if (!targetId) {
      setIsChecking(false);
      setCheckMsg('Payment session initializing. Please wait a moment.');
      return;
    }

    try {
      const res = await fetch('/api/orders/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: targetId })
      });

      const data = await res.json();
      if (res.ok && data?.verified) {
        setCheckMsg('✓ Payment verified! Redirecting…');
        handleSuccess();
        return;
      }

      setCheckMsg(data?.message || 'Payment pending bank confirmation. If already paid via UPI, enter your 12-digit UTR below.');
      setShowUtr(true);
    } catch (err) {
      console.error('Status check error:', err);
      try {
        const fallbackRes = await fetch(`/api/orders?id=${targetId}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData?.status === 'verified') {
          setCheckMsg('✓ Payment verified! Redirecting…');
          handleSuccess();
          return;
        }
      } catch {}
      setCheckMsg('Payment pending bank confirmation. If already paid via UPI, enter your 12-digit UTR below.');
      setShowUtr(true);
    } finally {
      setIsChecking(false);
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
    let cb = typeof window !== 'undefined' ? (localStorage.getItem(`callback_${activeId}`) || paramCallback) : '';
    if (cb) {
      let resolved = cb.trim();
      if (!/^https?:\/\//i.test(resolved) && !resolved.startsWith('/')) {
        resolved = `https://${resolved}`;
      }
      try {
        const url = new URL(resolved, window.location.origin);
        url.searchParams.set('order_id', activeId);
        url.searchParams.set('status', 'verified');
        window.location.href = url.toString();
        return;
      } catch {
        window.location.href = cb + (cb.includes('?') ? '&' : '?') + `order_id=${activeId}&status=verified`;
        return;
      }
    }

    // Check external referrer before pushing to status
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin !== window.location.origin) {
          window.location.href = document.referrer;
          return;
        }
      } catch {}
    }

    router.push(`/status/${activeId}`);
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
        {/* ── HEADER (Shown only on non-vPay views to keep vPay clean like mockup) ── */}
        {curView !== 'vPay' && (
          <>
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
          </>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div className="scr">
          {/* Test mode banner */}
          {orderMode === 'test' && (
            <div style={{ marginBottom: 14, background: '#fff8e7', border: '1px solid #f0c040', borderRadius: 12, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#856404', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Test mode &mdash; simulated sandbox transaction
            </div>
          )}


          {/* VIEW 1: PAY — Matches Reference Design (Phone dot + Pristine White Card + Themed QR Stand) */}
          {curView === 'vPay' && (
            <div id="vPay">
              {/* Subtle top camera dot (mockup aesthetic) */}
              <div className="mob-phone-dot" aria-hidden="true" />

              {/* Main Pristine White Payment Card */}
              <div className="mob-checkout-card">
                {/* 1. Centered Brand Header: Blue/Orange M Logo + MyMobPay */}
                <div className="mob-brand-header">
                  <svg width="32" height="28" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5"
                      stroke="#0284C7"
                      strokeWidth="5.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5"
                      stroke="#FF7800"
                      strokeWidth="5.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="mob-brand-title">MyMobPay</span>
                </div>

                {/* 2. Total Amount Display */}
                <div className="mob-total-display">
                  TOTAL: {fmtInr(displayAmt)}
                </div>

                {/* 3. Timer Pill: Clock icon + Expires in: mm:ss */}
                <div className="mob-timer-pill-wrap">
                  <div className={`mob-timer-pill ${isTimerLow ? 'low' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="mob-timer-label">Expires in:</span>
                    <span className="mob-timer-digits">{mm}:{ss}</span>
                  </div>
                </div>

                {/* 4. Themed QR Frame with 4 Orange Corners and Center M Badge */}
                <div className="mob-qr-container">
                  <div className="mob-qr-frame">
                    <span className="mob-corner mob-corner-tl" />
                    <span className="mob-corner mob-corner-tr" />
                    <span className="mob-corner mob-corner-bl" />
                    <span className="mob-corner mob-corner-br" />

                    <div className="mob-qr-inner">
                      {upiQrValue ? (
                        <>
                          <QRCode
                            value={upiQrValue}
                            size={196}
                            level="Q"
                            fgColor="#0f172a"
                            bgColor="#ffffff"
                            style={{ display: 'block', width: '100%', height: 'auto' }}
                          />
                          {/* Centered QR Badge with Dual-color M Logo */}
                          <div className="mob-qr-center-pill">
                            <svg width="24" height="22" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5"
                                stroke="#0284C7"
                                strokeWidth="5.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5"
                                stroke="#FF7800"
                                strokeWidth="5.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div style={{ width: 196, height: 196, display: 'grid', placeItems: 'center', color: '#64748b', fontSize: 13 }}>
                          Generating QR…
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Verified Merchant Pill */}
                <div className="mob-merchant-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  <span>Verified Merchant &bull; {bizName}</span>
                </div>

                {/* 5b. Payment Verification Advisory Line (Mobile) */}
                <div className="mob-verify-notice">
                  <div className="mob-verify-icon-box">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="mob-verify-ping" />
                    <span className="mob-verify-dot" />
                  </div>
                  <div className="mob-verify-text">
                    <strong className="mob-verify-title">Payment verification may take up to 60 seconds.</strong>{' '}
                    <span className="mob-verify-desc">Please wait and do not close or refresh this screen.</span>
                  </div>
                </div>

                {/* 6. Quick Tap-to-Pay UPI App Launcher Chips */}
                <div className="mob-upi-apps-row">
                  <p className="mob-action-hint">Tap to pay with any UPI app</p>
                  <div className="mob-chips-grid">
                    {UPI_CHIPS.map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          if (!displayAmt) return;
                          window.location.href = buildUpiLink(app.id, displayAmt, activeId, merchant, isMandate);
                        }}
                        className="mob-app-chip"
                        title={`Pay with ${app.label}`}
                      >
                        <img src={app.logo} alt={app.label} style={{ maxHeight: app.h, maxWidth: '85%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Copyable UPI ID Bar */}
                <div className="mob-upi-id-bar">
                  <div className="mob-upi-id-left">
                    <span className="mob-upi-id-label">UPI ID</span>
                    <span className="mob-upi-id-val">{upiId}</span>
                  </div>
                  <button
                    type="button"
                    className={`mob-copy-btn ${copyFeedback ? 'done' : ''}`}
                    onClick={handleCopyUpi}
                  >
                    {copyFeedback ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>

                {/* 8. Live Real-Time Verification Status & UTR Drawer (Stays on same screen!) */}
                {(isChecking || checkMsg || showUtr) ? (
                  <div style={{
                    marginTop: 12,
                    background: checkMsg?.startsWith('✓') ? '#ecfdf5' : '#f8fafc',
                    border: `1.5px solid ${checkMsg?.startsWith('✓') ? '#a7f3d0' : '#e2e8f0'}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isChecking ? (
                        <svg width="20" height="20" viewBox="0 0 48 48" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                          <circle cx="24" cy="24" r="20" stroke="#cbd5e1" strokeWidth="5" fill="none" />
                          <circle cx="24" cy="24" r="20" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="32 94" />
                        </svg>
                      ) : (
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: checkMsg?.startsWith('✓') ? '#10b981' : '#f59e0b',
                          display: 'inline-block',
                          flexShrink: 0
                        }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: checkMsg?.startsWith('✓') ? '#065f46' : '#0f172a' }}>
                          {isChecking ? 'Checking transaction status…' : (checkMsg?.startsWith('✓') ? 'Payment Verified!' : 'Payment Pending Confirmation')}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11.5, color: checkMsg?.startsWith('✓') ? '#047857' : '#64748b', lineHeight: 1.4 }}>
                          {checkMsg || 'Connecting to bank network to confirm your UPI transfer… Payment verification may take up to 60 seconds. Please do not close or refresh this screen.'}
                        </p>
                      </div>
                    </div>

                    {/* UTR Input Section */}
                    {showUtr && !checkMsg?.startsWith('✓') && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                          Already paid? Verify 12-digit UTR now:
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            inputMode="numeric"
                            maxLength={12}
                            placeholder="12-digit UTR reference"
                            value={utr}
                            onChange={e => { setUtr(e.target.value.replace(/\D/g, '').slice(0, 12)); setUtrMsg(''); }}
                            style={{
                              flex: 1,
                              minHeight: 40,
                              border: '1px solid #cbd5e1',
                              borderRadius: 10,
                              padding: '0 10px',
                              fontSize: 13,
                              fontFamily: "'IBM Plex Mono', monospace",
                              background: '#fff',
                              outline: 'none',
                              color: '#0f172a'
                            }}
                          />
                          <button
                            type="button"
                            disabled={utr.length !== 12 || utrBusy}
                            onClick={submitUtr}
                            style={{
                              minHeight: 40,
                              padding: '0 14px',
                              border: 0,
                              borderRadius: 10,
                              background: '#0284C7',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: utr.length === 12 && !utrBusy ? 'pointer' : 'not-allowed',
                              opacity: utr.length === 12 && !utrBusy ? 1 : 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            {utrBusy ? '…' : 'Verify'}
                          </button>
                        </div>
                        {utrMsg && (
                          <p style={{ margin: '6px 0 0', fontSize: 11.5, fontWeight: 600, color: utrMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                            {utrMsg}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUtr(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: 11.5,
                      fontWeight: 600,
                      marginTop: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <span>Paid via UPI app? Enter 12-digit UTR to verify</span>
                    <span>›</span>
                  </button>
                )}
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


          {/* VIEW 3: SUCCESS */}
          {curView === 'vOk' && (
            <div id="vOk" style={{ padding: '24px 16px' }}>
              <div className="panel" style={{ padding: '32px 20px', textAlign: 'center', borderRadius: 24, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                
                {/* Floating Trust Pill */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#065f46', borderRadius: 9999, padding: '6px 14px', marginBottom: 16, border: '1px solid #a7f3d0', fontSize: 11, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span>Payment Verified • mymob.tech</span>
                </div>

                {/* Animated Green Tick Icon */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: '#d1fae5', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                  <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)', border: '4px solid #ffffff' }}>
                    <svg style={{ width: 40, height: 40, color: '#ffffff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                  Payment Successful!
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px', fontWeight: 500 }}>
                  {fmtInr(displayAmt)} paid to <strong>{bizName}</strong>
                </p>

                <div className="rcp" style={{ textAlign: 'left', margin: '16px 0', background: '#f8fafc', padding: '16px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <div><span>Order Reference</span><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{activeId ? activeId.slice(-8).toUpperCase() : 'DEMO'}</span></div>
                  <div><span>Amount Paid</span><span style={{ color: '#059669', fontWeight: 800 }}>{fmtInr(displayAmt)}</span></div>
                  <div><span>Payment Method</span><span>UPI Instant Settlement</span></div>
                  <div><span>Transaction Status</span><span style={{ color: '#059669', fontWeight: 700 }}>✓ Verified & Paid</span></div>
                  <div><span>Settlement Time</span><span>{okTime || new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}</span></div>
                </div>

                <button
                  type="button"
                  className="pri wide"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', border: 'none', padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handleReturn}
                >
                  <span>Return to {bizName}</span>
                  <span>→</span>
                </button>
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
              disabled={isChecking}
              onClick={triggerChecking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                opacity: isChecking ? 0.85 : 1
              }}
            >
              {isChecking ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 48 48" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.3)" strokeWidth="5" fill="none" />
                    <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="32 94" />
                  </svg>
                  <span>Checking…</span>
                </>
              ) : (
                <>I&apos;ve paid</>
              )}
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
           DESKTOP VIEWPORT STYLES (>= 768px): Custom Hosted Checkout
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
            background: #f2f3ff;
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
            background: #f4f6fa;
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
            padding: 12px 16px 90px;
          }

          /* ── Mockup Phone Punch Hole / Camera Dot ── */
          .mob-phone-dot {
            width: 8px;
            height: 8px;
            background: #94a3b8;
            border-radius: 50%;
            margin: 4px auto 14px;
            opacity: 0.85;
          }

          /* ── Mobile Checkout Pure Solid White Card ── */
          .mob-checkout-card {
            background: #ffffff;
            border-radius: 28px;
            border: 1.5px solid #edf2f7;
            box-shadow: 0 10px 30px -4px rgba(16, 24, 40, 0.08), 0 4px 12px -2px rgba(16, 24, 40, 0.04);
            padding: 26px 18px 22px;
            text-align: center;
            margin-bottom: 16px;
          }

          /* ── Brand Header (M Mark + MyMobPay) ── */
          .mob-brand-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 16px;
            user-select: none;
          }

          .mob-brand-title {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 800;
            font-size: 26px;
            color: #1e293b;
            letter-spacing: -0.02em;
            line-height: 1;
          }

          /* ── TOTAL: ₹1,250.00 ── */
          .mob-total-display {
            font-size: 23px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: 0.03em;
            margin-bottom: 12px;
            line-height: 1.2;
            text-transform: uppercase;
          }

          /* ── Pill: Expires in: mm:ss ── */
          .mob-timer-pill-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 22px;
          }

          .mob-timer-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 5px 16px;
            border-radius: 9999px;
            font-size: 13px;
            box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
          }

          .mob-timer-pill.low {
            background: #fef3c7;
            border-color: #fde68a;
          }

          .mob-timer-label {
            color: #64748b;
            font-weight: 500;
            font-size: 12.5px;
          }

          .mob-timer-digits {
            color: #0f172a;
            font-weight: 700;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13px;
            letter-spacing: 0.03em;
          }

          .mob-timer-pill.low .mob-timer-label,
          .mob-timer-pill.low .mob-timer-digits {
            color: #b45309;
          }

          /* ── Themed QR Stand with Orange Corners ── */
          .mob-qr-container {
            display: flex;
            justify-content: center;
            margin-bottom: 18px;
          }

          .mob-qr-frame {
            position: relative;
            padding: 14px;
            background: #ffffff;
            display: inline-block;
          }

          .mob-corner {
            position: absolute;
            width: 30px;
            height: 30px;
            border: 3.5px solid #e07a27;
            pointer-events: none;
          }

          .mob-corner-tl {
            top: 0;
            left: 0;
            border-right: none;
            border-bottom: none;
            border-top-left-radius: 12px;
          }

          .mob-corner-tr {
            top: 0;
            right: 0;
            border-left: none;
            border-bottom: none;
            border-top-right-radius: 12px;
          }

          .mob-corner-bl {
            bottom: 0;
            left: 0;
            border-right: none;
            border-top: none;
            border-bottom-left-radius: 12px;
          }

          .mob-corner-br {
            bottom: 0;
            right: 0;
            border-left: none;
            border-top: none;
            border-bottom-right-radius: 12px;
          }

          .mob-qr-inner {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
          }

          .mob-qr-center-pill {
            position: absolute;
            inset: 0;
            margin: auto;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #f1f5f9;
            pointer-events: none;
          }

          /* ── Verified Merchant Badge ── */
          .mob-merchant-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ecfdf5;
            border: 1px solid #d1fae5;
            color: #065f46;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-bottom: 4px;
          }

          /* ── Payment Verification Advisory Line ── */
          .mob-verify-notice {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fffbeb;
            border: 1px solid #fef08a;
            border-radius: 14px;
            padding: 8px 12px;
            margin: 10px 0 4px;
            text-align: left;
            box-shadow: 0 1px 3px rgba(245, 158, 11, 0.06);
          }

          .mob-verify-icon-box {
            position: relative;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: #fef3c7;
            border: 1px solid #fde68a;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #b45309;
          }

          .mob-verify-ping {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #f59e0b;
            animation: mob-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          }

          .mob-verify-dot {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #d97706;
          }

          @keyframes mob-ping {
            75%, 100% {
              transform: scale(2.2);
              opacity: 0;
            }
          }

          .mob-verify-text {
            flex: 1;
            font-size: 11.5px;
            line-height: 1.4;
            color: #78350f;
          }

          .mob-verify-title {
            font-weight: 700;
            color: #92400e;
            display: inline;
          }

          .mob-verify-desc {
            font-weight: 500;
            color: #b45309;
            display: inline;
          }

          /* ── Direct UPI App Launcher Row ── */
          .mob-upi-apps-row {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px dashed #e2e8f0;
          }

          .mob-action-hint {
            margin: 0 0 10px;
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-align: center;
          }

          .mob-chips-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .mob-app-chip {
            all: unset;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
            transition: transform 0.15s, border-color 0.15s;
          }

          .mob-app-chip:active {
            transform: scale(0.96);
          }

          /* ── UPI ID Copy Bar ── */
          .mob-upi-id-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 8px 8px 8px 14px;
            margin-top: 14px;
            text-align: left;
          }

          .mob-upi-id-left {
            min-width: 0;
            display: flex;
            flex-direction: column;
          }

          .mob-upi-id-label {
            font-size: 10.5px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .mob-upi-id-val {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13.5px;
            font-weight: 600;
            color: #0f172a;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .mob-copy-btn {
            border: 0;
            background: #eaf2fe;
            color: #1c6ee0;
            font-weight: 700;
            font-size: 13px;
            padding: 0 16px;
            min-height: 38px;
            border-radius: 10px;
            cursor: pointer;
            flex: none;
            transition: all 0.15s;
          }

          .mob-copy-btn.done {
            background: #dcfce7;
            color: #15803d;
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
            border: 3.5px solid #ff7800;
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
