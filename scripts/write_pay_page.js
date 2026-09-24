const fs = require('fs');
const path = require('path');

const code = `'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import {
  Copy, CheckCircle, Loader2, ShieldCheck,
  IndianRupee, Lock, ArrowRight, AlertCircle,
  Zap, QrCode, Gift, Landmark, Check,
  Coins, ChevronDown, Shield, Clock,
  CheckCircle2, BadgePercent, Smartphone,
  Sparkles, Building2
} from 'lucide-react';

function buildUpiLink(appId, amount, orderId, merchant, isMandate) {
  const pa   = merchant?.upi_id || CONFIG.upiId;
  const pn   = encodeURIComponent(merchant?.business_name || CONFIG.businessName);
  const upath = isMandate ? 'mandate' : 'pay';
  let qs = \`pa=\${pa}&pn=\${pn}&am=\${amount}&cu=INR&tn=\${orderId}\`;
  if (isMandate) {
    const d = new Date(); d.setDate(d.getDate() + 3);
    const ds = String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + d.getFullYear();
    qs += \`&validitystart=\${ds}&recur=MONTHLY&amrule=EXACT&share=Y\`;
  }
  const amap = { gpay:'com.google.android.apps.nbu.paisa.user', phonepe:'com.phonepe.app', paytm:'net.one97.paytm', bhim:'in.org.npci.upiapp' };
  const imap = { gpay:\`gpay://upi/\${upath}?\${qs}\`, phonepe:\`phonepe://\${upath}?\${qs}\`, paytm:\`paytmmp://upi/\${upath}?\${qs}\`, bhim:\`upi://\${upath}?\${qs}\` };
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    const pkg = amap[appId];
    return pkg ? \`intent://upi/\${upath}?\${qs}#Intent;scheme=upi;package=\${pkg};end;\` : \`intent://upi/\${upath}?\${qs}#Intent;scheme=upi;end;\`;
  }
  return imap[appId] || \`upi://\${upath}?\${qs}\`;
}

const UPI_APPS = [
  { id:'phonepe', label:'PhonePe',    color:'#5f259f' },
  { id:'gpay',    label:'Google Pay', color:'#1a73e8' },
  { id:'paytm',   label:'Paytm',      color:'#002970' },
  { id:'bhim',    label:'BHIM',       color:'#00529B' },
];

function OrderSummary({ merchant, amount, orderId, note, timer, isMandate }) {
  const [expanded, setExpanded] = useState(false);
  const biz = merchant?.business_name || CONFIG.businessName;
  const mm  = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss  = String(timer % 60).padStart(2, '0');
  return (
    <div className="flex flex-col h-full bg-[#1a2332] text-white">
      <div className="px-7 pt-7 pb-5 border-b border-white/10">
        <Link href="/" className="inline-block">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-sm">M</div>
            <span className="text-white font-bold text-lg tracking-tight">MyMobPay</span>
          </div>
        </Link>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          <span className="text-xs text-slate-400 font-medium">Secure checkout — powered by MyMobPay</span>
        </div>
      </div>

      <div className="px-7 py-5 border-b border-white/10">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Paying to</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-base shadow-sm">
            {biz.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-sm">{biz}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified Merchant</p>
          </div>
        </div>
      </div>

      <div className="px-7 py-6 border-b border-white/10">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {isMandate ? 'Subscription Setup' : 'Amount to Pay'}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-300">&#8377;</span>
          <span className="text-4xl font-black text-white tabular-nums tracking-tight">
            {amount != null ? parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '\u2014'}
          </span>
        </div>
        {isMandate && <p className="mt-2 text-xs text-blue-300 font-medium">&#8377;0 charged today &middot; 3-day free trial</p>}
        {timer > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span>Session expires in {mm}:{ss}</span>
          </div>
        )}
      </div>

      <div className="px-7 py-5 flex-1 space-y-3 border-b border-white/10">
        {note && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Description</span>
            <span className="text-slate-200 font-medium text-right max-w-[160px] truncate">{note}</span>
          </div>
        )}
        {orderId && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Order ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded">{orderId}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(orderId)} className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
          <ChevronDown className={\`w-3.5 h-3.5 transition-transform \${expanded ? 'rotate-180' : ''}\`} />
          {expanded ? 'Hide' : 'Show'} fee breakdown
        </button>
        {expanded && (
          <div className="pt-2 space-y-2 text-xs border-t border-white/10 mt-2">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>&#8377;{amount != null ? parseFloat(amount).toFixed(2) : '0.00'}</span></div>
            <div className="flex justify-between text-green-400 font-semibold"><span>Platform fee</span><span>&#8377;0.00 (0% MDR)</span></div>
            <div className="flex justify-between text-slate-400 border-t border-white/10 pt-2"><span>Total</span><span className="text-white font-bold">&#8377;{amount != null ? parseFloat(amount).toFixed(2) : '0.00'}</span></div>
          </div>
        )}
      </div>

      <div className="px-7 py-5 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-500"><Lock className="w-3.5 h-3.5 shrink-0" /><span>256-bit TLS Encrypted &middot; RBI Compliant</span></div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500"><Shield className="w-3.5 h-3.5 shrink-0" /><span>NPCI UPI 2.0 &middot; Funds go directly to merchant</span></div>
      </div>
    </div>
  );
}

function PayPageContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
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

  const [merchant,     setMerchant]     = useState(null);
  const [orderId,      setOrderId]      = useState(paramOrderId || null);
  const [orderAmount,  setOrderAmount]  = useState(paramAmount ? parseFloat(paramAmount) : null);
  const [orderMode,    setOrderMode]    = useState('live');
  const [orderNote,    setOrderNote]    = useState(paramNote);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [timer,        setTimer]        = useState(600);
  const [confirmed,    setConfirmed]    = useState(false);
  const [amount,       setAmount]       = useState(paramAmount);
  const [custName,     setCustName]     = useState(paramName);
  const [custPhone,    setCustPhone]    = useState(paramPhone);
  const [activeTab,    setActiveTab]    = useState('upi');
  const [mobileView,   setMobileView]   = useState('qr');
  const [copiedUpi,    setCopiedUpi]    = useState(false);
  const [copiedAcc,    setCopiedAcc]    = useState(false);
  const [copiedIfsc,   setCopiedIfsc]   = useState(false);
  const [copiedBenef,  setCopiedBenef]  = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [utr,          setUtr]          = useState('');
  const [utrBusy,      setUtrBusy]      = useState(false);
  const [utrMsg,       setUtrMsg]       = useState(null);
  const [txHash,       setTxHash]       = useState('');
  const [txBusy,       setTxBusy]       = useState(false);
  const [txMsg,        setTxMsg]        = useState(null);
  const [showPromo,    setShowPromo]    = useState(false);
  const [promoCode,    setPromoCode]    = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError,   setPromoError]   = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const autoCreated = useRef(false);
  const tempId      = useRef('MMP' + Math.random().toString(36).substring(2, 7).toUpperCase());

  const isMandate  = orderNote === 'Trial_Setup_3Day' || orderNote === 'Autopay_Setup_3DayTrial';
  const displayAmt = orderAmount ?? (amount ? parseFloat(amount) : null);
  const activeId   = orderId || tempId.current;
  const upiId      = merchant?.upi_id || CONFIG.upiId;
  const bankAcc    = merchant?.bank_account_number || '919410181307';
  const bankIfsc   = merchant?.bank_ifsc || 'PYTM0123456';
  const bankName   = merchant?.bank_account_name || merchant?.business_name || CONFIG.businessName;
  const bankBranch = merchant?.bank_name || 'Paytm Payments Bank';
  const cryptoWallet  = merchant?.crypto_wallet_address || CONFIG.defaultCryptoWallet;
  const cryptoNetwork = merchant?.crypto_network || CONFIG.defaultCryptoNetwork;
  const usdtAmt    = displayAmt ? (displayAmt / (CONFIG.usdtInrRate || 90)).toFixed(4) : '0.0000';
  const upiQrValue = displayAmt ? buildUpiLink('scan', displayAmt, activeId, merchant, isMandate) : '';

  useEffect(() => {
    const key = (paramApiKey || CONFIG.platformApiKey || '').replace(/^(test_|live_)/, '');
    if (!key) return;
    supabase.from('merchants').select('id, business_name, upi_id, theme_color, sandbox_mode, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer, crypto_wallet_address, crypto_network').eq('api_key', key).single().then(({ data }) => { if (data) setMerchant(data); });
  }, [paramApiKey]);

  useEffect(() => {
    if (autoCreated.current) return;
    if (paramOrderId) { setOrderId(paramOrderId); if (paramAmount) setOrderAmount(parseFloat(paramAmount)); autoCreated.current = true; return; }
    if (paramAmount || paramLid) { autoCreated.current = true; createOrder(parseFloat(paramAmount || 0), paramName, paramPhone, paramRef, paramNote, paramCallback, paramProject, paramLid); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(\`pay-\${activeId}\`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: \`id=eq.\${activeId}\` }, payload => { if (payload.new?.status === 'verified') { setConfirmed(true); setTimeout(() => router.push(\`/status/\${activeId}\`), 400); } }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, router]);

  useEffect(() => {
    if (!orderId || confirmed) return;
    const t = setInterval(async () => { try { const r = await fetch(\`/api/orders?id=\${orderId}\`); if (r.ok) { const d = await r.json(); if (d?.status === 'verified') { setConfirmed(true); router.push(\`/status/\${orderId}\`); } } } catch {} }, 3500);
    return () => clearInterval(t);
  }, [orderId, confirmed, router]);

  async function createOrder(amt, name, phone, ref, note, callback, project, lid) {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ api_key: paramApiKey || CONFIG.platformApiKey, amount:amt, customer_name:name, customer_phone:phone, external_ref:ref, note, callback_url:callback, project, lid, is_mandate: note==='Trial_Setup_3Day'||note==='Autopay_Setup_3DayTrial' }) });
      const data = await res.json();
      if (res.ok && data) { const id = data.order_id || data.orderId; const am = data.amount ?? data.orderAmount; if (id) setOrderId(id); if (am != null) setOrderAmount(am); setOrderMode(data.mode || 'live'); if (data.note) setOrderNote(data.note); if (callback && id) localStorage.setItem(\`callback_\${id}\`, callback); } else { setOrderAmount(amt); }
    } catch { setOrderAmount(amt); } finally { setLoading(false); }
  }

  const copyVal = (val, setter) => { if (!val) return; navigator.clipboard.writeText(String(val)); setter(true); setTimeout(() => setter(false), 2000); };

  const submitUtr = async (e) => {
    if (e) e.preventDefault(); if (!utr.trim()) return;
    setUtrBusy(true); setUtrMsg(null);
    try {
      const r = await fetch('/api/orders/verify-utr', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: activeId, utr: utr.trim() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      if (d.verified) { setUtrMsg({ ok:true, text:'Payment verified! Redirecting\u2026' }); setTimeout(() => router.push(\`/status/\${activeId}\`), 700); }
      else setUtrMsg({ ok:null, text: d.message || 'UTR recorded. Auto-checking\u2026' });
    } catch (err) { setUtrMsg({ ok:false, text: err.message }); } finally { setUtrBusy(false); }
  };

  const submitTx = async (e) => {
    if (e) e.preventDefault(); if (!txHash.trim()) return;
    setTxBusy(true); setTxMsg(null);
    try {
      const r = await fetch('/api/orders/verify-crypto', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: activeId, tx_hash: txHash.trim(), network: cryptoNetwork, wallet_address: cryptoWallet }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setTxMsg({ ok:true, text:'Transaction submitted! Redirecting\u2026' }); setTimeout(() => router.push(\`/status/\${activeId}\`), 700);
    } catch (err) { setTxMsg({ ok:false, text: err.message }); } finally { setTxBusy(false); }
  };

  const submitPromo = async (e) => {
    if (e) e.preventDefault(); if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError(''); setPromoSuccess('');
    try {
      const r = await fetch('/api/coupons/apply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: activeId, code: promoCode.trim().toUpperCase() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Invalid code');
      setAppliedPromo(d.coupon); setOrderAmount(d.new_amount); setPromoSuccess(\`Saved \u20b9\${d.discount}! Code applied.\`);
    } catch (err) { setPromoError(err.message); } finally { setPromoLoading(false); }
  };

  if (!orderId && !displayAmt) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden animate-scale-up">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500" />
          <div className="p-8">
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">M</div>
              <span className="text-slate-800 font-bold text-lg">MyMobPay</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Enter payment amount</h1>
            <p className="text-sm text-slate-500 mb-6">You will receive a UPI QR code to complete payment</p>
            <form onSubmit={(e) => { e.preventDefault(); if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; } createOrder(parseFloat(amount), custName, custPhone, paramRef, paramNote, paramCallback, paramProject, paramLid); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">&#8377;</span>
                  <input type="number" step="0.01" min="1" autoFocus placeholder="500" value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} className="w-full pl-8 pr-4 py-3.5 text-2xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all tabular-nums" />
                </div>
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map(q => (<button key={q} type="button" onClick={() => setAmount(String(q))} className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">&#8377;{q}</button>))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Your Name (optional)</label>
                <input type="text" placeholder="Rahul Sharma" value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Phone (optional)</label>
                <input type="tel" placeholder="9876543210" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all" />
              </div>
              {error && (<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>)}
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><IndianRupee className="w-4 h-4" />Generate Payment QR<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" />256-bit SSL</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />NPCI Certified</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />0% Fee</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const TABS = [
    { key:'upi',           icon:<Zap className="w-4 h-4" />,      label:'UPI'         },
    { key:'bank_transfer', icon:<Landmark className="w-4 h-4" />, label:'Net Banking' },
    { key:'crypto',        icon:<Coins className="w-4 h-4" />,    label:'Crypto USDT' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-slate-200 overflow-hidden flex flex-col md:flex-row animate-scale-up">
        <div className="w-full md:w-[300px] flex-shrink-0">
          <OrderSummary merchant={merchant} amount={displayAmt} orderId={activeId} note={orderNote} timer={timer} isMandate={isMandate} />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 flex-shrink-0" />
          <div className="flex-1 p-6 sm:p-8 flex flex-col">

            <div className="flex border-b border-slate-200 mb-6">
              {TABS.map(tab => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={\`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer \${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}>
                  {tab.icon}{tab.label}
                  {tab.key === 'bank_transfer' && (<span className="ml-1 text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded uppercase">0%</span>)}
                </button>
              ))}
            </div>

            {orderMode === 'test' && (
              <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                Test mode &mdash; no real money will be transferred
              </div>
            )}

            {activeTab === 'upi' && (
              <div className="flex-1 space-y-5 animate-fade-up">
                <div className="md:hidden flex rounded-lg border border-slate-200 overflow-hidden">
                  {['qr','apps'].map(v => (
                    <button key={v} type="button" onClick={() => setMobileView(v)}
                      className={\`flex-1 py-2 text-xs font-semibold transition-all cursor-pointer \${mobileView===v ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}\`}>
                      {v === 'qr' ? 'Scan QR Code' : 'Pay via App'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className={\`\${mobileView === 'apps' ? 'hidden md:flex' : 'flex'} flex-col items-center\`}>
                    <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />Scan with any UPI app
                    </p>
                    <div className="relative p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm inline-flex flex-col items-center">
                      <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-md pointer-events-none" />
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-md pointer-events-none" />
                      <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-md pointer-events-none" />
                      <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-md pointer-events-none" />
                      {upiQrValue ? (
                        <div className="relative">
                          <QRCode value={upiQrValue} size={170} level="H" fgColor="#1e293b" bgColor="#ffffff" />
                          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm">
                            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-laser-scan-horizontal" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-[170px] h-[170px] flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                      )}
                      <div className="mt-3 text-center border-t border-slate-100 pt-2.5 w-full">
                        <p className="text-xs font-bold text-slate-700">Pay &#8377;{displayAmt ? parseFloat(displayAmt).toFixed(2) : '0.00'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PhonePe &middot; GPay &middot; Paytm &middot; BHIM</p>
                      </div>
                    </div>
                    <div className="mt-3 w-full max-w-[220px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">UPI ID</p>
                        <p className="text-xs font-mono font-semibold text-slate-700 truncate">{upiId}</p>
                      </div>
                      <button type="button" onClick={() => copyVal(upiId, setCopiedUpi)} className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className={\`\${mobileView === 'qr' ? 'hidden md:flex' : 'flex'} flex-col flex-1\`}>
                    <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />Open in your UPI app
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {UPI_APPS.map(app => (
                        <button key={app.id} type="button"
                          onClick={() => { if (!displayAmt) return; window.location.href = buildUpiLink(app.id, displayAmt, activeId, merchant, isMandate); }}
                          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl transition-all active:scale-95 cursor-pointer text-left">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0" style={{ backgroundColor: app.color }}>
                            {app.label.substring(0, 2)}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{app.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Already paid? Enter 12-digit UTR reference</p>
                  <form onSubmit={submitUtr} className="flex gap-2">
                    <input type="text" placeholder="e.g. 425619283741" maxLength={16} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\\D/g, ''))}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-mono text-slate-800 outline-none transition-all" />
                    <button type="submit" disabled={utrBusy || !utr.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2">
                      {utrBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                  </form>
                  {utrMsg && (
                    <div className={\`mt-2 flex items-center gap-2 text-xs font-medium p-2.5 rounded-lg \${utrMsg.ok === true ? 'bg-green-50 text-green-700 border border-green-200' : utrMsg.ok === false ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}\`}>
                      {utrMsg.ok === true ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      {utrMsg.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bank_transfer' && (
              <div className="flex-1 space-y-4 animate-fade-up">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-sm text-green-700 font-medium">
                  <Building2 className="w-4 h-4 shrink-0 text-green-600" />
                  Transfer directly to merchant bank account &mdash; 0% platform fee
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {[
                    { label:'Account Name',   val:bankName,   setter:setCopiedBenef, copied:copiedBenef  },
                    { label:'Account Number', val:bankAcc,    setter:setCopiedAcc,   copied:copiedAcc    },
                    { label:'IFSC Code',      val:bankIfsc,   setter:setCopiedIfsc,  copied:copiedIfsc   },
                    { label:'Bank',           val:bankBranch, setter:null,           copied:false        },
                    { label:'Transfer Amount',val:'&#8377;'+(displayAmt ? parseFloat(displayAmt).toFixed(2) : '0.00'), setter:null, copied:false, highlight:true },
                  ].map((row, i) => (
                    <div key={i} className={\`flex items-center justify-between px-4 py-3 \${i > 0 ? 'border-t border-slate-100' : ''} \${row.highlight ? 'bg-blue-50' : 'bg-white'}\`}>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{row.label}</p>
                        <p className={\`text-sm font-mono \${row.highlight ? 'font-bold text-blue-700' : 'font-semibold text-slate-800'}\`} dangerouslySetInnerHTML={{ __html: row.val }} />
                      </div>
                      {row.setter && (
                        <button type="button" onClick={() => copyVal(row.val, row.setter)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                          {row.copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Enter IMPS/NEFT UTR after transfer</p>
                  <form onSubmit={submitUtr} className="flex gap-2">
                    <input type="text" placeholder="IMPS/NEFT reference number" value={utr} onChange={(e) => setUtr(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-green-500 rounded-xl text-sm font-mono text-slate-800 outline-none transition-all" />
                    <button type="submit" disabled={utrBusy || !utr.trim()}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2">
                      {utrBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                    </button>
                  </form>
                  {utrMsg && (
                    <div className={\`mt-2 flex items-center gap-2 text-xs font-medium p-2.5 rounded-lg \${utrMsg.ok === true ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}\`}>
                      {utrMsg.ok === true ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      {utrMsg.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'crypto' && (
              <div className="flex-1 space-y-4 animate-fade-up">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm text-amber-700 font-medium">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 shrink-0 text-amber-600" />
                    Send directly to merchant&apos;s USDT wallet
                  </div>
                  <span className="text-xs bg-amber-200/60 text-amber-800 font-bold px-2 py-0.5 rounded">{cryptoNetwork}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <QRCode value={cryptoWallet} size={140} level="M" fgColor="#1e293b" bgColor="#ffffff" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-2">Scan wallet QR</p>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Amount Due</p>
                      <p className="text-3xl font-black text-slate-900 tabular-nums">{usdtAmt}</p>
                      <p className="text-sm font-bold text-amber-600">USDT</p>
                      <p className="text-[10px] text-slate-400 mt-1">@ &#8377;{CONFIG.usdtInrRate || 90} per USDT</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">TRC-20 Wallet Address</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs text-slate-700 truncate flex-1">{cryptoWallet}</p>
                        <button type="button" onClick={() => copyVal(cryptoWallet, setCopiedWallet)} className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer">
                          {copiedWallet ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Paste your Transaction Hash (TxID) after transfer</p>
                  <form onSubmit={submitTx} className="flex gap-2">
                    <input type="text" placeholder="TxHash from Binance / TrustWallet\u2026" value={txHash} onChange={(e) => setTxHash(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-xs font-mono text-slate-800 outline-none transition-all" />
                    <button type="submit" disabled={txBusy || !txHash.trim()}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2">
                      {txBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                  </form>
                  {txMsg && (
                    <div className={\`mt-2 flex items-center gap-2 text-xs font-medium p-2.5 rounded-lg \${txMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}\`}>
                      {txMsg.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      {txMsg.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowPromo(!showPromo)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors cursor-pointer">
                <Gift className="w-3.5 h-3.5" />
                {appliedPromo ? \`Promo applied: \${appliedPromo.code}\` : 'Have a promo or gift code?'}
              </button>
              {showPromo && !appliedPromo && (
                <form onSubmit={submitPromo} className="flex gap-2 mt-2.5">
                  <input type="text" placeholder="Enter code (e.g. GIFT30)" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-mono text-slate-800 outline-none transition-all uppercase" />
                  <button type="submit" disabled={promoLoading || !promoCode.trim()}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2">
                    {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </form>
              )}
              {promoError   && <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{promoError}</p>}
              {promoSuccess && <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />{promoSuccess}</p>}
            </div>

            <div className="mt-5">
              <button type="button" onClick={() => router.push(\`/status/\${activeId}\`)}
                className="w-full flex items-center justify-center gap-2.5 py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-sm cursor-pointer">
                <CheckCircle2 className="w-5 h-5" />
                I&apos;ve Completed Payment &mdash; Check Status
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Payment monitored in real-time. Auto-confirmation within seconds.
              </div>
            </div>

          </div>
          <div className="border-t border-slate-100 px-6 sm:px-8 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" />256-bit TLS</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />NPCI UPI 2.0</span>
              <span className="flex items-center gap-1"><BadgePercent className="w-3 h-3" />0% MDR</span>
            </div>
            <span>&copy; 2026 MyMobPay</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Loading secure checkout\u2026</p>
        </div>
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}
`;

const target = path.join(__dirname, '..', 'app', 'pay', 'page.jsx');
fs.writeFileSync(target, code, 'utf8');
console.log('Written OK. Lines:', code.split('\n').length, 'Bytes:', Buffer.byteLength(code, 'utf8'));
