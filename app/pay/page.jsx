'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
   bg:      #0D1117  card: #161B22  surface: #21262D
   border:  #30363D  text: #E6EDF3  muted:   #8B949E
═══════════════════════════════════════════════════════════════ */

/* ── Deep Link builder ─────────────────────────────────────── */
const getDeepLink = (appId, amount, orderId) => {
  const params = `pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${amount}&cu=INR&tn=${orderId}`;
  const map = {
    gpay:    `gpay://upi/pay?${params}`,
    phonepe: `phonepe://pay?${params}`,
    paytm:   `paytmmp://upi/pay?${params}`,
    bhim:    `upi://pay?${params}`,
  };
  return map[appId] || `upi://pay?${params}`;
};

/* ── App Logos — official brand images from /public/logos/ ── */
const GPayLogo    = () => <img src="/logos/gpay.svg"    alt="Google Pay"  className="w-8 h-8 object-contain rounded-xl" />;
const PhonePeLogo = () => <img src="/logos/phonepe.svg" alt="PhonePe"     className="w-8 h-8 object-contain rounded-xl" />;
const PaytmLogo   = () => <img src="/logos/paytm.svg"   alt="Paytm"       className="w-8 h-8 object-contain rounded-xl" />;
const BhimLogo    = () => <img src="/logos/bhim.svg"    alt="BHIM UPI"    className="w-8 h-8 object-contain rounded-xl" />;
const PayDriftLogo = ({ className = 'w-8 h-8 object-contain' }) => (
  <img
    src="/logos/logo.svg"
    alt="PayDrift"
    className={`${className} transition-all duration-300 hover:scale-[1.02]`}
    style={{ filter: 'drop-shadow(0 2px 10px rgba(56, 139, 253, 0.25))' }}
  />
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
const OrderPanel = ({ project, amount, orderId, timer }) => {
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  return (
    <div className="flex flex-col justify-between h-full px-7 py-7">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-9">
          <PayDriftLogo className="w-10 h-10 object-contain" />
          <div>
            <p className="font-black text-[15px] text-[#E6EDF3]">PayDrift</p>
            {project && project !== CONFIG.businessName && (
              <p className="text-[10px] text-[#8B949E] -mt-0.5">via {project}</p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-7">
          <p className="text-[10px] text-[#8B949E] uppercase tracking-widest font-semibold mb-2">Total Due</p>
          <div className="flex items-start">
            <span className="text-xl font-black text-[#8B949E] mt-2 mr-0.5">₹</span>
            <span className="text-5xl font-black text-[#E6EDF3] tabular-nums leading-none">
              {amount ? parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>

        {/* Order details */}
        <div className="space-y-0 rounded-xl overflow-hidden border border-[#30363D] divide-y divide-[#21262D]">
          <div className="flex justify-between items-center px-3.5 py-2.5 bg-[#161B22]">
            <span className="text-[11px] text-[#8B949E]">Paying to</span>
            <span className="text-[11px] font-semibold text-[#E6EDF3]">{CONFIG.businessName}</span>
          </div>
          {orderId && (
            <div className="flex justify-between items-center px-3.5 py-2.5 bg-[#161B22]">
              <span className="text-[11px] text-[#8B949E]">Order ID</span>
              <span className="text-[11px] font-mono text-[#C9D1D9]">{orderId}</span>
            </div>
          )}
          {timer !== undefined && (
            <div className="flex justify-between items-center px-3.5 py-2.5 bg-[#161B22]">
              <span className="text-[11px] text-[#8B949E]">Expires in</span>
              <span className="text-[11px] font-mono font-bold text-indigo-400">{fmt(timer)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trust */}
      <div className="mt-8 space-y-2.5 pt-6 border-t border-[#21262D]">
        <div className="flex items-center gap-2 text-[11px] text-[#8B949E]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>256-bit SSL encrypted</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#8B949E]">
          <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>Auto-verified via bank email</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#8B949E]">
          <Lock className="w-3.5 h-3.5 text-[#8B949E] flex-shrink-0" />
          <span>Secured by PayDrift</span>
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

  // Right panel state
  const [payView, setPayView]       = useState('apps');
  const [selectedApp, setSelectedApp] = useState(null); // selected UPI app
  const [copied, setCopied]         = useState(false);
  const [copiedAmt, setCopiedAmt]   = useState(false);

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
      setOrderId(data.orderId); setOrderAmount(data.orderAmount);
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

  const upiQrValue = orderAmount
    ? `upi://pay?pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${orderAmount}&cu=INR&tn=${orderId}`
    : '';

  const copyUPI = () => { navigator.clipboard.writeText(CONFIG.upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyAmt = () => { if (!orderAmount) return; navigator.clipboard.writeText(orderAmount.toFixed(2)); setCopiedAmt(true); setTimeout(() => setCopiedAmt(false), 2000); };

  const openApp = (app) => {
    if (!orderId || !orderAmount) return;
    window.location.href = getDeepLink(app.id, orderAmount, orderId);
  };

  /* ── Transition ── */
  if (confirmed) return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4"><AnimatedCheck />
        <p className="text-sm font-semibold text-[#8B949E]">Redirecting to verification...</p>
      </div>
    </div>
  );


  /* FORM (no amount in URL) */
  if (step === 'form') return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl animate-scale-up">
        <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-[#30363D] shadow-2xl shadow-black/60">

          {/* LEFT branding panel */}
          <div className="order-2 md:order-1 w-full md:w-[42%] bg-[#0D1117] border-t md:border-t-0 md:border-r border-[#21262D] px-7 py-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-10">
                <PayDriftLogo className="w-11 h-11 object-contain" />
                <div>
                  <p className="font-black text-[17px] text-[#E6EDF3] tracking-tight">PayDrift</p>
                  <p className="text-[10px] text-[#8B949E] font-medium">Universal Payment Gateway</p>
                </div>
              </div>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#E6EDF3] leading-snug mb-2">
                  Fast &amp; Secure<br />
                  <span className="text-indigo-400">UPI Payments</span>
                </h1>
                <p className="text-[13px] text-[#8B949E] leading-relaxed">
                  Pay via GPay, PhonePe, Paytm or scan a QR code — auto-verified in seconds.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, title: '256-bit SSL encryption', sub: 'Bank-grade security' },
                  { icon: <Zap className="w-4 h-4 text-indigo-400" />, title: 'Auto-verified instantly', sub: 'No manual confirmation' },
                  { icon: <Lock className="w-4 h-4 text-[#8B949E]" />, title: 'All UPI apps supported', sub: 'GPay, PhonePe, Paytm & more' },
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#161B22] border border-[#21262D]">
                    <div className="mt-0.5 flex-shrink-0">{feat.icon}</div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#C9D1D9]">{feat.title}</p>
                      <p className="text-[10px] text-[#484F58] mt-0.5">{feat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-[#21262D]">
              <p className="text-[10px] text-[#484F58] mb-3">Works with all UPI apps</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#30363D] flex-shrink-0"><GPayLogo /></div>
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#30363D] flex-shrink-0"><PhonePeLogo /></div>
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#30363D] flex-shrink-0"><PaytmLogo /></div>
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#30363D] flex-shrink-0"><BhimLogo /></div>
                <span className="text-[10px] text-[#8B949E]">&amp; more</span>
              </div>
            </div>
          </div>

          {/* RIGHT form panel */}
          <div className="order-1 md:order-2 flex-1 bg-[#161B22] px-7 py-8">
            <div className="mb-6">
              <p className="text-[10px] text-[#484F58] uppercase tracking-widest font-bold mb-1">
                {paramProject !== CONFIG.businessName ? ('Paying via ' + paramProject) : 'New Payment'}
              </p>
              <h2 className="text-xl font-black text-[#E6EDF3]">Enter Details</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[11px] text-[#8B949E] uppercase tracking-wider font-bold block mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#484F58] select-none">₹</span>
                  <input type="number" step="0.01" min="1" autoFocus placeholder="0.00" value={amount}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    className="w-full bg-[#0D1117] border-2 border-[#30363D] rounded-xl pl-9 pr-4 py-4 text-[#E6EDF3] text-2xl font-black placeholder-[#30363D] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all tabular-nums" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2.5">
                  {[100, 500, 1000, 2000].map(a => (
                    <button key={a} type="button" onClick={() => setAmount(String(a))}
                      className={`py-2 text-[12px] font-bold rounded-xl border transition-all ${
                        amount === String(a) ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300' : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:border-[#484F58] hover:text-[#C9D1D9]'
                      }`}>₹{a >= 1000 ? ((a/1000) + 'K') : a}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8B949E] uppercase tracking-wider font-bold block mb-2">Name <span className="text-[#30363D] normal-case font-normal text-[10px]">(opt)</span></label>
                  <input type="text" placeholder="Your name" value={customerName} onChange={e => setName(e.target.value)}
                    className="w-full bg-[#21262D] border border-[#30363D] rounded-xl px-3 py-2.5 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all" />
                </div>
                <div>
                  <label className="text-[11px] text-[#8B949E] uppercase tracking-wider font-bold block mb-2">Phone <span className="text-[#30363D] normal-case font-normal text-[10px]">(opt)</span></label>
                  <input type="tel" inputMode="numeric" maxLength={10} placeholder="Mobile no." value={customerPhone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                    className="w-full bg-[#21262D] border border-[#30363D] rounded-xl px-3 py-2.5 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/25 border border-red-500/25 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-indigo-600/25">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Creating order...</span></> : <><IndianRupee className="w-5 h-5" /><span>Continue to Pay</span><ArrowRight className="w-5 h-5" /></>}
              </button>
              <p className="text-center text-[10px] text-[#484F58]">Secured by 256-bit TLS · Powered by PayDrift</p>
            </form>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#30363D] mt-4">© 2026 PayDrift · All transactions are encrypted</p>
      </div>
    </div>
  );
  /* ════════════════════════════════════════════════════════════
     PAYMENT SCREEN — Razorpay two-panel
  ════════════════════════════════════════════════════════════ */
  const displayAmt = orderAmount ?? parseFloat(paramAmount);

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-3 py-4">
      <div className="w-full max-w-3xl animate-scale-up">
        <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-[#30363D] shadow-2xl shadow-black/50">

          {/* ── LEFT PANEL (order summary) ── */}
          <div className="w-full md:w-[40%] bg-[#0D1117] border-b md:border-b-0 md:border-r border-[#21262D]">
            {/* Mobile compact */}
            <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-[#21262D]">
              <div className="flex items-center gap-2">
                <PayDriftLogo className="w-7 h-7 object-contain" />
                <span className="font-black text-sm text-[#E6EDF3]">PayDrift</span>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-[#8B949E] uppercase tracking-wider">Total</p>
                <p className="text-base font-black text-[#E6EDF3]">
                  ₹{displayAmt ? parseFloat(displayAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </p>
              </div>
            </div>
            {/* Desktop full */}
            <div className="hidden md:block h-full">
              <OrderPanel project={paramProject} amount={displayAmt} orderId={orderId} timer={timer} />
            </div>
          </div>

          {/* ── RIGHT PANEL (payment methods) ── */}
          <div className="flex-1 bg-[#161B22]">
            {/* Tab header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-[#21262D]">
              <div className="px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">UPI</span>
              </div>
              <span className="text-[11px] text-[#484F58]">Other methods coming soon</span>
            </div>

            <div className="px-6 py-5">
              {/* Apps / QR toggle */}
              <div className="flex p-1 bg-[#0D1117] rounded-xl mb-5 border border-[#21262D]">
                {[
                  { id: 'apps', icon: <Smartphone className="w-3.5 h-3.5" />, label: 'UPI Apps' },
                  { id: 'qr',   icon: <QrCode className="w-3.5 h-3.5" />,   label: 'Scan QR'  },
                ].map(tab => (
                  <button key={tab.id} onClick={() => { setPayView(tab.id); setSelectedApp(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                      payView === tab.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-[#8B949E] hover:text-[#C9D1D9]'
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── APPS VIEW ── */}
              {payView === 'apps' && (
                <div className="space-y-3 animate-fade-up">
                  <p className="text-[10px] text-[#8B949E] uppercase tracking-wider font-bold">Select your UPI app</p>

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
                              ? 'bg-[#1C2B4A] border-[#388BFD] shadow-sm shadow-blue-500/20'
                              : 'bg-[#21262D] border-[#30363D] hover:border-[#484F58] hover:bg-[#282E37]'
                          }`}
                        >
                          <div className="flex-shrink-0">{app.logo}</div>
                          <div>
                            <p className={`text-[12px] font-bold leading-tight transition-colors ${isSelected ? 'text-[#E6EDF3]' : 'text-[#C9D1D9]'}`}>
                              {app.label}
                            </p>
                            <p className="text-[9px] text-[#8B949E] mt-0.5">
                              {isSelected ? '✓ Selected' : 'Tap to select'}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="ml-auto w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
                      className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-white"
                      style={{ background: selectedApp.accent }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open {selectedApp.label}
                    </button>
                  )}

                  {/* OR divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#21262D]" />
                    <span className="text-[10px] text-[#484F58] font-medium">OR</span>
                    <div className="flex-1 h-px bg-[#21262D]" />
                  </div>

                  {/* Copy row */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <div>
                      <p className="text-[9px] text-[#8B949E] uppercase tracking-wider mb-0.5">Pay to UPI ID</p>
                      <p className="text-[11px] font-mono font-bold text-[#C9D1D9]">{CONFIG.upiId}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={copyUPI}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          copied ? 'bg-emerald-900/40 border-emerald-600/40 text-emerald-400' : 'bg-[#161B22] border-[#30363D] text-[#8B949E] hover:border-[#484F58] hover:text-[#C9D1D9]'
                        }`}>
                        {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy ID'}
                      </button>
                      <button onClick={copyAmt}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          copiedAmt ? 'bg-emerald-900/40 border-emerald-600/40 text-emerald-400' : 'bg-[#161B22] border-[#30363D] text-[#8B949E] hover:border-[#484F58] hover:text-[#C9D1D9]'
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
                  <p className="text-[10px] text-[#8B949E] uppercase tracking-wider font-bold">Scan with any UPI app</p>
                  {upiQrValue ? (
                    <div className="bg-white rounded-2xl p-5 shadow-xl">
                      <QRCode value={upiQrValue} size={185} level="H" fgColor="#0D1117" bgColor="#FFFFFF" />
                      <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                        <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                          Open UPI app → Scan → Pay ₹{displayAmt ? parseFloat(displayAmt).toFixed(2) : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                  )}
                </div>
              )}

              {/* ── CONFIRM BUTTON ── */}
              <div className="mt-5 pt-4 border-t border-[#21262D] space-y-2">
                <button onClick={handleConfirmPaid} disabled={!orderId}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-emerald-600/20">
                  <CheckCircle className="w-4 h-4" />
                  I&apos;ve Paid — Verify Now
                </button>
                <p className="text-center text-[9px] text-[#484F58] flex items-center justify-center gap-1.5">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '3s' }} />
                  Checking status automatically in real-time
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#30363D] mt-4">© 2026 PayDrift · 256-bit TLS</p>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0D1117]"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>}>
      <PayPageContent />
    </Suspense>
  );
}
