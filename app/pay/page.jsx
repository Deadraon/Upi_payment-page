'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import {
  Copy, CheckCircle, Loader2, ShieldCheck,
  IndianRupee, Lock, ArrowRight, AlertCircle,
  Zap, QrCode, Smartphone, ChevronRight,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   UPI App Deep Links & Logos
══════════════════════════════════════════════════════════════ */
const getDeepLink = (appId, amount, orderId) => {
  const params = `pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${amount}&cu=INR&tn=${orderId}`;
  switch (appId) {
    case 'gpay':     return `gpay://upi/pay?${params}`;
    case 'phonepe':  return `phonepe://pay?${params}`;
    case 'paytm':    return `paytmmp://upi/pay?${params}`;
    case 'bhim':     return `upi://pay?${params}`;
    default:         return `upi://pay?${params}`;
  }
};

const GPayLogo = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M24 9.5c3.5 0 6.6 1.3 9 3.4l6.7-6.7C35.5 2.4 30.1 0 24 0 14.7 0 6.7 5.4 2.6 13.3l7.8 6C12 13.8 17.5 9.5 24 9.5z"/>
    <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 37.5 46.5 31.4 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
    <path fill="#EA4335" d="M24 48c6.1 0 11.3-2 15-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.5 2.2-6.5 0-12-4.3-14-10.3l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
  </svg>
);

const PhonePeLogo = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="10" fill="#5F259F"/>
    <path fill="white" d="M24 8c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S32.8 8 24 8zm2 22.5h-4V18h4v12.5zm0-14.5h-4v-4h4v4z"/>
  </svg>
);

const PaytmLogo = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="10" fill="#00BAF2"/>
    <text x="5" y="30" fontFamily="Arial" fontWeight="900" fontSize="13" fill="#002970">pay</text>
    <text x="25" y="30" fontFamily="Arial" fontWeight="900" fontSize="13" fill="white">tm</text>
  </svg>
);

const BhimLogo = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="10" fill="#00529B"/>
    <text x="4" y="32" fontFamily="Arial" fontWeight="900" fontSize="16" fill="white">BHIM</text>
  </svg>
);

const UPI_APPS = [
  { id: 'gpay',    label: 'Google Pay',  logo: <GPayLogo />,    ring: 'hover:border-blue-500/40' },
  { id: 'phonepe', label: 'PhonePe',     logo: <PhonePeLogo />, ring: 'hover:border-purple-500/40' },
  { id: 'paytm',   label: 'Paytm',       logo: <PaytmLogo />,   ring: 'hover:border-sky-500/40' },
  { id: 'bhim',    label: 'BHIM UPI',    logo: <BhimLogo />,    ring: 'hover:border-blue-700/40' },
];

/* ══════════════════════════════════════════════════════════════
   Animated Check
══════════════════════════════════════════════════════════════ */
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.2" />
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2.5"
      strokeDasharray="157" strokeDashoffset="157"
      style={{ animation: 'dash 0.6s cubic-bezier(0.65,0,0.45,1) forwards' }} strokeLinecap="round" />
    <path d="M14 27 L22 35 L38 18" fill="none" stroke="#10B981" strokeWidth="3"
      strokeDasharray="33" strokeDashoffset="33"
      style={{ animation: 'dash 0.4s 0.5s cubic-bezier(0.65,0,0.45,1) forwards' }}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   Left Panel — Order Summary
══════════════════════════════════════════════════════════════ */
const OrderPanel = ({ project, amount, orderId, timer }) => {
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div className="flex flex-col justify-between h-full px-7 py-8">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="text-white font-black text-sm">P</span>
          </div>
          <div>
            <span className="font-black text-base text-white tracking-tight">PayDrift</span>
            {project && project !== CONFIG.businessName && (
              <p className="text-[10px] text-[#C9D1D9] font-medium -mt-0.5">via {project}</p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <p className="text-[11px] text-[#C9D1D9] uppercase tracking-widest font-semibold mb-1">Total Due</p>
          <div className="flex items-start gap-1">
            <span className="text-2xl font-black text-white mt-1">₹</span>
            <span className="text-5xl font-black text-white leading-none tabular-nums">
              {amount ? parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>

        {/* Order info */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between py-2 border-b border-[#ffffff18]">
            <span className="text-[11px] text-[#C9D1D9]">To</span>
            <span className="text-[11px] text-[#C9D1D9] font-semibold">{CONFIG.businessName}</span>
          </div>
          {orderId && (
            <div className="flex items-center justify-between py-2 border-b border-[#ffffff18]">
              <span className="text-[11px] text-[#C9D1D9]">Order ID</span>
              <span className="text-[11px] font-mono text-[#C9D1D9]">{orderId}</span>
            </div>
          )}
          {timer !== undefined && (
            <div className="flex items-center justify-between py-2 border-b border-[#ffffff18]">
              <span className="text-[11px] text-[#C9D1D9]">Expires in</span>
              <span className="text-[11px] font-mono text-indigo-400 font-bold">{formatTime(timer)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-8 space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-[#C9D1D9]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>256-bit SSL encrypted payment</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#C9D1D9]">
          <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>Auto-verified via bank email</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#C9D1D9]">
          <Lock className="w-3.5 h-3.5 text-[#C9D1D9] flex-shrink-0" />
          <span>Secured by PayDrift</span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════ */
function PayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramAmount   = searchParams.get('amount') || '';
  const paramProject  = searchParams.get('project') || CONFIG.businessName;
  const paramCallback = searchParams.get('callback') || '';
  const paramName     = searchParams.get('name') || '';
  const paramPhone    = searchParams.get('phone') || '';
  const paramRef      = searchParams.get('ref') || '';

  const [amount, setAmount]       = useState(paramAmount);
  const [customerName, setName]   = useState(paramName);
  const [customerPhone, setPhone] = useState(paramPhone);

  const [step, setStep]               = useState(paramAmount ? 'paying' : 'form');
  const [orderId, setOrderId]         = useState(null);
  const [orderAmount, setOrderAmount] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [timer, setTimer]             = useState(600);
  const [confirmed, setConfirmed]     = useState(false);

  // QR vs App tabs
  const [payView, setPayView] = useState('apps'); // 'apps' | 'qr'
  const [copied, setCopied]   = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);

  const autoCreated = useRef(false);
  useEffect(() => {
    if (paramAmount && !autoCreated.current) {
      autoCreated.current = true;
      createOrder(paramAmount);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 'paying') return;
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        if (payload.new.status === 'verified') router.push(`/status/${orderId}`);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [orderId, router]);

  async function createOrder(amt) {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amt), method: 'GENERIC',
          customer_name: customerName, customer_phone: customerPhone,
          note: paramRef || '',
          project: paramProject !== CONFIG.businessName ? paramProject : undefined,
          callback_url: paramCallback || undefined,
          external_ref: paramRef || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');
      setOrderId(data.orderId);
      setOrderAmount(data.orderAmount);
      if (paramCallback) localStorage.setItem(`callback_${data.orderId}`, paramCallback);
      if (paramRef) localStorage.setItem(`ref_${data.orderId}`, paramRef);
      setStep('paying');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount'); return;
    }
    createOrder(amount);
  };

  const handleConfirmPaid = () => {
    if (!orderId) return;
    setConfirmed(true);
    setTimeout(() => router.push(`/status/${orderId}`), 600);
  };

  const upiQrValue = orderAmount
    ? `upi://pay?pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${orderAmount}&cu=INR&tn=${orderId}`
    : '';

  const copyUPI = () => { navigator.clipboard.writeText(CONFIG.upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyAmt = () => { if (!orderAmount) return; navigator.clipboard.writeText(orderAmount.toFixed(2)); setCopiedAmt(true); setTimeout(() => setCopiedAmt(false), 2000); };

  /* ──────────────────────────────────────────────────────────
     Transition screen
  ────────────────────────────────────────────────────────── */
  if (confirmed) return (
    <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <AnimatedCheck />
        <p className="text-sm font-semibold text-[#C9D1D9]">Redirecting to verification...</p>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────────────────
     FORM STEP (no amount in URL)
  ────────────────────────────────────────────────────────── */
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-scale-up">
          {/* Card */}
          <div className="bg-[#18181E] rounded-2xl border border-[#35353D] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-[#2A2A32]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-black text-xs">P</span>
                </div>
                <span className="font-black text-sm text-white">PayDrift</span>
              </div>
              <p className="text-[11px] text-[#C9D1D9] uppercase tracking-wider font-medium">
                {paramProject !== CONFIG.businessName ? `Paying · ${paramProject}` : 'Enter Payment Details'}
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="px-7 py-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="text-[11px] text-[#C9D1D9] uppercase tracking-wider font-semibold block mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9D1D9]">
                    <IndianRupee className="w-4 h-4" />
                  </span>
                  <input
                    type="number" step="0.01" min="1" placeholder="0.00" autoFocus
                    value={amount} onChange={e => { setAmount(e.target.value); setError(''); }}
                    className="w-full bg-[#1E1E24] border border-[#3A3A42] rounded-xl pl-9 pr-4 py-3 text-white text-base font-bold placeholder-[#3A3A3F] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 2000].map(a => (
                    <button key={a} type="button" onClick={() => setAmount(String(a))}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                        amount === String(a)
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                          : 'bg-[#1E1E24] border-[#3A3A42] text-[#C9D1D9] hover:border-[#3E3E43]'
                      }`}>₹{a}</button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[11px] text-[#C9D1D9] uppercase tracking-wider font-semibold block mb-1.5">
                  Name <span className="text-[#C9D1D9] normal-case font-normal">(optional)</span>
                </label>
                <input type="text" placeholder="Enter your name" value={customerName}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1E1E24] border border-[#3A3A42] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A3A3F] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] text-[#C9D1D9] uppercase tracking-wider font-semibold block mb-1.5">
                  Phone <span className="text-[#C9D1D9] normal-case font-normal">(optional)</span>
                </label>
                <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number"
                  value={customerPhone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#1E1E24] border border-[#3A3A42] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A3A3F] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-600/20">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
          <div className="flex items-center justify-center gap-3 mt-5 text-[10px] text-[#C9D1D9]">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /><span>SSL Secure</span>
            <span>·</span><Zap className="w-3 h-3 text-indigo-600" /><span>Instant Verify</span>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     PAYMENT STEP — Razorpay two-panel layout
  ────────────────────────────────────────────────────────── */
  const displayAmt = orderAmount ?? parseFloat(paramAmount);

  return (
    <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center px-2 py-4">
      <div className="w-full max-w-3xl animate-scale-up">
        <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-[#35353D] shadow-2xl">

          {/* ── LEFT PANEL ── */}
          <div className="w-full md:w-[42%] bg-[#0D0D15] border-b md:border-b-0 md:border-r border-[#2A2A32]">
            {/* Mobile: compact header */}
            <div className="md:hidden px-5 py-4 flex items-center justify-between border-b border-[#2A2A32]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-black text-xs">P</span>
                </div>
                <span className="font-black text-sm text-white">PayDrift</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#C9D1D9]">Total Due</p>
                <p className="text-base font-black text-white">
                  ₹{displayAmt ? parseFloat(displayAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </p>
              </div>
            </div>
            {/* Desktop: full panel */}
            <div className="hidden md:block h-full">
              <OrderPanel project={paramProject} amount={displayAmt} orderId={orderId} timer={timer} />
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex-1 bg-[#18181E]">
            {/* UPI / Tab header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#2A2A32]">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/30">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">UPI</span>
                </div>
                <span className="text-[11px] text-[#C9D1D9]">Other methods coming soon</span>
              </div>
            </div>

            <div className="px-6 py-5">
              {/* View toggle: Apps vs QR */}
              <div className="flex gap-1 p-1 bg-[#0D0D12] rounded-xl mb-5 border border-[#2A2A32]">
                <button onClick={() => setPayView('apps')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    payView === 'apps'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-[#C9D1D9] hover:text-[#C9D1D9]'
                  }`}>
                  <Smartphone className="w-3.5 h-3.5" /> UPI Apps
                </button>
                <button onClick={() => setPayView('qr')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    payView === 'qr'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-[#C9D1D9] hover:text-[#C9D1D9]'
                  }`}>
                  <QrCode className="w-3.5 h-3.5" /> Scan QR
                </button>
              </div>

              {/* ── APPS VIEW ── */}
              {payView === 'apps' && (
                <div className="space-y-3 animate-fade-up">
                  <p className="text-[10px] text-[#C9D1D9] uppercase tracking-wider font-semibold">Select your UPI app</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {UPI_APPS.map(app => (
                      <a
                        key={app.id}
                        href={orderId ? getDeepLink(app.id, orderAmount, orderId) : '#'}
                        className={`flex items-center gap-3 p-3.5 rounded-xl bg-[#1E1E24] border border-[#3A3A42] ${app.ring} hover:border-opacity-100 transition-all active:scale-95 group`}
                      >
                        <div className="flex-shrink-0">{app.logo}</div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white group-hover:text-white transition-colors leading-tight">{app.label}</p>
                          <p className="text-[9px] text-[#C9D1D9] mt-0.5 flex items-center gap-0.5">
                            Open app <ChevronRight className="w-2.5 h-2.5" />
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-[#1E1E22]" />
                    <span className="text-[10px] text-[#C9D1D9] font-medium">OR</span>
                    <div className="flex-1 h-px bg-[#1E1E22]" />
                  </div>

                  {/* UPI ID copy row */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D12] border border-[#2A2A32]">
                    <div>
                      <p className="text-[9px] text-[#C9D1D9] mb-0.5 uppercase tracking-wider">Pay to UPI ID</p>
                      <p className="text-[11px] font-mono font-bold text-[#C9D1D9]">{CONFIG.upiId}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={copyUPI}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#1E1E24] border-[#3A3A42] text-[#C9D1D9] hover:border-[#3E3E43]'
                        }`}>
                        {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy ID'}
                      </button>
                      <button onClick={copyAmt}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          copiedAmt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#1E1E24] border-[#3A3A42] text-[#C9D1D9] hover:border-[#3E3E43]'
                        }`}>
                        {copiedAmt ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedAmt ? 'Copied' : 'Copy Amt'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── QR VIEW ── */}
              {payView === 'qr' && (
                <div className="flex flex-col items-center space-y-4 animate-fade-up">
                  <p className="text-[10px] text-[#C9D1D9] uppercase tracking-wider font-semibold">Scan with any UPI app</p>
                  {upiQrValue ? (
                    <div className="bg-white rounded-2xl p-4 shadow-xl">
                      <QRCode value={upiQrValue} size={190} level="H" fgColor="#111827" bgColor="#FFFFFF" />
                      <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">
                          Open any UPI app → Scan → Pay ₹{displayAmt ? parseFloat(displayAmt).toFixed(2) : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                  )}
                </div>
              )}

              {/* ── CONFIRM BUTTON ── */}
              <div className="mt-5 pt-4 border-t border-[#2A2A32] space-y-2">
                <button
                  onClick={handleConfirmPaid}
                  disabled={!orderId}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  I&apos;ve Paid — Verify Now
                </button>
                <div className="flex items-center justify-center gap-2 text-[9px] text-[#C9D1D9]">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '3s' }} />
                  Checking status automatically in real-time
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#C9D1D9] mt-4">
          © 2026 PayDrift · Secured with 256-bit TLS encryption
        </p>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D12]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}
