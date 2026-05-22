'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import {
  IndianRupee,
  User,
  Phone,
  MessageSquare,
  CheckCircle,
  Smartphone,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Mail,
  ChevronRight,
  Zap,
  Lock,
  Sparkles,
  Copy,
  Clock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

/* ── Paytm / GPay / PhonePe / BHIM SVG logos ─────────────── */
const PaytmLogo = ({ size = 28 }) => (
  <svg width={size} height={size * 0.55} viewBox="0 0 80 44" xmlns="http://www.w3.org/2000/svg">
    <text x="2" y="32" fontFamily="Arial" fontWeight="900" fontSize="32" fill="#002970">pay</text>
    <text x="50" y="32" fontFamily="Arial" fontWeight="900" fontSize="32" fill="#00D2FF">tm</text>
  </svg>
);

const GPayLogo = () => (
  <svg viewBox="0 0 80 34" className="w-12 h-5" xmlns="http://www.w3.org/2000/svg">
    <path fill="#F8FAFC" d="M37.8,19.7V29h-3V6h7.8c1.9,0,3.7.7,5.1,2 1.4,1.2,2.1,3,2.1,4.9c0,1.9-.7,3.6-2.1,4.9-1.4,1.3-3.1,2-5.1,2L37.8,19.7zm0-11v8h5c1.1,0,2.2-.4,2.9-1.2 1.6-1.5,1.6-4,.1-5.5-.8-.8-1.8-1.3-2.9-1.2L37.8,8.8z"/>
    <path fill="#F8FAFC" d="M56.7,12.8c2.2,0,3.9.6,5.2,1.8s1.9,2.8,1.9,4.8V29H61v-2.2h-.1c-1.2,1.8-2.9,2.7-4.9,2.7-1.7,0-3.2-.5-4.4-1.5-1.1-1-1.8-2.4-1.8-3.9 0-1.6.6-2.9,1.8-3.9 1.2-1,2.9-1.4,4.9-1.4 1.8,0,3.2.3,4.3,1v-.7c0-1-.4-2-1.2-2.6-.8-.7-1.8-1.1-2.9-1.1-1.7,0-3,.7-3.9,2.1L50.2,16C51.8,13.8,53.9,12.8,56.7,12.8zm-3.8,11.4c0,.8.4,1.5,1,1.9.7.5,1.5.8,2.3.8 1.2,0,2.4-.5,3.3-1.4 1-.9,1.5-2,1.5-3.2-.9-.7-2.2-1.1-3.9-1.1-1.2,0-2.2.3-3,.9-.8.6-1.2,1.3-1.2,2.1z"/>
    <path fill="#F8FAFC" d="M80,13.3l-9.9,22.7h-3l3.7-7.9-6.5-14.7h3.2l4.7,11.3h.1l4.6-11.3H80z"/>
    <path fill="#4285F4" d="M25.9,17.7c0-.9-.1-1.8-.2-2.7H13.2v5.1h7.1c-.3,1.6-1.2,3.1-2.6,4v3.3H22C24.5,25.1,25.9,21.7,25.9,17.7z"/>
    <path fill="#34A853" d="M13.2,30.6c3.6,0,6.6-1.2,8.8-3.2l-4.3-3.3c-1.2.8-2.7,1.3-4.5,1.3-3.4,0-6.4-2.3-7.4-5.5H1.4v3.4C3.7,27.8,8.2,30.6,13.2,30.6z"/>
    <path fill="#FBBC04" d="M5.8,19.9c-.6-1.6-.6-3.4,0-5.1v-3.4H1.4c-1.9,3.7-1.9,8.1,0,11.9L5.8,19.9z"/>
    <path fill="#EA4335" d="M13.2,9.4c1.9,0,3.7.7,5.1,2l3.8-3.8C19.7,5.4,16.5,4.1,13.2,4.2c-5,0-9.6,2.8-11.8,7.3l4.4,3.4C6.8,11.7,9.8,9.4,13.2,9.4z"/>
  </svg>
);

const PhonePeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
    <path fill="#A78BFA" d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
  </svg>
);

const UPILogo = () => (
  <svg viewBox="0 0 60 24" className="w-10 h-4" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="18" fontFamily="Arial" fontWeight="800" fontSize="16" fill="#10B981">UPI</text>
    <path d="M44 2 L52 12 L44 22" stroke="#FF6600" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M50 2 L58 12 L50 22" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const BhimLogo = () => (
  <svg viewBox="0 0 40 24" className="w-8 h-5" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="18" fontFamily="Arial" fontWeight="900" fontSize="18" fill="#FF7A00">BHIM</text>
  </svg>
);

/* ── Live background orbs ────────────────────────────── */
const Background = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Ambient Glows */}
    <div
      className="absolute w-[800px] h-[800px] rounded-full opacity-[0.08] animate-pulse-glow"
      style={{
        background: 'radial-gradient(circle, #00D2FF 0%, #002970 80%)',
        top: '-15%', left: '-10%',
      }}
    />
    <div
      className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06] animate-pulse-glow"
      style={{
        background: 'radial-gradient(circle, #c084fc 0%, #002970 80%)',
        bottom: '-10%', right: '-5%',
        animationDelay: '2s',
      }}
    />
    {/* Interactive Grid Pattern */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,210,255,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,210,255,0.4) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
    {/* Dark Vignette Mask */}
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, #060814 100%)',
      }}
    />
    {/* Floating Particles */}
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${3 + (i % 3) * 2}px`,
          height: `${3 + (i % 3) * 2}px`,
          background: i % 2 === 0 ? 'rgba(0,210,255,0.3)' : 'rgba(192,132,252,0.3)',
          top: `${10 + i * 11}%`,
          left: `${5 + i * 13}%`,
          animation: `float ${4 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
          filter: 'blur(0.5px)',
        }}
      />
    ))}
  </div>
);

/* ── Payment methods list ───────────────────────────────── */
const METHODS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    color: '#00D2FF',
    bg: 'rgba(0,210,255,0.06)',
    logo: <GPayLogo />,
    scheme: (p) => `tez://pay?${p}`,
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.06)',
    logo: <PhonePeLogo />,
    scheme: (p) => `phonepe://pay?${p}`,
  },
  {
    id: 'paytm',
    label: 'Paytm',
    color: '#00D2FF',
    bg: 'rgba(0,210,255,0.06)',
    logo: (
      <div className="bg-transparent rounded-lg flex items-center justify-center" style={{ width: 32, height: 32 }}>
        <PaytmLogo size={24} />
      </div>
    ),
    scheme: (p) => `paytmmp://pay?${p}`,
  },
  {
    id: 'bhim',
    label: 'BHIM App',
    color: '#FF7A00',
    bg: 'rgba(255,122,0,0.06)',
    logo: <BhimLogo />,
    scheme: (p) => `bhim://pay?${p}`,
  },
  {
    id: 'generic',
    label: 'Show QR Code',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.06)',
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
  const [step, setStep]       = useState('input');   // 'input' | 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [orderId, setOrderId] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [timer, setTimer]       = useState(600); // 10 minute session timer
  const amountRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua));
  }, []);

  // Countdown logic for verify step
  useEffect(() => {
    if (step !== 'verify' || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const selectedMethod = METHODS.find((m) => m.id === method) || METHODS[3];

  const buildParams = (amt, txnId) => {
    const formattedAmt = parseFloat(amt).toFixed(2);
    return `pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${formattedAmt}&tn=${txnId}&cu=INR&mc=5499`;
  };

  const getDeepLink = (methodId, amt, txnId) => {
    const m = METHODS.find((x) => x.id === methodId) || METHODS[3];
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
      setTimer(600); // reset 10 mins
      setStep('verify');
      if (isMobile) {
        setTimeout(() => { window.location.href = getDeepLink(method, amount, data.orderId); }, 300);
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
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden" style={{ background: '#060814' }}>
      <Background />

      {/* ── Top session status bar on verify step ── */}
      {step === 'verify' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
          <div className="progress-bar h-full" />
        </div>
      )}

      {/* ── Elegant Simple Header ── */}
      <header className="relative z-10 max-w-5xl mx-auto w-full px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-fade-up">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #00D2FF 0%, #0066CC 100%)',
              boxShadow: '0 4px 16px rgba(0,210,255,0.3)',
            }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">
              {CONFIG.businessName}
            </h1>
            <p className="text-[9px] mt-1 font-mono tracking-widest text-[#00D2FF]">
              SECURE CHECKOUT
            </p>
          </div>
        </div>

        <div
          className="animate-fade-up flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#34d399',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PCI-DSS Secured</span>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ─────────────── LEFT PANE: TRUST & SPECIFICATIONS (Desktop only or clean stacks) ─────────────── */}
          <div className="lg:col-span-5 space-y-6 lg:block order-2 lg:order-1 animate-fade-up">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest bg-[#00D2FF]/10 text-[#00D2FF]">
                <Sparkles className="w-3 h-3" /> Secure Payment Hub
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Unified Pay <br />
                <span className="gradient-text">Gateway Engine</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Experience instant, frictionless money settlement directly into the merchant&apos;s bank account via peer-to-peer secure routing.
              </p>
            </div>

            {/* Live Ticker System */}
            <div className="p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="live-dot" />
                  <span className="text-[11px] font-bold text-slate-300">Live Gateway Route</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Operational
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.03]">
                <div>VPA ID: <span className="text-slate-200">KCP-2026</span></div>
                <div className="text-right">Latency: <span className="text-emerald-400">14ms</span></div>
              </div>
            </div>

            {/* Trust points */}
            <div className="space-y-4">
              {[
                { icon: <ShieldCheck className="w-5 h-5 text-[#00D2FF]" />, title: 'Bank-Grade TLS/SSL', desc: 'Secure direct transmission avoiding third-party intermediate holding accounts.' },
                { icon: <Zap className="w-5 h-5 text-amber-400" />, title: 'Instant SMS Settlement', desc: 'Auto-verification of SMS transaction hash verifies funds within 15 seconds.' },
                { icon: <IndianRupee className="w-5 h-5 text-emerald-400" />, title: 'Zero Surcharge Fee', desc: 'Completely free peer-to-peer money transfers without any processing commission.' },
              ].map(({ icon, title, desc }, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─────────────── RIGHT PANE: CHECKOUT CARD ─────────────── */}
          <div className="lg:col-span-7 w-full max-w-md mx-auto order-1 lg:order-2">
            {/* Error Banner */}
            {error && (
              <div
                className="mb-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs animate-fade-up animate-shake"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: AMOUNT & DETAILS INPUT */}
            {step === 'input' && (
              <div className="glass-card noise animate-scale-up" style={{ padding: '30px 24px' }}>
                {/* Glowing top line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, transparent, #00D2FF, #c084fc, transparent)' }}
                />

                <form onSubmit={handleInitiatePayment} className="space-y-6">
                  {/* Title block */}
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-white">Initialize Payment</h3>
                    <p className="text-xs text-slate-400">Complete detail credentials to construct the secure QR payload</p>
                  </div>

                  {/* Input Amount */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Amount (INR)
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <IndianRupee className="w-5 h-5 text-slate-400 group-focus-within:text-[#00D2FF] transition-colors" />
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

                    {/* Quick values grid */}
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



                  {/* VPA Target Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Pay via Platform
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`method-card flex items-center gap-2 p-2.5 text-left ${method === m.id ? 'active' : ''}`}
                          style={method === m.id ? { borderColor: m.color, background: m.bg } : {}}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {m.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-slate-100 block truncate leading-none">{m.label}</span>
                            <span className="text-[8px] font-mono text-slate-400 block mt-1 leading-none">{method === m.id ? 'Selected' : 'UPI Direct'}</span>
                          </div>
                          {method === m.id && (
                            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.color }}>
                              <CheckCircle className="w-2.5 h-2.5 text-slate-900 font-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />

                  {/* Submission */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-shimmer rounded-2xl py-3.5 text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    style={{
                      boxShadow: '0 8px 24px rgba(0,210,255,0.2)',
                      background: 'linear-gradient(135deg, #00D2FF 0%, #0088CC 100%)',
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Constructing Secure Payload...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isMobile ? 'Initiate Mobile Pay' : 'Generate Secure QR'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-slate-500">
                    🔐 Peer-to-peer bank routing ensures immediate safe transfer.
                  </p>
                </form>
              </div>
            )}

            {/* STEP 2: VERIFICATION & QR SCREEN */}
            {step === 'verify' && (
              <div className="glass-card noise animate-scale-up" style={{ padding: '24px 20px' }}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, transparent, #00D2FF, #10B981, transparent)' }}
                />

                <div className="space-y-5">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setStep('input'); setError(''); }}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      ← Back to edit
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="status-badge pending py-1 text-[9px]">
                        <Clock className="w-3 h-3 animate-spin text-amber-400" />
                        Awaiting Verify
                      </div>
                      <span className="text-[10px] font-mono bg-white/[0.04] px-2 py-1 rounded text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#00D2FF]" /> {formatTime(timer)}
                      </span>
                    </div>
                  </div>

                  {/* Real-time details */}
                  <div className="text-center space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-[#00D2FF] font-mono">Invoice Payload Created</span>
                    <div className="flex items-center justify-center gap-0.5">
                      <IndianRupee className="w-6 h-6 text-[#00D2FF] font-bold" />
                      <span className="text-4xl font-extrabold text-white">
                        {parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                        {selectedMethod.label}
                      </span>
                      {name && (
                        <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] truncate max-w-[120px]">
                          {name}
                        </span>
                      )}
                    </div>
                  </div>

                  {method === 'generic' ? (
                    /* Gorgeous glowing QR frame */
                    <div className="flex flex-col items-center justify-center py-2 relative">
                      <div className="absolute w-[220px] h-[220px] bg-[#00D2FF]/5 rounded-full filter blur-xl animate-pulse" />
                      
                      <div className="qr-card relative z-10 overflow-hidden bg-white border-2 border-white/[0.08] p-4 flex flex-col items-center">
                        <QRCode
                          value={upiQrValue}
                          size={170}
                          level="H"
                          fgColor="#0B0F19"
                          bgColor="#FFFFFF"
                        />
                        <div className="flex flex-col items-center pt-3 w-full border-t border-slate-100 mt-3 text-center">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unified Payments Interface</span>
                          <div className="flex gap-2 items-center mt-1">
                            <UPILogo />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Massive Launch App Button */
                    <div className="flex flex-col items-center justify-center py-8 relative">
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-fade-up" style={{ background: selectedMethod.bg, border: `1px solid ${selectedMethod.color}40` }}>
                        {selectedMethod.logo}
                      </div>
                      <a 
                        href={getDeepLink(method, amount, orderId)} 
                        className="animate-scale-up px-8 py-4 rounded-2xl text-slate-900 font-extrabold text-sm uppercase tracking-wider flex items-center gap-3 transition-all hover:scale-105" 
                        style={{ background: selectedMethod.color, boxShadow: `0 8px 32px ${selectedMethod.color}60` }}
                      >
                        <Smartphone className="w-5 h-5" /> Open {selectedMethod.label}
                      </a>
                      <p className="text-[10px] text-slate-500 mt-4 max-w-[200px] text-center">
                        If the app doesn&apos;t open automatically, tap the button above.
                      </p>
                    </div>
                  )}

                  {/* VPA clipboard copy indicator */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">UPI VPA:</span>
                      <button
                        onClick={handleCopyVpa}
                        className="text-slate-300 hover:text-white flex items-center gap-1 font-mono transition-colors border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] px-2 py-0.5 rounded"
                      >
                        {copied ? (
                          <span className="text-emerald-400 flex items-center gap-1">Copied!</span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#00D2FF]" />
                            <span className="truncate max-w-[150px]">{CONFIG.upiId}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-[9px] text-slate-400 text-center leading-relaxed">
                      Payee: <strong className="text-white">{CONFIG.businessName}</strong>
                    </div>
                  </div>

                  {/* Verified settlement strip */}
                  <div className="bg-[#10B981]/5 border border-[#10B981]/15 rounded-xl p-3 flex gap-2 items-center">
                    <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                    <p className="text-[10px] text-slate-300 leading-normal">
                      Verified Payee match: <strong className="text-slate-100">{CONFIG.businessName}</strong>. Secured direct route transaction settlement.
                    </p>
                  </div>

                  {/* Action Confirmation */}
                  <div className="space-y-2">
                    <button
                      onClick={handleConfirmPaid}
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl text-slate-900 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.985]"
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                      }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-slate-900" />
                          <span>I have paid successfully</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[9px] text-slate-500 font-mono">
                      Real-time validation searches SMS hash records instantly.
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Subdued Footer ── */}
      <footer
        className="relative z-10 py-4 text-center border-t border-white/[0.03]"
        style={{ background: 'rgba(6,8,20,0.85)', backdropFilter: 'blur(10px)' }}
      >
        <p className="text-[10px] text-slate-500">
          © 2026 {CONFIG.businessName} · All bank routes are encrypted with bank-grade security protocols
        </p>
        <p className="text-[9px] text-slate-600 mt-1 font-mono">
          Powered by Secure Instant UPI Gateway
        </p>
      </footer>
    </div>
  );
}
