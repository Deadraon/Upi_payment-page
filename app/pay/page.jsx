'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';

/* ── Original MyMobPay Logo (Outfit + Orbitron brand fonts) ─── */
const MyMobPayLogo = () => (
  <div style={{ display:'flex', alignItems:'center', gap:0, lineHeight:1, userSelect:'none' }}>
    <span style={{
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800,
      fontSize: 26,
      color: '#0f1b2d',
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
/* Android intent:// URLs break QR scanning — UPI apps expect upi:// */
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
  { id:'phonepe', label:'PhonePe',    dot:'#5f259f' },
  { id:'gpay',    label:'Google Pay', dot:'#1a73e8' },
  { id:'paytm',   label:'Paytm',      dot:'#00b9f1' },
  { id:'bhim',    label:'BHIM',       dot:'#0b5cab' },
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

  /* core state */
  const [merchant,     setMerchant]     = useState(null);
  const [orderId,      setOrderId]      = useState(paramOrderId || null);
  const [orderAmount,  setOrderAmount]  = useState(paramAmount ? parseFloat(paramAmount) : null);
  const [orderMode,    setOrderMode]    = useState('live');
  const [orderNote,    setOrderNote]    = useState(paramNote);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [confirmed,    setConfirmed]    = useState(false);

  /* entry form (no amount) */
  const [amount,       setAmount]       = useState(paramAmount);
  const [custName,     setCustName]     = useState(paramName);
  const [custPhone,    setCustPhone]    = useState(paramPhone);

  /* accordion */
  const [activeMethod, setActiveMethod] = useState('upi');

  /* countdown */
  const SESSION_SECS = 327;
  const [timeLeft,    setTimeLeft]     = useState(SESSION_SECS);

  /* copy */
  const [copied,       setCopied]       = useState(false);

  /* UTR */
  const [showUtr,      setShowUtr]      = useState(false);
  const [utr,          setUtr]          = useState('');
  const [utrBusy,      setUtrBusy]      = useState(false);
  const [utrMsg,       setUtrMsg]       = useState('');

  /* Promo */
  const [showPromo,    setShowPromo]    = useState(false);
  const [promoCode,    setPromoCode]    = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg,     setPromoMsg]     = useState('');

  /* CTA busy */
  const [ctaBusy,      setCtaBusy]      = useState(false);
  const [ctaStatus,    setCtaStatus]    = useState('');

  /* Crypto */
  const [txHash,       setTxHash]       = useState('');
  const [txBusy,       setTxBusy]       = useState(false);
  const [txMsg,        setTxMsg]        = useState('');

  const autoCreated = useRef(false);
  const [tempId, setTempId] = useState('MMP-DEMO');
  useEffect(() => {
    setTempId('MMP' + Math.random().toString(36).substring(2, 7).toUpperCase());
  }, []);

  /* derived */
  const isMandate  = orderNote === 'Trial_Setup_3Day' || orderNote === 'Autopay_Setup_3DayTrial';
  const displayAmt = orderAmount ?? (amount ? parseFloat(amount) : null);
  const activeId   = orderId || tempId;
  const upiId      = merchant?.upi_id || CONFIG.upiId;
  const bizName    = merchant?.business_name || CONFIG.businessName;
  const bankAcc    = merchant?.bank_account_number || '919410181307';
  const bankIfsc   = merchant?.bank_ifsc || 'PYTM0123456';
  const bankName   = merchant?.bank_account_name || bizName;
  const bankBranch = merchant?.bank_name || 'Paytm Payments Bank';
  const cryptoWallet  = merchant?.crypto_wallet_address || CONFIG.defaultCryptoWallet;
  const cryptoNetwork = merchant?.crypto_network || CONFIG.defaultCryptoNetwork;
  const usdtAmt    = displayAmt ? (displayAmt / (CONFIG.usdtInrRate || 90)).toFixed(4) : '0.0000';
  const upiQrValue = displayAmt ? buildUpiQrValue(displayAmt, activeId, merchant, isMandate) : '';

  /* format currency like the HTML: ₹2,499.00 */
  const fmtInr = (n) => {
    if (n == null) return '—';
    const parts = parseFloat(n).toFixed(2).split('.');
    return '\u20b9' + parseInt(parts[0]).toLocaleString('en-IN') + '.' + parts[1];
  };

  /* Load merchant */
  useEffect(() => {
    const key = (paramApiKey || CONFIG.platformApiKey || '').replace(/^(test_|live_)/, '');
    if (!key) return;
    supabase.from('merchants')
      .select('id, business_name, upi_id, theme_color, sandbox_mode, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer, crypto_wallet_address, crypto_network')
      .eq('api_key', key).single()
      .then(({ data }) => { if (data) setMerchant(data); });
  }, [paramApiKey]);

  /* Auto-create order */
  useEffect(() => {
    if (autoCreated.current) return;
    if (paramOrderId) { setOrderId(paramOrderId); if (paramAmount) setOrderAmount(parseFloat(paramAmount)); autoCreated.current = true; return; }
    if (paramAmount || paramLid) { autoCreated.current = true; createOrder(parseFloat(paramAmount || 0), paramName, paramPhone, paramRef, paramNote, paramCallback, paramProject, paramLid); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Countdown */
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(s => s > 0 ? s - 1 : SESSION_SECS), 1000);
    return () => clearInterval(t);
  }, []);

  /* Realtime */
  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`pay-${activeId}`).on('postgres_changes', { event:'UPDATE', schema:'public', table:'orders', filter:`id=eq.${activeId}` }, p => {
      if (p.new?.status === 'verified') { setConfirmed(true); setTimeout(() => router.push(`/status/${activeId}`), 400); }
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, router]);

  /* Poll */
  useEffect(() => {
    if (!orderId || confirmed) return;
    const t = setInterval(async () => {
      try { const r = await fetch(`/api/orders?id=${orderId}`); if (r.ok) { const d = await r.json(); if (d?.status === 'verified') { setConfirmed(true); router.push(`/status/${orderId}`); } } } catch {}
    }, 3500);
    return () => clearInterval(t);
  }, [orderId, confirmed, router]);

  /* Create order */
  async function createOrder(amt, name, phone, ref, note, callback, project, lid) {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ api_key: paramApiKey || CONFIG.platformApiKey, amount:amt, customer_name:name, customer_phone:phone, external_ref:ref, note, callback_url:callback, project, lid, is_mandate: note==='Trial_Setup_3Day'||note==='Autopay_Setup_3DayTrial' }) });
      const data = await res.json();
      if (res.ok && data) {
        const id = data.order_id || data.orderId;
        const am = data.amount ?? data.orderAmount;
        if (id) setOrderId(id);
        if (am != null) setOrderAmount(am);
        setOrderMode(data.mode || 'live');
        if (data.note) setOrderNote(data.note);
        if (callback && id) localStorage.setItem(`callback_${id}`, callback);
      } else { setOrderAmount(amt); }
    } catch { setOrderAmount(amt); } finally { setLoading(false); }
  }

  /* Copy UPI ID */
  const copyUpiId = () => {
    try { navigator.clipboard.writeText(upiId); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  /* Submit UTR */
  const submitUtr = async (e) => {
    e.preventDefault(); if (!utr.trim()) return;
    setUtrBusy(true); setUtrMsg('');
    try {
      const r = await fetch('/api/orders/verify-utr', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: activeId, utr: utr.trim() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      if (d.verified) { setUtrMsg('\u2713 Payment verified! Redirecting\u2026'); setTimeout(() => router.push(`/status/${activeId}`), 700); }
      else setUtrMsg(d.message || 'UTR recorded. Checking in background\u2026');
    } catch (err) { setUtrMsg(err.message); } finally { setUtrBusy(false); }
  };

  /* Submit Promo */
  const submitPromo = async (e) => {
    e.preventDefault(); if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoMsg('');
    try {
      const r = await fetch('/api/coupons/apply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: activeId, code: promoCode.trim().toUpperCase() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Invalid code');
      setPromoApplied(d.coupon); setOrderAmount(d.new_amount); setPromoMsg(`\u2713 Saved \u20b9${d.discount}!`);
    } catch (err) { setPromoMsg(err.message); } finally { setPromoLoading(false); }
  };

  /* Submit Crypto */
  const submitTx = async (e) => {
    e.preventDefault(); if (!txHash.trim()) return;
    setTxBusy(true); setTxMsg('');
    try {
      const r = await fetch('/api/orders/verify-crypto', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: activeId, tx_hash: txHash.trim(), network: cryptoNetwork, wallet_address: cryptoWallet }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setTxMsg('\u2713 Transaction submitted! Redirecting\u2026'); setTimeout(() => router.push(`/status/${activeId}`), 700);
    } catch (err) { setTxMsg(err.message); } finally { setTxBusy(false); }
  };

  /* CTA */
  const handleCta = async () => {
    if (ctaBusy) return;
    setCtaBusy(true); setCtaStatus('');
    try {
      if (orderId) {
        const r = await fetch(`/api/orders?id=${orderId}`);
        if (r.ok) { const d = await r.json(); if (d?.status === 'verified') { router.push(`/status/${orderId}`); return; } }
      }
      setTimeout(() => {
        setCtaBusy(false);
        setCtaStatus("No payment found yet. It can take a few seconds — try again shortly.");
      }, 1500);
    } catch {
      setCtaBusy(false);
      setCtaStatus("Could not check status. Please try again.");
    }
  };

  /* ───────────────────────────────────────────────────────────
     ENTRY FORM (no amount / order yet)
  ─────────────────────────────────────────────────────────── */
  if (!orderId && !displayAmt) {
    return (
      <div style={S.page}>
        <div style={S.shell}>
          <header style={S.header}>
            <Link href="/" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
              <MyMobPayLogo />
            </Link>
            <div style={S.secure}><i style={S.secDot}/><span>Secure checkout</span></div>
          </header>

          <div style={{ maxWidth:440, margin:'0 auto', background:'#fff', borderRadius:20, boxShadow:'0 20px 40px -20px rgba(15,27,45,.18)', padding:'36px 32px' }}>
            <h1 style={{ font:'800 22px/1.2 "DM Sans",sans-serif', color:'#0f1b2d', margin:'0 0 6px' }}>Enter payment amount</h1>
            <p style={{ font:'500 14px "DM Sans",sans-serif', color:'#5b6b80', margin:'0 0 28px' }}>You will receive a UPI QR to complete payment.</p>

            <form onSubmit={(e) => { e.preventDefault(); if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; } createOrder(parseFloat(amount), custName, custPhone, paramRef, paramNote, paramCallback, paramProject, paramLid); }}>
              <label style={S.fieldLabel}>Amount (INR)</label>
              <div style={{ position:'relative', marginBottom:16 }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', font:'600 20px "IBM Plex Mono",monospace', color:'#5b6b80' }}>₹</span>
                <input type="number" step="0.01" min="1" autoFocus value={amount} placeholder="999"
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  style={{ ...S.monoInput, paddingLeft:36, fontSize:22, fontWeight:700, color:'#0f1b2d' }} />
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[500,1000,2000,5000].map(q => (
                  <button key={q} type="button" onClick={() => setAmount(String(q))}
                    style={{ flex:1, padding:'8px 0', font:'600 12.5px "DM Sans",sans-serif', border:'1px solid #d6dfea', borderRadius:10, background:'#fff', color:'#5b6b80', cursor:'pointer' }}>
                    ₹{q}
                  </button>
                ))}
              </div>
              <label style={S.fieldLabel}>Your name <span style={{ color:'#b8c6d7' }}>(optional)</span></label>
              <input type="text" placeholder="Rahul Sharma" value={custName} onChange={(e) => setCustName(e.target.value)} style={{ ...S.monoInput, marginBottom:16, fontFamily:'"DM Sans",sans-serif' }} />
              <label style={S.fieldLabel}>Phone <span style={{ color:'#b8c6d7' }}>(optional)</span></label>
              <input type="tel" placeholder="9876543210" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ ...S.monoInput, marginBottom:20, fontFamily:'"DM Sans",sans-serif' }} />

              {error && <p style={{ color:'#c0392b', font:'600 13px "DM Sans",sans-serif', margin:'0 0 12px' }}>{error}</p>}

              <button type="submit" disabled={loading} style={S.cta}>
                {loading ? <span style={S.spinner} /> : null}
                <span>{loading ? 'Creating order…' : 'Generate Payment QR'}</span>
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:16, font:'500 12px "DM Sans",sans-serif', color:'#5b6b80' }}>
              0% transaction fee &middot; Funds go straight to merchant
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────
     MAIN 2-COL CHECKOUT
  ─────────────────────────────────────────────────────────── */
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const pct = (timeLeft / SESSION_SECS * 100).toFixed(1);

  /* amount breakdown */
  const baseAmt    = displayAmt ?? 0;
  const discountAmt = promoApplied ? (baseAmt - parseFloat(orderAmount || baseAmt)) : 0;
  const finalAmt   = displayAmt ?? baseAmt;
  const amtWhole   = finalAmt ? Math.floor(finalAmt).toLocaleString('en-IN') : '0';
  const amtFrac    = finalAmt ? ('.' + parseFloat(finalAmt).toFixed(2).split('.')[1]) : '.00';

  return (
    <div style={S.page}>
      <div className="pay-shell" style={S.shell}>

        {/* HEADER */}
        <header className="pay-header" style={S.header}>
          <Link href="/" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
            <MyMobPayLogo />
          </Link>
          <div style={S.secure}>
            <i className="pay-sec-dot" style={S.secDot}/>
            <span className="pay-secure-label">Secure checkout, powered by MyMobPay</span>
          </div>
        </header>

        {orderMode === 'test' && (
          <div style={{ marginBottom:16, background:'#fff8e7', border:'1px solid #f0c040', borderRadius:10, padding:'10px 16px', font:'600 13px "DM Sans",sans-serif', color:'#856404', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }} />
            Test mode &mdash; no real money will be transferred
          </div>
        )}

        <div className="pay-grid" style={S.grid}>
          {/* ── LEFT: Receipt card ──
               Outer div carries drop-shadow filter; inner aside carries the mask.
               They MUST be on separate elements — combining filter+mask on the
               same element is a known WebKit bug that makes the whole element
               invisible on iOS Safari and Android Chrome. */}
          <div style={{ filter:'drop-shadow(0 20px 26px rgba(15,27,45,.16))' }}>
          <aside className="pay-receipt" style={S.receipt} aria-label="Order summary">
            <div style={S.merRow}>
              <div style={S.merAv}>{bizName.charAt(0).toUpperCase()}</div>
              <div>
                <b style={{ display:'block', font:'700 16px "DM Sans",sans-serif', color:'#0f1b2d', lineHeight:1.2 }}>{bizName}</b>
                <small style={{ display:'flex', alignItems:'center', gap:4, color:'#12995d', fontWeight:600, fontSize:12.5, fontFamily:'"DM Sans",sans-serif' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
                  Verified merchant
                </small>
              </div>
            </div>

            <p suppressHydrationWarning style={{ color:'#5b6b80', fontSize:12, margin:'0 0 6px', paddingTop:14, borderTop:'1px dashed #d6dfea', fontFamily:'"IBM Plex Mono",monospace' }}>
              {new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>

            {/* Receipt lines */}
            {[
              { label:'Order ID', val: activeId ? `#${activeId.slice(-8).toUpperCase()}` : '—' },
              { label:'Subtotal', val: displayAmt ? displayAmt.toLocaleString('en-IN', { minimumFractionDigits:2 }) : '—' },
              ...(promoApplied ? [{ label: `Promo: ${promoApplied.code}`, val: `-${discountAmt.toFixed(2)}`, green:true }] : []),
              { label:'Platform fee', val:'0.00', free:true },
            ].map((row, i) => (
              <div key={i} suppressHydrationWarning style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px dashed #d6dfea', fontFamily:'"IBM Plex Mono",monospace', fontSize:13, color:'#5b6b80' }}>
                <span>{row.label}</span>
                <span style={{ color: row.free ? '#12995d' : row.green ? '#12995d' : '#0f1b2d', fontWeight: row.free || row.green ? 500 : 400 }}>{row.val}</span>
              </div>
            ))}

            {/* Big amount */}
            <div style={{ marginTop:20 }}>
              <small style={{ display:'block', color:'#5b6b80', fontWeight:600, fontSize:13, marginBottom:2, fontFamily:'"DM Sans",sans-serif' }}>Total to pay</small>
              <b className="pay-amount-big" style={{ font:'600 50px/1.05 "Fraunces",serif', letterSpacing:'-0.025em', display:'block' }}>
                ₹{amtWhole}<s style={{ textDecoration:'none', fontSize:26, color:'#8a99ad' }}>{amtFrac}</s>
              </b>
            </div>

            {/* Session timer */}
            <div style={{ marginTop:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7, font:'600 13px "DM Sans",sans-serif', color:'#2f86f6' }}>
                <span>Session expires in</span>
                <span style={{ fontVariantNumeric:'tabular-nums' }}>{mm}:{ss}</span>
              </div>
              <div style={{ height:5, borderRadius:9, background:'#eaf2fe', overflow:'hidden' }}>
                <div className="pay-progress-bar" style={{ height:'100%', width:pct+'%', background:'#2f86f6', borderRadius:9, transition:'width 1s linear' }} />
              </div>
            </div>
          </aside>
          </div>{/* /receipt filter wrapper */}

          {/* ── RIGHT: Payment methods ── */}
          <main>
            <h2 style={{ font:'800 21px "DM Sans",sans-serif', margin:'2px 0 14px', letterSpacing:'-0.015em', color:'#0f1b2d' }}>
              How would you like to pay?
            </h2>

            {/* ── UPI accordion ── */}
            <Accordion
              active={activeMethod === 'upi'}
              onToggle={() => setActiveMethod(activeMethod === 'upi' ? '' : 'upi')}
              icon={<svg viewBox="0 0 24 24" style={S.accIcSvg}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>}
              title="UPI"
              subtitle="PhonePe, Google Pay, Paytm, BHIM"
            >
              <div className="upi-flex" style={S.upiWrap}>
                {/* QR */}
                <div>
                  <div style={S.qrWrap}>
                    <i style={{ ...S.qrCorner, top:-2, left:-2, borderRight:0, borderBottom:0 }} />
                    <i style={{ ...S.qrCorner, top:-2, right:-2, borderLeft:0, borderBottom:0 }} />
                    <i style={{ ...S.qrCorner, bottom:-2, left:-2, borderRight:0, borderTop:0 }} />
                    <i style={{ ...S.qrCorner, bottom:-2, right:-2, borderLeft:0, borderTop:0 }} />
                    {upiQrValue ? (
                      <QRCode value={upiQrValue} size={148} level="H" fgColor="#0f1b2d" bgColor="#ffffff" style={{ display:'block', width:'100%', height:'auto' }} />
                    ) : (
                      <div style={{ width:148, height:148, display:'flex', alignItems:'center', justifyContent:'center', color:'#b8c6d7', fontSize:12 }}>Loading…</div>
                    )}
                  </div>
                  <div style={{ textAlign:'center', fontSize:12, fontWeight:700, marginTop:8, fontFamily:'"DM Sans",sans-serif' }}>Pay {fmtInr(displayAmt)}</div>
                </div>

                {/* Side */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:'0 0 8px', fontSize:13, color:'#5b6b80', fontFamily:'"DM Sans",sans-serif' }}>Scan with any UPI app, or pay to this ID</p>
                  <div style={S.upiIdBox}>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', flex:1, fontFamily:'"IBM Plex Mono",monospace', fontSize:12.5 }}>{upiId}</span>
                    <button onClick={copyUpiId} className="pay-copy-btn" style={{ ...S.copyBtn, ...(copied ? S.copyBtnDone : {}) }}>{copied ? 'Copied' : 'Copy'}</button>
                  </div>
                  <p style={{ margin:'0 0 8px', fontSize:13, color:'#5b6b80', fontFamily:'"DM Sans",sans-serif' }}>Or open your app directly</p>
                  <div style={S.chips}>
                    {UPI_CHIPS.map(app => (
                      <button key={app.id} onClick={() => { if (!displayAmt) return; window.location.href = buildUpiLink(app.id, displayAmt, activeId, merchant, isMandate); }}
                        className="pay-chip" style={S.chip}>
                        <b style={{ width:9, height:9, borderRadius:'50%', background:app.dot, display:'inline-block', flexShrink:0 }} />
                        {app.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Accordion>

            {/* ── Net Banking accordion ── */}
            <Accordion
              active={activeMethod === 'bank'}
              onToggle={() => setActiveMethod(activeMethod === 'bank' ? '' : 'bank')}
              icon={<svg viewBox="0 0 24 24" style={S.accIcSvg}><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/></svg>}
              title={<>Net Banking <span style={{ background:'#dcf5e8', color:'#0d7a47', fontSize:11.5, borderRadius:999, padding:'2px 8px', marginLeft:8, fontWeight:700 }}>0% fee</span></>}
              subtitle="Pay from your bank account"
            >
              <div style={{ padding:'2px 18px 20px' }}>
                <div style={{ border:'1px solid #d6dfea', borderRadius:14, overflow:'hidden', marginBottom:12 }}>
                  {[
                    { label:'Account Name', val:bankName },
                    { label:'Account No.', val:bankAcc },
                    { label:'IFSC', val:bankIfsc },
                    { label:'Bank', val:bankBranch },
                    { label:'Amount', val:fmtInr(displayAmt), highlight:true },
                  ].map((row, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background: row.highlight ? '#eaf2fe' : i % 2 === 0 ? '#fff' : '#f3f7fc', borderTop: i > 0 ? '1px solid #d6dfea' : 'none' }}>
                      <span style={{ font:'500 12px "DM Sans",sans-serif', color:'#5b6b80' }}>{row.label}</span>
                      <span style={{ font:`600 12.5px "IBM Plex Mono",monospace`, color: row.highlight ? '#1c6ee0' : '#0f1b2d' }}>{row.val}</span>
                    </div>
                  ))}
                </div>
                <p style={{ margin:'0 0 8px', font:'600 13px "DM Sans",sans-serif', color:'#0f1b2d' }}>Enter IMPS/NEFT UTR after transfer</p>
                <form onSubmit={submitUtr} style={{ display:'flex', gap:8 }}>
                  <input type="text" placeholder="12-digit UTR e.g. 425619283741" value={utr} onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))} style={S.monoInput} />
                  <button type="submit" disabled={utrBusy || utr.length < 12} style={S.smBtn}>{utrBusy ? '…' : 'Confirm'}</button>
                </form>
                {utrMsg && <p style={{ margin:'8px 0 0', font:'600 13px "DM Sans",sans-serif', color: utrMsg.startsWith('✓') ? '#12995d' : '#c0392b' }}>{utrMsg}</p>}
              </div>
            </Accordion>

            {/* ── Crypto accordion ── */}
            <Accordion
              active={activeMethod === 'crypto'}
              onToggle={() => setActiveMethod(activeMethod === 'crypto' ? '' : 'crypto')}
              icon={<svg viewBox="0 0 24 24" style={S.accIcSvg}><circle cx="12" cy="12" r="9"/><path d="M9 8h5a2 2 0 010 4H9m0 0h5.5a2 2 0 010 4H9M9 7v10"/></svg>}
              title="Crypto (USDT)"
              subtitle="TRC20 network"
            >
              <div style={{ padding:'2px 18px 20px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ background:'#fff8e7', border:'1px solid #f0c040', borderRadius:12, padding:'12px 16px', textAlign:'center' }}>
                    <div style={{ font:'600 12px "DM Sans",sans-serif', color:'#856404', marginBottom:4 }}>USDT Amount Due</div>
                    <div style={{ font:'700 28px "IBM Plex Mono",monospace', color:'#0f1b2d' }}>{usdtAmt}</div>
                    <div style={{ font:'600 13px "DM Sans",sans-serif', color:'#b07d0e' }}>USDT &bull; @ ₹{CONFIG.usdtInrRate || 90} per USDT</div>
                  </div>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ background:'#fff', border:'1px solid #d6dfea', borderRadius:12, padding:10, flexShrink:0 }}>
                      <QRCode value={cryptoWallet} size={110} level="M" fgColor="#0f1b2d" bgColor="#ffffff" />
                      <div style={{ textAlign:'center', font:'600 11px "DM Sans",sans-serif', color:'#5b6b80', marginTop:6 }}>Scan wallet QR</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 4px', font:'600 12px "DM Sans",sans-serif', color:'#5b6b80', textTransform:'uppercase', letterSpacing:'0.04em' }}>TRC-20 Address</p>
                      <div style={{ ...S.upiIdBox, marginBottom:12 }}>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', flex:1, fontFamily:'"IBM Plex Mono",monospace', fontSize:11 }}>{cryptoWallet}</span>
                        <button onClick={() => { try { navigator.clipboard.writeText(cryptoWallet); } catch {} }} style={S.copyBtn}>Copy</button>
                      </div>
                      <p style={{ margin:'0 0 6px', font:'600 13px "DM Sans",sans-serif', color:'#0f1b2d' }}>Paste TxHash after sending</p>
                      <form onSubmit={submitTx} style={{ display:'flex', gap:8 }}>
                        <input type="text" placeholder="Transaction hash (TxID)…" value={txHash} onChange={e => setTxHash(e.target.value)} style={S.monoInput} />
                        <button type="submit" disabled={txBusy || !txHash.trim()} style={{ ...S.smBtn, background:'#d97706', boxShadow:'none' }}>{txBusy ? '…' : 'Verify'}</button>
                      </form>
                      {txMsg && <p style={{ margin:'8px 0 0', font:'600 13px "DM Sans",sans-serif', color: txMsg.startsWith('✓') ? '#12995d' : '#c0392b' }}>{txMsg}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </Accordion>

            {/* UTR quick-entry (for UPI) */}
            {showUtr && (
              <div style={{ display:'flex', gap:8, marginTop:8, marginBottom:4 }}>
                <input type="text" inputMode="numeric" maxLength={12} placeholder="12-digit UTR, e.g. 425619283741" value={utr} onChange={e => setUtr(e.target.value.replace(/\D/g,'').slice(0,12))} style={S.monoInput} />
                <button onClick={submitUtr} disabled={utrBusy || utr.length !== 12} style={S.smBtn}>{utrBusy ? '…' : 'Verify'}</button>
              </div>
            )}

            {/* Promo input */}
            {showPromo && (
              <form onSubmit={submitPromo} style={{ display:'flex', gap:8, marginTop:8, marginBottom:4 }}>
                <input type="text" placeholder="Promo or gift code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} style={{ ...S.monoInput, fontFamily:'"DM Sans",sans-serif', textTransform:'uppercase' }} />
                <button type="submit" disabled={promoLoading || !promoCode.trim()} style={S.smBtn}>{promoLoading ? '…' : 'Apply'}</button>
              </form>
            )}
            {promoMsg && <p style={{ margin:'4px 0 8px', font:'600 13px "DM Sans",sans-serif', color: promoMsg.startsWith('✓') ? '#12995d' : '#c0392b' }}>{promoMsg}</p>}

            {/* CTA */}
            <button onClick={handleCta} disabled={ctaBusy} className="pay-cta-btn" style={{ ...S.cta, marginTop:8, boxShadow:'0 14px 26px -16px #2f86f6' }}>
              {ctaBusy && <span style={S.spinner} />}
              <span>{ctaBusy ? 'Checking status…' : "I've paid, check status"}</span>
            </button>

            {ctaStatus && (
              <div style={{ minHeight:22, textAlign:'center', font:'600 13.5px "DM Sans",sans-serif', color:'#5b6b80', marginTop:10 }}>{ctaStatus}</div>
            )}

            {/* Links */}
            <div style={{ display:'flex', justifyContent:'center', gap:22, marginTop:8, font:'600 13px "DM Sans",sans-serif' }}>
              <button onClick={() => { setShowUtr(!showUtr); setActiveMethod('upi'); }} className="pay-link-btn" style={S.linkBtn}>Already paid? Enter UTR</button>
              <button onClick={() => setShowPromo(!showPromo)} className="pay-link-btn" style={S.linkBtn}>{promoApplied ? `Promo: ${promoApplied.code} ✓` : 'Have a promo code?'}</button>
            </div>

            <div style={{ textAlign:'center', color:'#5b6b80', fontSize:12.5, marginTop:20, fontFamily:'"DM Sans",sans-serif' }}>
              0% transaction fee. Your payment goes straight to the merchant.
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ── Accordion Component ─────────────────────────────────────── */
function Accordion({ active, onToggle, icon, title, subtitle, children }) {
  return (
    <div style={{ ...S.opt, borderColor: active ? '#2f86f6' : 'transparent' }}>
      <button type="button" onClick={onToggle}
        aria-expanded={active}
        style={{ all:'unset', boxSizing:'border-box', width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', font:'700 15px "DM Sans",sans-serif', cursor:'pointer', gap:12 }}>
        <span style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={S.accIc}>{icon}</span>
          <span>
            <span style={{ display:'block' }}>{title}</span>
            {subtitle && <small style={{ display:'block', fontWeight:500, fontSize:12.5, color:'#5b6b80', lineHeight:1.2, marginTop:1 }}>{subtitle}</small>}
          </span>
        </span>
        <span style={{ width:20, height:20, borderRadius:'50%', border: active ? '6px solid #2f86f6' : '2px solid #b8c6d7', flexShrink:0, transition:'border .15s' }} />
      </button>
      {active && children}
    </div>
  );
}

/* ── Design tokens (mirrors the HTML :root CSS) ─────────────── */
const S = {
  page: { margin:0, background:'#e8eef6', fontFamily:'"DM Sans",system-ui,sans-serif', fontSize:16, lineHeight:1.5, color:'#0f1b2d', minHeight:'100vh' },
  shell: { maxWidth:1000, margin:'0 auto', padding:'28px 20px 44px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, gap:14 },
  secure: { display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:'#5b6b80', textAlign:'right' },
  secDot: { width:8, height:8, borderRadius:'50%', background:'#12995d', flexShrink:0, boxShadow:'0 0 0 4px rgba(18,153,93,.2)', display:'inline-block' },
  grid: { display:'grid', gridTemplateColumns:'.82fr 1.18fr', gap:28, alignItems:'start' },

  /* receipt — mask only (filter lives on the wrapper div above) */
  receipt: {
    background:'#fff',
    padding:'28px 26px 44px',
    fontFamily:'"IBM Plex Mono",monospace',
    fontSize:13,
    borderRadius:'18px 18px 0 0',
    WebkitMask:'radial-gradient(7px at 7px 100%,#0000 98%,#000) 0 100%/14px 100% repeat-x',
    mask:'radial-gradient(7px at 7px 100%,#0000 98%,#000) 0 100%/14px 100% repeat-x',
  },
  merRow: { display:'flex', alignItems:'center', gap:12, fontFamily:'"DM Sans",sans-serif', paddingBottom:16 },
  merAv:  { width:40, height:40, borderRadius:12, background:'#eaf2fe', color:'#1c6ee0', display:'grid', placeItems:'center', fontWeight:800, flexShrink:0 },

  /* payment options */
  opt: {
    background:'#fff',
    border:'2px solid transparent',
    borderRadius:18,
    marginBottom:10,
    overflow:'hidden',
    boxShadow:'0 1px 0 #d6dfea, 0 10px 22px -18px rgba(15,27,45,.35)',
  },

  /* QR */
  qrWrap: { position:'relative', width:168, padding:14, background:'#fff', border:'1px solid #d6dfea', borderRadius:16 },
  qrCorner: { position:'absolute', width:20, height:20, border:'3px solid #2f86f6', borderRadius:6, display:'block' },

  /* UPI */
  upiWrap: { display:'flex', gap:22, alignItems:'center', padding:'2px 18px 20px' },

  /* UPI ID box */
  upiIdBox: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, background:'#f3f7fc', border:'1px solid #d6dfea', borderRadius:11, padding:'8px 8px 8px 12px', fontSize:12.5, marginBottom:14 },

  /* copy button */
  copyBtn: { all:'unset', cursor:'pointer', font:'700 12px "DM Sans",sans-serif', color:'#1c6ee0', padding:'5px 10px', borderRadius:8, background:'#eaf2fe', flexShrink:0, minWidth:58, textAlign:'center', boxSizing:'border-box' },
  copyBtnDone: { background:'#dcf5e8', color:'#0d7a47' },

  /* chips */
  chips: { display:'flex', gap:6, flexWrap:'wrap' },
  chip: { all:'unset', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, font:'600 12.5px "DM Sans",sans-serif', border:'1px solid #d6dfea', borderRadius:999, padding:'6px 12px 6px 9px', background:'#fff', boxSizing:'border-box' },

  /* CTA */
  cta: { width:'100%', marginTop:8, border:0, background:'#2f86f6', color:'#fff', borderRadius:16, padding:17, font:'700 16px "DM Sans",sans-serif', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:10, boxSizing:'border-box' },
  spinner: { width:16, height:16, border:'2.5px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block', flexShrink:0 },

  /* small action button */
  smBtn: { border:0, borderRadius:12, padding:'0 18px', font:'700 14px "DM Sans",sans-serif', background:'#2f86f6', color:'#fff', cursor:'pointer', whiteSpace:'nowrap', minHeight:44, flexShrink:0, boxShadow:'0 8px 18px -12px #2f86f6' },

  /* link buttons */
  linkBtn: { all:'unset', cursor:'pointer', color:'#1c6ee0', font:'600 13px "DM Sans",sans-serif' },

  /* field helpers */
  fieldLabel: { display:'block', font:'600 12px "DM Sans",sans-serif', color:'#5b6b80', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 },
  monoInput: { width:'100%', border:'1px solid #d6dfea', borderRadius:12, padding:'12px 14px', font:'500 14px "IBM Plex Mono",monospace', background:'#fff', color:'#0f1b2d', outline:'none', boxSizing:'border-box' },

  accIc: { width:36, height:36, borderRadius:11, background:'#eaf2fe', color:'#1c6ee0', display:'grid', placeItems:'center', flexShrink:0 },
  accIcSvg: { width:19, height:19, stroke:'currentColor', fill:'none', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' },
};

export default function PayPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=Orbitron:wght@800;900&family=Outfit:wght@700;800&display=swap');

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 4px rgba(18,153,93,.2)} 50%{box-shadow:0 0 0 6px rgba(18,153,93,.12)} }

        /* ── Mobile checkout layout ── */
        @media (max-width: 800px) {
          .pay-grid { grid-template-columns: 1fr !important; }
          .upi-flex { flex-direction: column !important; align-items: stretch !important; }
          .pay-secure-label { display: none !important; }
          .pay-receipt { border-radius: 14px !important; }
        }
        @media (max-width: 480px) {
          .pay-shell { padding: 16px 14px 36px !important; }
          .pay-header { margin-bottom: 16px !important; }
          .pay-amount-big { font-size: 42px !important; }
        }

        /* ── Hover states ── */
        .pay-chip:hover { border-color: #2f86f6 !important; }
        .pay-link-btn:hover { text-decoration: underline; }
        .pay-cta-btn:hover:not(:disabled) { background: #1c6ee0 !important; }
        .pay-copy-btn:hover { background: #d6e8ff !important; }
        .pay-opt-btn:focus-visible { outline: 3px solid #7fb0ff; outline-offset: -3px; }

        /* ── Receipt ticket punch ── */
        .pay-receipt {
          -webkit-mask: radial-gradient(7px at 7px 100%,#0000 98%,#000) 0 100%/14px 100% repeat-x;
          mask: radial-gradient(7px at 7px 100%,#0000 98%,#000) 0 100%/14px 100% repeat-x;
        }

        /* ── UTR / promo inline expand ── */
        .pay-extra-box { animation: slideDown .18s ease; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }

        /* ── Secure dot pulse ── */
        .pay-sec-dot { animation: pulse-dot 2.4s ease-in-out infinite; }

        /* ── Smooth accordion ── */
        .pay-acc-dot { transition: border .15s !important; }
        .pay-progress-bar { transition: width 1s linear !important; }

        @media (prefers-reduced-motion: reduce) {
          .pay-progress-bar { transition: none !important; }
          .pay-sec-dot { animation: none !important; }
        }
      `}</style>
      <Suspense fallback={
        <div style={{ minHeight:'100vh', background:'#e8eef6', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, fontFamily:'"DM Sans",sans-serif', color:'#5b6b80', fontSize:14, fontWeight:600 }}>
          <div style={{ width:32, height:32, border:'3px solid #d6dfea', borderTopColor:'#2f86f6', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
          Loading secure checkout…
        </div>
      }>
        <PayPageContent />
      </Suspense>
    </>
  );
}
