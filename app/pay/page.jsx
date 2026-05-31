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
   Theme tokens — Minimalist Premium (Light Mode / Crisp Contrast)
   bg:      #F8FAFC  card: #ffffff  surface: #F8FAFC
   border:  #E2E8F0  text: #0F172A  muted:   #64748B
   ═══════════════════════════════════════════════════════════════ */

/* ── Deep Link builder ─────────────────────────────────────── */
const getDeepLink = (appId, amount, orderId, merchant, isMandate) => {
  const upiId = merchant?.upi_id || CONFIG.upiId;
  const businessName = merchant?.business_name || CONFIG.businessName;
  
  let params = '';
  let upiPath = 'pay';
  
  if (isMandate) {
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 3);
    const dd = String(trialDate.getDate()).padStart(2, '0');
    const mm = String(trialDate.getMonth() + 1).padStart(2, '0');
    const yyyy = trialDate.getFullYear();
    const validityStartStr = `${dd}${mm}${yyyy}`;
    
    params = `pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount}&cu=INR&tn=${orderId}&validitystart=${validityStartStr}&recur=MONTHLY&amrule=EXACT&share=Y`;
    upiPath = 'mandate';
  } else {
    params = `pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount}&cu=INR&tn=${orderId}`;
  }
  
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  
  if (isAndroid) {
    const androidMap = {
      gpay:    `intent://upi/${upiPath}?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`,
      phonepe: `intent://upi/${upiPath}?${params}#Intent;scheme=upi;package=com.phonepe.app;end;`,
      paytm:   `intent://upi/${upiPath}?${params}#Intent;scheme=upi;package=net.one97.paytm;end;`,
      bhim:    `intent://upi/${upiPath}?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end;`,
    };
    return androidMap[appId] || `intent://upi/${upiPath}?${params}#Intent;scheme=upi;end;`;
  } else {
    // iOS and other fallback deep links
    const iosMap = {
      gpay:    `gpay://upi/${upiPath}?${params}`,
      phonepe: `phonepe://${upiPath}?${params}`,
      paytm:   `paytmmp://upi/${upiPath}?${params}`,
      bhim:    `upi://${upiPath}?${params}`,
    };
    return iosMap[appId] || `upi://${upiPath}?${params}`;
  }
};

/* ── App Logos — official brand images from /public/logos/ ── */
const GPayLogo    = () => <Image src="/logos/gpay.svg"    alt="Google Pay"  width={24} height={24} className="w-6 h-6 object-contain" />;
const PhonePeLogo = () => <Image src="/logos/phonepe.svg" alt="PhonePe"     width={24} height={24} className="w-6 h-6 object-contain" />;
const PaytmLogo   = () => <Image src="/logos/paytm.svg"   alt="Paytm"       width={24} height={24} className="w-6 h-6 object-contain" />;
const BhimLogo    = () => <Image src="/logos/bhim.svg"    alt="BHIM UPI"    width={24} height={24} className="w-6 h-6 object-contain" />;
const MyMobPayLogo = ({ className = 'w-36 h-auto', textColor = '#0F172A' }) => (
  <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.01]`}>
    <text x="2" y="42" letterSpacing="-0.5">
      <tspan fontFamily="'Outfit', -apple-system, sans-serif" fontWeight="800" fontSize="34" fill={textColor}>MyMob</tspan>
      <tspan fontFamily="'Outfit', -apple-system, sans-serif" fontWeight="900" fontSize="34" fill="#2563EB" dx="2">Pay</tspan>
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
  <svg viewBox="0 0 52 52" className="w-12 h-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.15" />
    <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeDasharray="157" strokeDashoffset="157"
      style={{ animation: 'dash 0.6s cubic-bezier(0.65,0,0.45,1) forwards' }} strokeLinecap="round" />
    <path d="M14 27 L22 35 L38 18" fill="none" stroke="currentColor" strokeWidth="3"
      strokeDasharray="33" strokeDashoffset="33"
      style={{ animation: 'dash 0.4s 0.5s cubic-bezier(0.65,0,0.45,1) forwards' }}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Left Order Panel (Sleek minimalist summary panel) ──────────────────────────────────────── */
const OrderPanel = ({ project, amount, orderId, timer, merchant }) => {
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const activeBusinessName = merchant?.business_name || CONFIG.businessName;

  return (
    <div className="flex flex-col justify-between h-full px-8 py-10 bg-slate-50/50 border-r border-slate-100">
      <div>
        {/* Brand Header */}
        <div className="flex flex-col items-start gap-1 mb-8">
          <MyMobPayLogo className="w-40 h-auto object-contain" />
          {project && project !== activeBusinessName && (
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">via {project}</p>
          )}
        </div>

        {/* Amount Section */}
        <div className="mb-10">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Total Due</p>
          <div className="flex items-baseline">
            <span className="text-3xl font-black text-slate-800 mr-1 select-none">₹</span>
            <span className="text-5xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
              {amount ? parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-3">
            <span className="text-slate-400 font-medium">Merchant</span>
            <span className="font-bold text-slate-850">{activeBusinessName}</span>
          </div>
          {orderId && (
            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-3">
              <span className="text-slate-400 font-medium">Order ID</span>
              <span className="font-mono font-bold text-slate-700 text-[11px]">{orderId}</span>
            </div>
          )}
          {timer !== undefined && (
            <div className="flex justify-between items-center text-xs pb-1">
              <span className="text-slate-400 font-medium">Session Expires</span>
              <span className="font-mono font-bold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100">
                {fmt(timer)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trust & Badging (Extremely minimalist) */}
      <div className="mt-12 space-y-3 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>256-Bit SSL Secured</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-pulse" />
          <span>Automated Bank Routing</span>
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
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-slate-800 animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Gateway</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4 font-sans antialiased">
        <div className="bg-white p-8 rounded-3xl max-w-sm w-full border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-extrabold text-slate-900 mb-1.5">Checkout Unavailable</h2>
          <p className="text-slate-450 text-[12px] font-semibold leading-relaxed mb-4">{initError}</p>
          <button onClick={() => window.location.reload()} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all">
            Try Again
          </button>
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
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center font-sans antialiased">
      <div className="flex flex-col items-center gap-3">
        <AnimatedCheck />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Verifying payment status</p>
      </div>
    </div>
  );

  /* FORM SCREEN (Enter custom amount if not in URL) */
  if (step === 'form') return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-8 font-sans antialiased">
      <div className="w-full max-w-md animate-scale-up">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="flex justify-center mb-6">
              <MyMobPayLogo className="w-36 h-auto object-contain" />
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-1">
              {paramProject ? `Pay via ${paramProject}` : 'Merchant Checkout'}
            </p>
            <h2 className="text-lg font-black text-slate-900">Enter Payment Amount</h2>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 pt-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block w-full max-w-[240px]">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300 select-none">₹</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1" 
                    autoFocus 
                    placeholder="0.00" 
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    className="w-full text-center text-4xl font-extrabold text-slate-900 bg-transparent border-0 border-b-2 border-slate-100 focus:border-slate-900 focus:ring-0 rounded-none py-2 placeholder-slate-200 tracking-tight transition-all tabular-nums" 
                  />
                </div>

                {/* Amount quick select chips */}
                <div className="flex justify-center gap-1.5 mt-5">
                  {[100, 500, 1000, 2000].map(a => (
                    <button 
                      key={a} 
                      type="button" 
                      onClick={() => setAmount(String(a))}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all text-slate-650"
                      style={amount === String(a) ? {
                        backgroundColor: '#0F172A',
                        borderColor: '#0F172A',
                        color: '#FFFFFF'
                      } : {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                      }}
                    >
                      ₹{a >= 1000 ? ((a/1000) + 'k') : a}
                    </button>
                  ))}
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-[11px] text-red-500 font-semibold leading-relaxed">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />{error}
                </div>
              )}

              {/* Stripe-like Primary Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-slate-950/5"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-6">
          Secured by MyMobPay · 256-Bit TLS
        </p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     PAYMENT SCREEN — Razorpay/Stripe Ultra-Minimal Redesign
  ════════════════════════════════════════════════════════════ */
  const displayAmt = orderAmount ?? parseFloat(paramAmount);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-8 font-sans antialiased">
      <div className="w-full max-w-3xl animate-scale-up">
        <div className="flex flex-col md:flex-row rounded-3xl bg-white overflow-hidden border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">

          {/* ── LEFT PANEL (Desktop order summary) ── */}
          <div className="w-full md:w-[40%]">
            {/* Mobile Compact Header */}
            <div className="md:hidden flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <MyMobPayLogo className="w-32 h-auto object-contain" />
              <div className="text-right">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Total Due</p>
                <p className="text-lg font-black text-slate-900">
                  ₹{displayAmt ? parseFloat(displayAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </p>
              </div>
            </div>
            {/* Desktop Full Panel */}
            <div className="hidden md:block h-full">
              <OrderPanel project={paramProject} amount={displayAmt} orderId={orderId} timer={timer} merchant={merchant} />
            </div>
          </div>

          {/* ── RIGHT PANEL (Checkout payment area) ── */}
          <div className="flex-1 bg-white">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Pay Securely via UPI</span>
              </div>
              {orderMode === 'test' && (
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-500 rounded-md border border-amber-100">
                  Test Sandbox
                </span>
              )}
            </div>

            <div className="px-8 py-6">
              {/* Option 2: Special Trial Banner */}
              {orderNote === 'Trial_Setup_3Day' && (
                <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <Zap className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <strong className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">3-Day Premium Activation</strong>
                    <p className="text-[11px] font-semibold text-indigo-750 mt-1 leading-relaxed">
                      You are paying a one-time ₹1.00 verification fee. This activates your 3-day full merchant access instantly with no recurring mandates or future auto-debits.
                    </p>
                  </div>
                </div>
              )}

              {/* Legacy Mandate Banner (Styled minimally) */}
              {isMandate && orderNote !== 'Trial_Setup_3Day' && (
                <div className="mb-6 p-4 bg-violet-50/50 border border-violet-100 rounded-2xl flex items-start gap-3">
                  <Zap className="w-4.5 h-4.5 text-violet-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <strong className="text-xs font-extrabold text-violet-950 uppercase tracking-wider font-mono">Autopay Mandate Setup</strong>
                    <p className="text-[11px] font-semibold text-violet-750 mt-1 leading-relaxed">
                      Authorizing monthly Autopay of ₹{displayAmt ? parseFloat(displayAmt).toFixed(2) : '499.00'}.
                      <strong className="text-violet-950 font-bold"> ₹0.00 will be debited today</strong> (3-Day Free Trial).
                      First debit of ₹{displayAmt ? parseFloat(displayAmt).toFixed(2) : '499.00'} begins in 3 days on {new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}.
                    </p>
                  </div>
                </div>
              )}

              {orderMode === 'test' ? (
                /* ── SANDBOX TEST MODE SIMULATOR UI ── */
                <div className="space-y-6 animate-fade-up">
                  <div className="p-4 bg-amber-50/50 border border-amber-100 text-amber-800 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">Test Simulator Active</strong>
                      <p className="text-[11px] font-semibold text-amber-700 mt-1 leading-relaxed">
                        This is a sandbox environment. No actual money will be charged. Click below to simulate payment operations.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-[11px] text-red-500 font-semibold leading-relaxed">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />{error}
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2">
                    {/* Simulate Success Button */}
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('success')}
                      disabled={loading}
                      className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-slate-950/5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      <span>{isMandate ? "Simulate Mandate Authorization Success" : "Simulate Payment Success (Webhook)"}</span>
                    </button>

                    {/* Simulate Failure Button */}
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('failed')}
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-slate-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span>Simulate Payment Failure</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                      Order ID: {orderId}
                    </p>
                  </div>
                </div>
              ) : (
                /* ── ORIGINAL UPI LIVE FLOW ── */
                <>
                  {/* Tab Selector */}
                  <div className="flex p-1 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                    {[
                      { id: 'apps', icon: <Smartphone className="w-3.5 h-3.5" />, label: 'UPI Apps' },
                      { id: 'qr',   icon: <QrCode className="w-3.5 h-3.5" />,   label: 'Scan QR'  },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => { setPayView(tab.id); setSelectedApp(null); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                          payView === tab.id
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'text-slate-450 hover:text-slate-700'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ── APPS VIEW ── */}
                  {payView === 'apps' && (
                    <div className="space-y-4 animate-fade-up">
                      {/* App grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {UPI_APPS.map(app => {
                          const isSelected = selectedApp?.id === app.id;
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => setSelectedApp(isSelected ? null : app)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-slate-950 border-slate-950 shadow-sm text-white'
                                  : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 text-slate-900'
                              }`}
                            >
                              <div className={`flex-shrink-0 bg-white p-1 rounded-lg ${isSelected ? 'shadow-sm' : 'border border-slate-100'}`}>
                                {app.logo}
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-[11px] font-extrabold leading-tight truncate">
                                  {app.label}
                                </p>
                                <p className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                                  {isSelected ? 'Selected' : 'Pay now'}
                                </p>
                              </div>
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
                          className="w-full py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-white"
                          style={{ background: selectedApp.accent }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Pay with {selectedApp.label}
                        </button>
                      )}

                      {/* OR Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Or Pay Manually</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      {/* Manual details copy panel */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="overflow-hidden mr-2">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold mb-0.5">UPI Address</p>
                          <p className="text-xs font-mono font-bold text-slate-800 truncate">{merchant?.upi_id || CONFIG.upiId}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={copyUPI}
                            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                              copied 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                            }`}>
                            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy ID'}</span>
                          </button>
                          <button onClick={copyAmt}
                            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                              copiedAmt 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                            }`}>
                            {copiedAmt ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedAmt ? 'Copied' : 'Copy ₹'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── QR VIEW ── */}
                  {payView === 'qr' && (
                    <div className="flex flex-col items-center space-y-4 animate-fade-up">
                      {isMandate && orderNote !== 'Trial_Setup_3Day' ? (
                        <div className="text-center space-y-3 max-w-[280px] py-2">
                          <div className="mx-auto w-10 h-10 bg-amber-50 border border-amber-100 text-amber-600 rounded-full flex items-center justify-center animate-pulse">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest">Mandate Scans Limited</h4>
                            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed font-semibold">
                              UPI Autopay mandate scan-to-pay QRs require cryptographic network signatures. Scans may be rejected as <strong>&quot;Invalid QR&quot;</strong> in user apps.
                            </p>
                          </div>
                          <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl text-left">
                            <h5 className="text-[9px] font-extrabold text-violet-850 uppercase tracking-wider">Workaround options:</h5>
                            <ul className="text-[9px] text-slate-500 font-semibold list-disc pl-3.5 space-y-1 mt-1 leading-relaxed">
                              <li>Open checkout link on your **mobile phone** &amp; use the **UPI Apps** tab for direct routing.</li>
                              <li>Use the simulator below to confirm payment and unlock your dashboard.</li>
                            </ul>
                          </div>
                        </div>
                      ) : upiQrValue ? (
                        <>
                          <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
                            <QRCode value={upiQrValue} size={160} level="H" fgColor="#0F172A" bgColor="#FFFFFF" />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-widest">
                              Scan QR with GPay, PhonePe, or Paytm
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="h-[180px] flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── VERIFY BUTTON & AUTO-ROUTING ── */}
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                    <button onClick={handleConfirmPaid} disabled={!orderId}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-emerald-600/10">
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>I&apos;ve Completed the Payment</span>
                    </button>
                    <p className="text-center text-[10px] text-slate-450 font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" style={{ animationDuration: '2.5s' }} />
                      <span>Detecting payment automatically</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-6">
          © 2026 MyMobPay · 256-Bit TLS Bank Encrypted Checkouts
        </p>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>}>
      <PayPageContent />
    </Suspense>
  );
}
