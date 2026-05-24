'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import {
  Copy, CheckCircle, Loader2, ShieldCheck,
  IndianRupee, Lock, ArrowRight,
  AlertCircle, Zap,
} from 'lucide-react';

/* ── UPI Logo ──────────────────────────────────────────────── */
const UPILogo = () => (
  <svg viewBox="0 0 60 24" className="w-8 h-3.5" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="18" fontFamily="Arial" fontWeight="800" fontSize="16" fill="#6B7280">UPI</text>
    <path d="M44 2 L52 12 L44 22" stroke="#FF6600" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M50 2 L58 12 L50 22" stroke="#22863A" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

/* ── Animated check ────────────────────────────────────────── */
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.2" />
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2.5"
      strokeDasharray="157" strokeDashoffset="157"
      style={{ animation: 'dash 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
      strokeLinecap="round" />
    <path d="M14 27 L22 35 L38 18" fill="none" stroke="#10B981" strokeWidth="3"
      strokeDasharray="33" strokeDashoffset="33"
      style={{ animation: 'dash 0.4s 0.5s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Dark reusable input ────────────────────────────────────── */
const DarkInput = ({ icon, ...props }) => (
  <div className="relative">
    {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]">{icon}</div>}
    <input
      {...props}
      className={`w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all ${icon ? 'pl-9 pr-4' : 'px-3'} py-2.5`}
    />
  </div>
);

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
  const [note]                    = useState('');

  const [step, setStep]               = useState(paramAmount ? 'paying' : 'form');
  const [orderId, setOrderId]         = useState(null);
  const [orderAmount, setOrderAmount] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [copied, setCopied]           = useState(false);
  const [copiedAmt, setCopiedAmt]     = useState(false);
  const [confirmed, setConfirmed]     = useState(false);
  const [timer, setTimer]             = useState(600);

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

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  async function createOrder(amt) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amt),
          method: 'GENERIC',
          note: note || paramRef || '',
          customer_name: customerName,
          customer_phone: customerPhone,
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
      setError('Please enter a valid amount');
      return;
    }
    createOrder(amount);
  };

  const handleConfirmPaid = () => {
    if (!orderId) return;
    setConfirmed(true);
    setTimeout(() => router.push(`/status/${orderId}`), 800);
  };

  const upiQrValue = orderAmount
    ? `upi://pay?pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${orderAmount}&cu=INR&tn=${orderId}`
    : '';

  const copyUPI = () => {
    navigator.clipboard.writeText(CONFIG.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAmount = () => {
    if (!orderAmount) return;
    navigator.clipboard.writeText(orderAmount.toFixed(2));
    setCopiedAmt(true);
    setTimeout(() => setCopiedAmt(false), 2000);
  };

  /* ═══════════════════════════════════════════════════════════
     STEP 1: Form
  ═══════════════════════════════════════════════════════════ */
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-[#0C0C0E] flex flex-col">
        {/* Header */}
        <header className="w-full border-b border-[#1E1E22] bg-[#0C0C0E] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="font-bold text-sm text-white">PayDrift</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4B5563] font-medium">
            <Lock className="w-3 h-3" />
            <span>Secured by PayDrift</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm animate-fade-up">
            <div className="bg-[#141416] rounded-2xl border border-[#252528] overflow-hidden shadow-2xl">
              {/* Card header */}
              <div className="px-6 pt-6 pb-5 border-b border-[#1E1E22]">
                <p className="text-[11px] text-[#4B5563] font-medium uppercase tracking-wider mb-1">
                  {paramProject !== CONFIG.businessName ? `Paying · ${paramProject}` : 'Payment Details'}
                </p>
                <h1 className="text-xl font-bold text-white">Enter Amount</h1>
              </div>

              <form onSubmit={handleSubmitForm} className="px-6 py-5 space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    Amount (₹)
                  </label>
                  <DarkInput
                    icon={<IndianRupee className="w-4 h-4" />}
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    autoFocus
                  />
                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-2">
                    {[100, 500, 1000, 2000].map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(String(a))}
                        className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                          amount === String(a)
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                            : 'bg-[#1C1C1F] border-[#2E2E33] text-[#6B7280] hover:border-[#3E3E43]'
                        }`}
                      >
                        ₹{a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    Your Name <span className="text-[#3A3A3F] normal-case font-normal">(optional)</span>
                  </label>
                  <DarkInput
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    Phone <span className="text-[#3A3A3F] normal-case font-normal">(optional)</span>
                  </label>
                  <DarkInput
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><span>Proceed to Pay</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>

            {/* Trust footer */}
            <div className="flex items-center justify-center gap-4 mt-5 text-[10px] text-[#4B5563]">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SSL Secure</span>
              <span className="text-[#2A2A2E]">|</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Instant Verify</span>
              <span className="text-[#2A2A2E]">|</span>
              <UPILogo />
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     STEP 2: QR / Payment Screen
  ═══════════════════════════════════════════════════════════ */
  if (step === 'paying' && !confirmed) {
    const displayAmt = orderAmount ?? parseFloat(paramAmount);

    return (
      <div className="min-h-screen bg-[#0C0C0E] flex flex-col">
        {/* Header */}
        <header className="w-full border-b border-[#1E1E22] bg-[#0C0C0E] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-[10px]">P</span>
            </div>
            <span className="font-bold text-xs text-white">PayDrift</span>
          </div>
          <div className="flex items-center gap-3">
            {paramProject && paramProject !== CONFIG.businessName && (
              <span className="text-[10px] text-[#4B5563] font-medium">
                for <strong className="text-[#9CA3AF]">{paramProject}</strong>
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] text-[#4B5563]">
              <Lock className="w-2.5 h-2.5" /><span>Secure</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-start justify-center px-4 py-6">
          <div className="w-full max-w-sm animate-scale-up">
            <div className="bg-[#141416] rounded-2xl border border-[#252528] shadow-2xl overflow-hidden">

              {/* Amount hero */}
              <div className="px-6 pt-6 pb-5 text-center border-b border-[#1E1E22]">
                <p className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest mb-2">Pay Exactly</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-black text-white">₹</span>
                  <span className="text-4xl font-black text-white tabular-nums">
                    {displayAmt ? parseFloat(displayAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3 mt-2.5 text-[10px] text-[#4B5563]">
                  <span>to <strong className="text-[#9CA3AF]">{CONFIG.businessName}</strong></span>
                  <span className="text-[#252528]">·</span>
                  <span className="font-mono text-[9px]">{orderId}</span>
                  <span className="text-[#252528]">·</span>
                  <span className="font-mono text-indigo-400">{formatTime(timer)}</span>
                </div>
              </div>

              {/* QR Code — white background always */}
              <div className="flex flex-col items-center py-6 px-6">
                {upiQrValue ? (
                  <div className="rounded-2xl p-4 bg-white shadow-lg flex flex-col items-center">
                    <QRCode
                      value={upiQrValue}
                      size={180}
                      level="H"
                      fgColor="#111827"
                      bgColor="#FFFFFF"
                    />
                    <div className="mt-3 pt-3 border-t border-gray-100 w-full text-center">
                      <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">
                        Open any UPI app → Scan → Pay
                      </p>
                      <div className="flex justify-center mt-1.5">
                        <UPILogo />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[220px]">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  </div>
                )}

                {/* Copy buttons */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
                  <button
                    onClick={copyUPI}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                      copied
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#1C1C1F] border-[#2E2E33] text-[#9CA3AF] hover:border-[#3E3E43]'
                    }`}
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy UPI ID'}
                  </button>
                  <button
                    onClick={copyAmount}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                      copiedAmt
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#1C1C1F] border-[#2E2E33] text-[#9CA3AF] hover:border-[#3E3E43]'
                    }`}
                  >
                    {copiedAmt ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAmt ? 'Copied!' : `Copy ₹${displayAmt ? parseFloat(displayAmt).toFixed(2) : ''}`}
                  </button>
                </div>

                {/* UPI ID pill */}
                <div className="w-full mt-2 px-3 py-2 rounded-xl bg-[#1C1C1F] border border-[#2E2E33] flex items-center justify-between">
                  <span className="text-[10px] text-[#4B5563]">UPI ID</span>
                  <span className="text-[11px] font-mono font-semibold text-[#9CA3AF]">{CONFIG.upiId}</span>
                </div>
              </div>

              {/* Confirm */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleConfirmPaid}
                  disabled={!orderId}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" />
                  I&apos;ve Paid — Verify Now
                </button>
                <p className="text-center text-[9px] text-[#4B5563] mt-2.5 leading-relaxed">
                  Tap after completing payment. Auto-verification is active.
                </p>
              </div>
            </div>

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-[#4B5563]">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 256-bit SSL</span>
              <span className="text-[#252528]">|</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Live auto-verify</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* Transition */
  return (
    <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <AnimatedCheck />
        <p className="text-sm font-semibold text-[#6B7280]">Redirecting to verification...</p>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0C0C0E]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}
