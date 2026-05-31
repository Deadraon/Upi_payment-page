'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import {
  Copy, CheckCircle, Loader2, ShieldCheck,
  IndianRupee, Lock, ArrowRight, AlertCircle,
  Zap, QrCode, Smartphone, ExternalLink,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Theme tokens — GitHub Dark (slate, readable, not too dark)
   bg:      #f8fafc  card: #ffffff  surface: #f1f5f9
   border:  #e2e8f0  text: #0f172a  muted:   #64748b
═══════════════════════════════════════════════════════════════ */

/* ── Deep Link builder ─────────────────────────────────────── */
const getDeepLink = (appId, amount, orderId, merchant, isMandate) => {
  const upiId = merchant?.upi_id || CONFIG.upiId;
  const businessName = merchant?.business_name || CONFIG.businessName;
  
  let params = '';
  let path = 'pay';
  
  if (isMandate) {
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 3);
    const dd = String(trialDate.getDate()).padStart(2, '0');
    const mm = String(trialDate.getMonth() + 1).padStart(2, '0');
    const yyyy = trialDate.getFullYear();
    const validityStartStr = `${dd}${mm}${yyyy}`;
    
    params = `pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount}&cu=INR&tn=${orderId}&validitystart=${validityStartStr}&recur=MONTHLY&amrule=EXACT&share=Y`;
    path = 'mandate';
  } else {
    params = `pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount}&cu=INR&tn=${orderId}`;
  }
  
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  
  if (isAndroid) {
    const androidMap = {
      gpay:    `intent://${path}?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`,
      phonepe: `intent://${path}?${params}#Intent;scheme=upi;package=com.phonepe.app;end;`,
      paytm:   `intent://${path}?${params}#Intent;scheme=upi;package=net.one97.paytm;end;`,
      bhim:    `intent://${path}?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end;`,
    };
    return androidMap[appId] || `intent://${path}?${params}#Intent;scheme=upi;end;`;
  } else {
    // iOS and other fallback deep links
    const iosMap = {
      gpay:    `gpay://${path}?${params}`,
      phonepe: `phonepe://${path}?${params}`,
      paytm:   `paytmmp://${path}?${params}`,
      bhim:    `upi://${path}?${params}`,
    };
    return iosMap[appId] || `upi://${path}?${params}`;
  }
};

/* ── App Logos — official brand images from /public/logos/ ── */
const GPayLogo    = () => <Image src="/logos/gpay.svg"    alt="Google Pay"  width={32} height={32} className="w-8 h-8 object-contain bg-white-pure p-1.5 rounded-xl" />;
const PhonePeLogo = () => <Image src="/logos/phonepe.svg" alt="PhonePe"     width={32} height={32} className="w-8 h-8 object-contain bg-white-pure p-1.5 rounded-xl" />;
const PaytmLogo   = () => <Image src="/logos/paytm.svg"   alt="Paytm"       width={32} height={32} className="w-8 h-8 object-contain bg-white-pure p-1.5 rounded-xl" />;
const BhimLogo    = () => <Image src="/logos/bhim.svg"    alt="BHIM UPI"    width={32} height={32} className="w-8 h-8 object-contain bg-white-pure p-1.5 rounded-xl" />;
const MyMobPayLogo = ({ className = 'w-48 h-auto', textColor = 'var(--text-primary)' }) => (
  <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
    {/* Single unified wordmark with unique mixed fonts */}
    <text x="2" y="42" letterSpacing="0">
      {/* MyMob */}
      <tspan fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="36" fill={textColor}>MyMob</tspan>
      {/* Pay */}
      <tspan fontFamily="'Orbitron', sans-serif" fontWeight="900" fontStyle="italic" fontSize="36" fill="#3B82F6" dx="3">Pay</tspan>
    </text>
  </svg>
);

const UPI_APPS = [
  { id: 'gpay',    label: 'Google Pay',  sub: 'Pay via GPay',    logo: <GPayLogo />,    accent: '#4285F4' },
  { id: 'phonepe', label: 'PhonePe',     sub: 'Pay via PhonePe', logo: <PhonePeLogo />, accent: '#5F259F' },
  { id: 'paytm',   label: 'Paytm',       sub: 'Pay via Paytm',   logo: <PaytmLogo />,   accent: '#00BAF2' },
  { id: 'bhim',    label: 'BHIM UPI',    sub: 'Pay via BHIM',    logo: <BhimLogo />,    accent: '#00529B' },
];

/* ── Animated check ────────────────────────────────────────── */
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.3" />
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2.5"
      strokeDasharray="157" strokeDashoffset="157"
      style={{ animation: 'dash 0.6s cubic-bezier(0.65,0,0.45,1) forwards' }} strokeLinecap="round" />
    <path d="M14 27 L22 35 L38 18" fill="none" stroke="#10B981" strokeWidth="3"
      strokeDasharray="33" strokeDashoffset="33"
      style={{ animation: 'dash 0.4s 0.5s cubic-bezier(0.65,0,0.45,1) forwards' }}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Left Order Panel ──────────────────────────────────────── */
const OrderPanel = ({ project, amount, orderId, timer, merchant }) => {
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const activeBusinessName = merchant?.business_name || CONFIG.businessName;

  return (
    <div className="flex flex-col justify-between h-full px-8 py-8 bg-slate-50/50">
      <div>
        {/* Logo */}
        <div className="flex flex-col items-start gap-1 mb-10">
          <MyMobPayLogo className="w-48 h-auto object-contain" />
          {project && project !== activeBusinessName && (
            <p className="text-[11px] text-slate-500 font-medium ml-1">via {project}</p>
          )}
        </div>

        {/* Amount */}
        <div className="mb-8">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Total Due</p>
          <div className="flex items-start">
            <span className="text-2xl font-black text-slate-400 mt-1 mr-1">₹</span>
            <span className="text-5xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
              {amount ? parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>

        {/* Order details */}
        <div className="space-y-0 rounded-2xl overflow-hidden border border-slate-200 divide-y divide-slate-100 bg-white shadow-sm">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-xs text-slate-500 font-medium">Paying to</span>
            <span className="text-xs font-bold text-slate-900">{activeBusinessName}</span>
          </div>
          {orderId && (
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-slate-500 font-medium">Order ID</span>
              <span className="text-xs font-mono font-medium text-slate-700">{orderId}</span>
            </div>
          )}
          {timer !== undefined && (
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-slate-500 font-medium">Expires in</span>
              <span 
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                style={{
                  color: merchant?.theme_color || '#3B82F6',
                  backgroundColor: `${merchant?.theme_color || '#3B82F6'}10`
                }}
              >
                {fmt(timer)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trust */}
      <div className="mt-8 space-y-3 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>256-bit SSL encrypted</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <Zap className="w-4 h-4 flex-shrink-0" style={{ color: merchant?.theme_color || '#3B82F6' }} />
          <span>Auto-verified via bank email</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Secured by MyMobPay</span>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main Pay Page
═══════════════════════════════════════════════════════════════ */
function PayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramApiKey   = searchParams.get('api_key') || searchParams.get('key') || '';
  const paramAmount   = searchParams.get('amount') || '';
  const paramProject  = searchParams.get('project') || '';
  const paramCallback = searchParams.get('callback') || '';
  const paramName     = searchParams.get('name') || '';
  const paramPhone    = searchParams.get('phone') || '';
  const paramRef      = searchParams.get('ref') || '';
  const paramNote     = searchParams.get('note') || '';
  const paramLid      = searchParams.get('lid') || '';
  const paramOrderId  = searchParams.get('order_id') || searchParams.get('id') || '';

  const [merchant, setMerchant]   = useState(null);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState('');

  const [amount, setAmount]       = useState(paramAmount);
  const [customerName, setName]   = useState(paramName);
  const [customerPhone, setPhone] = useState(paramPhone);

  const [step, setStep]               = useState(paramAmount ? 'paying' : 'form');
  const [orderId, setOrderId]         = useState(null);
  const [orderAmount, setOrderAmount] = useState(null);
  const [orderMode, setOrderMode]     = useState('live');
  const [orderNote, setOrderNote]     = useState(paramNote);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [timer, setTimer]             = useState(600);
  const [confirmed, setConfirmed]     = useState(false);

  async function handleSimulatePayment(simulateStatus) {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, simulateStatus })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation request failed');
      
      if (simulateStatus === 'success') {
        setConfirmed(true);
        setTimeout(() => router.push(`/status/${orderId}`), 600);
      } else {
        setError('Transaction simulated as failed/expired.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Right panel state
  const [payView, setPayView]       = useState('apps');
  const [selectedApp, setSelectedApp] = useState(null); // selected UPI app
  const [copied, setCopied]         = useState(false);
  const [copiedAmt, setCopiedAmt]   = useState(false);

  const autoCreated = useRef(false);

  useEffect(() => {
    async function loadPageData() {
      // Case 1: Pre-generated order ID is present! Load order details and skip details form
      if (paramOrderId) {
        try {
          const res = await fetch(`/api/orders?id=${encodeURIComponent(paramOrderId)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to load order details');
          
          setOrderId(data.orderId);
          setOrderAmount(data.amount);
          setAmount(String(data.amount));
          setOrderMode(data.mode || 'live');
          setOrderNote(data.note || '');
          setMerchant(data.merchant);
          setStep('paying');
          autoCreated.current = true;
        } catch (err) {
          setInitError(err.message);
        } finally {
          setInitLoading(false);
        }
        return;
      }

      // Case 2: Classic API key flow (load merchant, create order if amount in URL)
      if (!paramApiKey) {
        setInitError('Invalid payment link. Missing API Key or Order ID.');
        setInitLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/merchant?key=${encodeURIComponent(paramApiKey)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load merchant details');
        setMerchant(data);
      } catch (err) {
        setInitError(err.message);
      } finally {
        setInitLoading(false);
      }
    }
    loadPageData();
  }, [paramApiKey, paramOrderId]);

  useEffect(() => {
    // Only auto-create in classic API key flow if amount is specified
    if (!paramOrderId && paramAmount && merchant && !autoCreated.current && !initLoading && !initError) {
      autoCreated.current = true;
      createOrder(paramAmount);
    }
  }, [merchant, initLoading, initError, paramOrderId, paramAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 'paying') return;
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (!orderId) return;
    const ch = supabase.channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => { if (payload.new.status === 'verified') router.push(`/status/${orderId}`); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [orderId, router]);

  async function createOrder(amt) {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: paramApiKey,
          amount: parseFloat(amt), method: 'GENERIC',
          customer_name: customerName, customer_phone: customerPhone,
          note: paramNote || paramRef || '',
          project: paramProject || undefined,
          callback_url: paramCallback || undefined,
          external_ref: paramLid ? (paramRef ? `${paramLid}:${paramRef}` : paramLid) : paramRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');
      setOrderId(data.orderId); 
      setOrderAmount(data.orderAmount);
      setOrderMode(data.mode || 'live');
      if (paramCallback) localStorage.setItem(`callback_${data.orderId}`, paramCallback);
      if (paramRef) localStorage.setItem(`ref_${data.orderId}`, paramRef);
      setStep('paying');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { setError('Please enter a valid amount'); return; }
    createOrder(amount);
  };

  const handleConfirmPaid = () => {
    if (!orderId) return;
    setConfirmed(true);
    setTimeout(() => router.push(`/status/${orderId}`), 600);
  };

  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading payment gateway...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full border border-red-500/20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Checkout Unavailable</h2>
          <p className="text-slate-500 text-sm">{initError}</p>
        </div>
      </div>
    );
  }

  const paramMandate  = searchParams.get('mandate') === 'true' || paramNote === 'Autopay_Setup_3DayTrial';
  const isMandate = paramMandate || orderNote === 'Autopay_Setup_3DayTrial' || (orderNote && orderNote.startsWith('Subscription_'));
  const activeBusinessName = paramProject || merchant.business_name;

  let upiQrValue = '';
  if (orderAmount) {
    if (isMandate) {
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 3);
      const dd = String(trialDate.getDate()).padStart(2, '0');
      const mm = String(trialDate.getMonth() + 1).padStart(2, '0');
      const yyyy = trialDate.getFullYear();
      const validityStartStr = `${dd}${mm}${yyyy}`;
      
      upiQrValue = `upi://mandate?pa=${merchant.upi_id}&pn=${encodeURIComponent(activeBusinessName)}&am=${orderAmount}&cu=INR&tn=${orderId}&validitystart=${validityStartStr}&recur=MONTHLY&amrule=EXACT&share=Y`;
    } else {
      upiQrValue = `upi://pay?pa=${merchant.upi_id}&pn=${encodeURIComponent(activeBusinessName)}&am=${orderAmount}&cu=INR&tn=${orderId}`;
    }
  }

  const copyUPI = () => { navigator.clipboard.writeText(merchant.upi_id); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyAmt = () => { if (!orderAmount) return; navigator.clipboard.writeText(orderAmount.toFixed(2)); setCopiedAmt(true); setTimeout(() => setCopiedAmt(false), 2000); };

  const openApp = (app) => {
    if (!orderId || !orderAmount) return;
    window.location.href = getDeepLink(app.id, orderAmount, orderId, merchant, isMandate);
  };

  /* ── Transition ── */
  if (confirmed) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4"><AnimatedCheck />
        <p className="text-sm font-semibold text-slate-500">Redirecting to verification...</p>
      </div>
    </div>
  );


  /* FORM (no amount in URL) */
  if (step === 'form') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl animate-scale-up">
        <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-black/60">

          {/* LEFT branding panel */}
          <div className="order-2 md:order-1 w-full md:w-[42%] bg-slate-50 border-t md:border-t-0 md:border-r border-slate-100 px-7 py-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-col items-start gap-1 mb-8">
                <MyMobPayLogo className="w-64 h-auto object-contain" />
              </div>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 leading-snug mb-2">
                  Fast &amp; Secure<br />
                  <span style={{ color: merchant?.theme_color || '#3B82F6' }}>UPI Payments</span>
                </h1>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Pay via GPay, PhonePe, Paytm or scan a QR code — auto-verified in seconds.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, title: '256-bit SSL encryption', sub: 'Bank-grade security' },
                  { icon: <Zap className="w-4 h-4" style={{ color: merchant?.theme_color || '#3B82F6' }} />, title: 'Auto-verified instantly', sub: 'No manual confirmation' },
                  { icon: <Lock className="w-4 h-4 text-slate-500" />, title: 'All UPI apps supported', sub: 'GPay, PhonePe, Paytm & more' },
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100">
                    <div className="mt-0.5 flex-shrink-0">{feat.icon}</div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-700">{feat.title}</p>
                      <p className="text-[10px] text-[#484F58] mt-0.5">{feat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-100">
              <p className="text-[10px] text-[#484F58] mb-3">Works with all UPI apps</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0"><GPayLogo /></div>
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0"><PhonePeLogo /></div>
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0"><PaytmLogo /></div>
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0"><BhimLogo /></div>
                <span className="text-[10px] text-slate-500">&amp; more</span>
              </div>
            </div>
          </div>

          {/* RIGHT form panel */}
          <div className="order-1 md:order-2 flex-1 bg-white px-7 py-8">
            <div className="mb-6">
              <p className="text-[10px] text-[#484F58] uppercase tracking-widest font-bold mb-1">
                {paramProject !== CONFIG.businessName ? ('Paying via ' + paramProject) : 'New Payment'}
              </p>
              <h2 className="text-xl font-black text-slate-900">Enter Details</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#484F58] select-none">₹</span>
                  <input type="number" step="0.01" min="1" autoFocus placeholder="0.00" value={amount}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-4 py-4 text-slate-900 text-2xl font-black placeholder-[#e2e8f0] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all tabular-nums" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2.5">
                  {[100, 500, 1000, 2000].map(a => (
                    <button key={a} type="button" onClick={() => setAmount(String(a))}
                      className="py-2 text-[12px] font-bold rounded-xl border transition-all"
                      style={amount === String(a) ? {
                        backgroundColor: `${merchant?.theme_color || '#3B82F6'}15`,
                        borderColor: merchant?.theme_color || '#3B82F6',
                        color: merchant?.theme_color || '#3B82F6'
                      } : {
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      ₹{a >= 1000 ? ((a/1000) + 'K') : a}
                    </button>
                  ))}
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/25 border border-red-500/25 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-white-pure font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
                style={{
                  backgroundColor: merchant?.theme_color || '#3B82F6',
                  boxShadow: `0 8px 25px ${(merchant?.theme_color || '#3B82F6')}30`
                }}
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Creating order...</span></> : <><IndianRupee className="w-5 h-5" /><span>Continue to Pay</span><ArrowRight className="w-5 h-5" /></>}
              </button>
              <p className="text-center text-[10px] text-[#484F58]">Secured by 256-bit TLS · Powered by MyMobPay</p>
            </form>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#e2e8f0] mt-4">© 2026 MyMobPay · All transactions are encrypted</p>
      </div>
    </div>
  );
  /* ════════════════════════════════════════════════════════════
     PAYMENT SCREEN — Razorpay two-panel
  ════════════════════════════════════════════════════════════ */
  const displayAmt = orderAmount ?? parseFloat(paramAmount);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl animate-scale-up">
        <div className="flex flex-col md:flex-row rounded-3xl bg-white overflow-hidden border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">

          {/* ── LEFT PANEL (order summary) ── */}
          <div className="w-full md:w-[40%] bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100">
            {/* Mobile compact */}
            <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center">
                <MyMobPayLogo className="w-36 h-auto object-contain" />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Total</p>
                <p className="text-base font-black text-slate-900">
                  ₹{displayAmt ? parseFloat(displayAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </p>
              </div>
            </div>
            {/* Desktop full */}
            <div className="hidden md:block h-full">
              <OrderPanel project={paramProject} amount={displayAmt} orderId={orderId} timer={timer} merchant={merchant} />
            </div>
          </div>

          {/* ── RIGHT PANEL (payment methods) ── */}
          <div className="flex-1 bg-white">
            <div className="flex items-center gap-3 px-8 pt-6 pb-4 border-b border-slate-100">
              <div 
                className="px-3 py-1 rounded-md border"
                style={{
                  backgroundColor: `${merchant?.theme_color || '#3B82F6'}10`,
                  borderColor: `${merchant?.theme_color || '#3B82F6'}30`
                }}
              >
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: merchant?.theme_color || '#3B82F6' }}>UPI</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Other methods coming soon</span>
            </div>

            <div className="px-6 py-5">
              {isMandate && (
                <div className="mb-5 p-4 bg-violet-600/10 border border-violet-500/25 rounded-2xl text-violet-400 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <strong className="text-violet-300 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-mono">UPI Autopay Mandate Setup</strong>
                    <p className="text-[11px] font-semibold text-violet-450 mt-1 leading-relaxed">
                      You are authorizing a monthly Autopay mandate of ₹{displayAmt ? parseFloat(displayAmt).toFixed(2) : '499.00'}.
                      <strong className="text-white"> ₹0.00 will be debited today</strong> (3-Day Free Trial active).
                      The first automatic debit of ₹{displayAmt ? parseFloat(displayAmt).toFixed(2) : '499.00'} will occur in 3 days on {new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}.
                    </p>
                  </div>
                </div>
              )}

              {orderMode === 'test' ? (
                /* ── SANDBOX TEST MODE SIMULATOR UI ── */
                <div className="space-y-5 animate-fade-up">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse mt-0.5" />
                    <div>
                      <strong className="text-amber-300 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">Sandbox Test Mode Active</strong>
                      <p className="text-[11px] font-semibold text-amber-400 mt-1 leading-relaxed">
                        No real money will be debited or transferred. You are using the checkout simulator to test system database updates and automated webhooks.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/25 border border-red-500/25 text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold text-center">Simulate Customer Payments Actions</p>
                    
                    {/* Simulate Success Button */}
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('success')}
                      disabled={loading}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white-pure font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {isMandate ? "Simulate Successful Autopay Mandate Authorization" : "Simulate Successful Payment (Instant Webhook)"}
                    </button>

                    {/* Simulate Failure Button */}
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('failed')}
                      disabled={loading}
                      className="w-full py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
                      Simulate Failed / Expired Transaction
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-[9px] font-mono text-slate-400">Order ID: {orderId} • Simulated via MyMobPay Sandbox API</p>
                  </div>
                </div>
              ) : (
                /* ── ORIGINAL UPI LIVE FLOW ── */
                <>
                  {/* Apps / QR toggle */}
                  <div className="flex p-1 bg-slate-50 rounded-xl mb-5 border border-slate-100">
                    {[
                      { id: 'apps', icon: <Smartphone className="w-3.5 h-3.5" />, label: 'UPI Apps' },
                      { id: 'qr',   icon: <QrCode className="w-3.5 h-3.5" />,   label: 'Scan QR'  },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => { setPayView(tab.id); setSelectedApp(null); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                          payView === tab.id
                            ? 'text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                        style={payView === tab.id ? { backgroundColor: merchant?.theme_color || '#3B82F6' } : {}}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ── APPS VIEW ── */}
                  {payView === 'apps' && (
                    <div className="space-y-3 animate-fade-up">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Select your UPI app</p>

                      {/* App grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {UPI_APPS.map(app => {
                          const isSelected = selectedApp?.id === app.id;
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => setSelectedApp(isSelected ? null : app)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-95 ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-500 shadow-sm shadow-blue-500/10'
                                  : 'bg-white border-slate-200 hover:border-blue-500/50 hover:bg-slate-50/50'
                              }`}
                            >
                              <div className="flex-shrink-0">{app.logo}</div>
                              <div>
                                <p className={`text-[12px] font-bold leading-tight transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                                  {app.label}
                                </p>
                                <p className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>
                                  {isSelected ? '✓ Selected' : 'Tap to select'}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="ml-auto w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Open selected app button */}
                      {selectedApp && (
                        <button
                          type="button"
                          onClick={() => openApp(selectedApp)}
                          disabled={!orderId}
                          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-white-pure"
                          style={{ background: selectedApp.accent }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open {selectedApp.label}
                        </button>
                      )}

                      {/* OR divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] text-[#484F58] font-medium">OR</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      {/* Copy row */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Pay to UPI ID</p>
                          <p className="text-[11px] font-mono font-bold text-slate-700">{merchant?.upi_id || CONFIG.upiId}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={copyUPI}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                              copied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                            }`}>
                            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy ID'}
                          </button>
                          <button onClick={copyAmt}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                              copiedAmt ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                            }`}>
                            {copiedAmt ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedAmt ? 'Copied' : 'Copy ₹'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── QR VIEW ── */}
                  {payView === 'qr' && (
                    <div className="flex flex-col items-center space-y-4 animate-fade-up">
                      {isMandate ? (
                        <div className="text-center space-y-3.5 max-w-[280px]">
                          <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Autopay Scan Restriction</h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                              NPCI regulations strictly require UPI Autopay scan-to-pay QR codes to be cryptographically signed by an official banking partner. Unsigned QR codes will be rejected by Paytm, GPay, and PhonePe as <strong>&quot;Invalid QR&quot;</strong>.
                            </p>
                          </div>
                          <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-xl text-left">
                            <h5 className="text-[9px] font-black text-violet-400 uppercase tracking-wider">How to complete setup:</h5>
                            <ul className="text-[9px] text-slate-500 font-semibold list-disc pl-3.5 space-y-1 mt-1">
                              <li>Open this checkout link directly on a <strong>mobile device</strong> and use the <strong>&quot;UPI Apps&quot;</strong> tab to trigger direct, secure app deep-links.</li>
                              <li>Or, use the <strong>&quot;I&apos;ve Paid — Verify Now&quot;</strong> button to simulate mandate confirmation in Sandbox mode.</li>
                            </ul>
                          </div>
                        </div>
                      ) : upiQrValue ? (
                        <>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Scan with any UPI app</p>
                          <div className="bg-white-pure rounded-2xl p-5 shadow-xl">
                            <QRCode value={upiQrValue} size={185} level="H" fgColor="#0f172a" bgColor="#FFFFFF" />
                            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                              <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                                Open UPI app → Scan → Pay ₹{displayAmt ? parseFloat(displayAmt).toFixed(2) : ''}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-[220px] flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── CONFIRM BUTTON ── */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <button onClick={handleConfirmPaid} disabled={!orderId}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white-pure font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-emerald-600/20">
                      <CheckCircle className="w-4 h-4" />
                      I&apos;ve Paid — Verify Now
                    </button>
                    <p className="text-center text-[9px] text-[#484F58] flex items-center justify-center gap-1.5">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '3s', color: merchant?.theme_color || '#3B82F6' }} />
                      Checking status automatically in real-time
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#e2e8f0] mt-4">© 2026 MyMobPay · 256-bit TLS</p>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} /></div>}>
      <PayPageContent />
    </Suspense>
  );
}
