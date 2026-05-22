'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import {
  IndianRupee,
  CheckCircle,
  Smartphone,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Lock,
  Copy,
  Clock,
  ExternalLink,
} from 'lucide-react';

/* ── UPI App Logos ─────────────────────────────────────────── */
const GPayLogo = () => (
  <svg viewBox="0 0 80 34" className="w-10 h-4" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M25.9,17.7c0-.9-.1-1.8-.2-2.7H13.2v5.1h7.1c-.3,1.6-1.2,3.1-2.6,4v3.3H22C24.5,25.1,25.9,21.7,25.9,17.7z"/>
    <path fill="#34A853" d="M13.2,30.6c3.6,0,6.6-1.2,8.8-3.2l-4.3-3.3c-1.2.8-2.7,1.3-4.5,1.3-3.4,0-6.4-2.3-7.4-5.5H1.4v3.4C3.7,27.8,8.2,30.6,13.2,30.6z"/>
    <path fill="#FBBC04" d="M5.8,19.9c-.6-1.6-.6-3.4,0-5.1v-3.4H1.4c-1.9,3.7-1.9,8.1,0,11.9L5.8,19.9z"/>
    <path fill="#EA4335" d="M13.2,9.4c1.9,0,3.7.7,5.1,2l3.8-3.8C19.7,5.4,16.5,4.1,13.2,4.2c-5,0-9.6,2.8-11.8,7.3l4.4,3.4C6.8,11.7,9.8,9.4,13.2,9.4z"/>
    <path fill="#FAFAFA" d="M37.8,19.7V29h-3V6h7.8c1.9,0,3.7.7,5.1,2 1.4,1.2,2.1,3,2.1,4.9c0,1.9-.7,3.6-2.1,4.9-1.4,1.3-3.1,2-5.1,2L37.8,19.7zm0-11v8h5c1.1,0,2.2-.4,2.9-1.2 1.6-1.5,1.6-4,.1-5.5-.8-.8-1.8-1.3-2.9-1.2L37.8,8.8z"/>
    <path fill="#FAFAFA" d="M56.7,12.8c2.2,0,3.9.6,5.2,1.8s1.9,2.8,1.9,4.8V29H61v-2.2h-.1c-1.2,1.8-2.9,2.7-4.9,2.7-1.7,0-3.2-.5-4.4-1.5-1.1-1-1.8-2.4-1.8-3.9 0-1.6.6-2.9,1.8-3.9 1.2-1,2.9-1.4,4.9-1.4 1.8,0,3.2.3,4.3,1v-.7c0-1-.4-2-1.2-2.6-.8-.7-1.8-1.1-2.9-1.1-1.7,0-3,.7-3.9,2.1L50.2,16C51.8,13.8,53.9,12.8,56.7,12.8zm-3.8,11.4c0,.8.4,1.5,1,1.9.7.5,1.5.8,2.3.8 1.2,0,2.4-.5,3.3-1.4 1-.9,1.5-2,1.5-3.2-.9-.7-2.2-1.1-3.9-1.1-1.2,0-2.2.3-3,.9-.8.6-1.2,1.3-1.2,2.1z"/>
    <path fill="#FAFAFA" d="M80,13.3l-9.9,22.7h-3l3.7-7.9-6.5-14.7h3.2l4.7,11.3h.1l4.6-11.3H80z"/>
  </svg>
);

const PhonePeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5F259F" d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
  </svg>
);

const PaytmLogo = ({ size = 24 }) => (
  <svg width={size} height={size * 0.55} viewBox="0 0 80 44" xmlns="http://www.w3.org/2000/svg">
    <text x="2" y="32" fontFamily="Arial" fontWeight="900" fontSize="32" fill="#002970">pay</text>
    <text x="50" y="32" fontFamily="Arial" fontWeight="900" fontSize="32" fill="#00B9F5">tm</text>
  </svg>
);

const BhimLogo = () => (
  <svg viewBox="0 0 40 24" className="w-7 h-4" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="18" fontFamily="Arial" fontWeight="900" fontSize="18" fill="#FF7A00">BHIM</text>
  </svg>
);

const UPILogo = () => (
  <svg viewBox="0 0 60 24" className="w-9 h-4" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="18" fontFamily="Arial" fontWeight="800" fontSize="16" fill="#FAFAFA">UPI</text>
    <path d="M44 2 L52 12 L44 22" stroke="#FF6600" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M50 2 L58 12 L50 22" stroke="#22863A" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

/* ── Payment methods list ───────────────────────────────── */
const METHODS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    color: '#4285F4',
    logo: <GPayLogo />,
    scheme: (p) => `tez://pay?${p}`,
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    color: '#5F259F',
    logo: <PhonePeLogo />,
    scheme: (p) => `phonepe://pay?${p}`,
  },
  {
    id: 'paytm',
    label: 'Paytm',
    color: '#002970',
    logo: (
      <div className="flex items-center justify-center" style={{ width: 28, height: 28 }}>
        <PaytmLogo size={22} />
      </div>
    ),
    scheme: (p) => `paytmmp://pay?${p}`,
  },
  {
    id: 'bhim',
    label: 'BHIM App',
    color: '#FF7A00',
    logo: <BhimLogo />,
    scheme: (p) => `bhim://pay?${p}`,
  },
  {
    id: 'generic',
    label: 'QR Code',
    color: '#2563EB',
    logo: <UPILogo />,
    scheme: (p) => `upi://pay?${p}`,
  },
];

export default function PayPage() {
  const [amount, setAmount]   = useState('');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [note, setNote]       = useState('');
  const [method, setMethod]   = useState('generic');
  const [step, setStep]       = useState('input');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [orderId, setOrderId] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [timer, setTimer]       = useState(300);
  const amountRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua));
  }, []);

  useEffect(() => {
    if (step !== 'verify' || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const selectedMethod = METHODS.find((m) => m.id === method) || METHODS[4];

  const buildParams = (amt, txnId) => {
    const formattedAmt = parseFloat(amt).toFixed(2);
    return `pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${formattedAmt}&tn=${txnId}&cu=INR&mc=5499`;
  };

  const getDeepLink = (methodId, amt, txnId) => {
    const m = METHODS.find((x) => x.id === methodId) || METHODS[4];
    return m.scheme(buildParams(amt, txnId));
  };

  const upiQrValue = orderId
    ? `upi://pay?${buildParams(amount, orderId)}`
    : '';

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(CONFIG.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method: method.toUpperCase(),
          note,
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order.');
      setOrderId(data.orderId);
      if (data.orderAmount) {
        setAmount(data.orderAmount.toString());
      }
      setTimer(300);
      setStep('verify');
      if (isMobile) {
        const finalAmt = data.orderAmount ? data.orderAmount.toString() : amount;
        setTimeout(() => { window.location.href = getDeepLink(method, finalAmt, data.orderId); }, 300);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPaid = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, method: method.toUpperCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed.');
      }
      window.location.href = `/status/${orderId}`;
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#09090B' }}>

      {/* ── Progress bar on verify step ── */}
      {step === 'verify' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-zinc-800">
          <div className="progress-bar h-full" />
        </div>
      )}

      {/* ── Header ── */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-6 pb-2 flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#2563EB' }}
          >
            <span className="text-white font-black text-sm">P</span>
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-none">PayDrift</h1>
            <p className="text-[9px] mt-0.5 font-medium text-zinc-500 uppercase tracking-widest">
              Secure Checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <ShieldCheck className="w-3 h-3" />
          <span>256-bit Encrypted</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 py-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* LEFT PANE */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1 animate-fade-up">
            <div className="space-y-3">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Instant UPI<br />
                <span className="text-blue-600">Payment Gateway</span>
              </h2>
              <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                Pay directly to the merchant&apos;s bank account. No middlemen, no fees, instant settlement.
              </p>
            </div>

            {/* Status Bar */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="live-dot" />
                  <span className="text-xs font-semibold text-zinc-300">Gateway Status</span>
                </div>
                <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">
                  Online
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
                <div>UPI ID: <span className="text-zinc-300 font-medium">{CONFIG.upiId.split('@')[0]}@...</span></div>
                <div className="text-right">Latency: <span className="text-green-600 font-medium">12ms</span></div>
              </div>
            </div>

            {/* Trust points */}
            <div className="space-y-3">
              {[
                { icon: <ShieldCheck className="w-4 h-4 text-blue-600" />, title: 'Bank-Grade Security', desc: 'End-to-end encrypted payment processing with TLS 1.3.' },
                { icon: <Clock className="w-4 h-4 text-blue-600" />, title: 'Instant Verification', desc: 'Automated payment confirmation within seconds.' },
                { icon: <IndianRupee className="w-4 h-4 text-blue-600" />, title: 'Zero Processing Fee', desc: 'Direct peer-to-peer transfer with no commissions.' },
              ].map(({ icon, title, desc }, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">{title}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANE */}
          <div className="lg:col-span-7 w-full max-w-md mx-auto order-1 lg:order-2">

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs animate-fade-up bg-red-500/10 border border-red-500/30 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: INPUT */}
            {step === 'input' && (
              <div className="glass-card animate-scale-up" style={{ padding: '28px 24px' }}>
                {/* Accent top line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-600" />

                <form onSubmit={handleInitiatePayment} className="space-y-5">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-white">Enter Payment Details</h3>
                    <p className="text-xs text-zinc-500">Secure UPI transfer to verified merchant</p>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Amount (INR)
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <IndianRupee className="w-5 h-5 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        ref={amountRef}
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        required
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); setError(''); }}
                        className="pay-input py-4 pl-11 pr-4 text-3xl font-extrabold"
                      />
                    </div>

                    {/* Quick amounts */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {CONFIG.quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setAmount(amt.toString()); setError(''); }}
                          className={`amount-pill py-2.5 text-center block w-full transition-all ${amount === amt.toString() ? 'active' : ''}`}
                        >
                          ₹{amt.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Method Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Pay via
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`method-card flex items-center gap-2 p-2.5 text-left ${method === m.id ? 'active' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-zinc-800/50 border border-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {m.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-semibold text-zinc-100 block truncate leading-none">{m.label}</span>
                            <span className="text-[8px] text-zinc-500 block mt-1 leading-none">{method === m.id ? 'Selected' : 'UPI'}</span>
                          </div>
                          {method === m.id && (
                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-3.5 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98]"
                    style={{ background: '#2563EB' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isMobile ? 'Pay Now' : 'Generate QR Code'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-zinc-500">
                    🔒 Secured by UPI. Direct bank-to-bank transfer.
                  </p>
                </form>
              </div>
            )}

            {/* STEP 2: VERIFICATION */}
            {step === 'verify' && (
              <div className="glass-card animate-scale-up" style={{ padding: '24px 20px' }}>
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-600" />

                <div className="space-y-5">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setStep('input'); setError(''); }}
                      className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                    >
                      ← Back
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="status-badge pending py-1 text-[9px]">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Awaiting Payment
                      </div>
                      <span className="text-[10px] font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" /> {formatTime(timer)}
                      </span>
                    </div>
                  </div>

                  {/* Amount display */}
                  <div className="text-center space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-blue-600 font-semibold">Pay Exactly</span>
                    <div className="flex items-center justify-center gap-0.5">
                      <IndianRupee className="w-6 h-6 text-blue-600" />
                      <span className="text-4xl font-extrabold text-white">
                        {parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      to <span className="font-semibold text-zinc-400">{CONFIG.businessName}</span>
                    </p>
                  </div>

                  {method === 'generic' ? (
                    /* QR Code */
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="qr-card p-4 flex flex-col items-center">
                        <QRCode
                          value={upiQrValue}
                          size={170}
                          level="H"
                          fgColor="#0F172A"
                          bgColor="#FFFFFF"
                        />
                        <div className="flex flex-col items-center pt-3 w-full border-t border-zinc-800 mt-3 text-center">
                          <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Scan with any UPI app</span>
                          <div className="flex gap-2 items-center mt-1.5">
                            <UPILogo />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* App Launch Button */
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-zinc-800/50 border border-zinc-800">
                        {selectedMethod.logo}
                      </div>
                      <a
                        href={getDeepLink(method, amount, orderId)}
                        className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition-all hover:opacity-90"
                        style={{ background: selectedMethod.color }}
                      >
                        <Smartphone className="w-4 h-4" /> Open {selectedMethod.label}
                      </a>
                      <p className="text-[10px] text-zinc-500 mt-3 text-center">
                        If the app doesn&apos;t open, tap the button above.
                      </p>
                    </div>
                  )}

                  {/* VPA Copy */}
                  <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 font-medium">UPI ID:</span>
                      <button
                        onClick={handleCopyVpa}
                        className="text-zinc-400 hover:text-blue-600 flex items-center gap-1 font-mono transition-colors border border-zinc-800 bg-zinc-900 hover:bg-blue-500/10 px-2 py-0.5 rounded text-[10px]"
                      >
                        {copied ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Copied!
                          </span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-blue-600" />
                            <span className="truncate max-w-[150px]">{CONFIG.upiId}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-[9px] text-zinc-500 text-center">
                      Payee: <strong className="text-zinc-300">{CONFIG.businessName}</strong>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <div className="space-y-2">
                    <button
                      onClick={handleConfirmPaid}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      style={{ background: '#16A34A' }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>I have paid successfully</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[9px] text-zinc-500">
                      Payment will be auto-verified within seconds.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-5 text-center border-t border-zinc-800 bg-zinc-900">
        <p className="text-[10px] text-zinc-500">
          © 2026 PayDrift · All transactions are encrypted and secure.
        </p>
        <p className="text-[9px] text-zinc-400 mt-1">
          By proceeding, you agree to our Terms & Conditions and Privacy Policy.
        </p>
        <p className="text-[10px] text-zinc-500 mt-2">
          Built with ❤️ by MOB
        </p>
      </footer>
    </div>
  );
}
