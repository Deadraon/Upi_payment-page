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
} from 'lucide-react';

/* ── Paytm / GPay / PhonePe / BHIM SVG logos ─────────────── */
const PaytmLogo = ({ size = 28 }) => (
  <svg width={size} height={size * 0.55} viewBox="0 0 80 44" xmlns="http://www.w3.org/2000/svg">
    <text x="2" y="32" fontFamily="Arial" fontWeight="900" fontSize="32" fill="#002970">pay</text>
    <text x="50" y="32" fontFamily="Arial" fontWeight="900" fontSize="32" fill="#00BAF2">tm</text>
  </svg>
);

const GPayLogo = () => (
  <svg viewBox="0 0 80 34" className="w-12 h-5" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5F6368" d="M37.8,19.7V29h-3V6h7.8c1.9,0,3.7.7,5.1,2 1.4,1.2,2.1,3,2.1,4.9c0,1.9-.7,3.6-2.1,4.9-1.4,1.3-3.1,2-5.1,2L37.8,19.7zm0-11v8h5c1.1,0,2.2-.4,2.9-1.2 1.6-1.5,1.6-4,.1-5.5-.8-.8-1.8-1.3-2.9-1.2L37.8,8.8z"/>
    <path fill="#5F6368" d="M56.7,12.8c2.2,0,3.9.6,5.2,1.8s1.9,2.8,1.9,4.8V29H61v-2.2h-.1c-1.2,1.8-2.9,2.7-4.9,2.7-1.7,0-3.2-.5-4.4-1.5-1.1-1-1.8-2.4-1.8-3.9 0-1.6.6-2.9,1.8-3.9 1.2-1,2.9-1.4,4.9-1.4 1.8,0,3.2.3,4.3,1v-.7c0-1-.4-2-1.2-2.6-.8-.7-1.8-1.1-2.9-1.1-1.7,0-3,.7-3.9,2.1L50.2,16C51.8,13.8,53.9,12.8,56.7,12.8zm-3.8,11.4c0,.8.4,1.5,1,1.9.7.5,1.5.8,2.3.8 1.2,0,2.4-.5,3.3-1.4 1-.9,1.5-2,1.5-3.2-.9-.7-2.2-1.1-3.9-1.1-1.2,0-2.2.3-3,.9-.8.6-1.2,1.3-1.2,2.1z"/>
    <path fill="#5F6368" d="M80,13.3l-9.9,22.7h-3l3.7-7.9-6.5-14.7h3.2l4.7,11.3h.1l4.6-11.3H80z"/>
    <path fill="#4285F4" d="M25.9,17.7c0-.9-.1-1.8-.2-2.7H13.2v5.1h7.1c-.3,1.6-1.2,3.1-2.6,4v3.3H22C24.5,25.1,25.9,21.7,25.9,17.7z"/>
    <path fill="#34A853" d="M13.2,30.6c3.6,0,6.6-1.2,8.8-3.2l-4.3-3.3c-1.2.8-2.7,1.3-4.5,1.3-3.4,0-6.4-2.3-7.4-5.5H1.4v3.4C3.7,27.8,8.2,30.6,13.2,30.6z"/>
    <path fill="#FBBC04" d="M5.8,19.9c-.6-1.6-.6-3.4,0-5.1v-3.4H1.4c-1.9,3.7-1.9,8.1,0,11.9L5.8,19.9z"/>
    <path fill="#EA4335" d="M13.2,9.4c1.9,0,3.7.7,5.1,2l3.8-3.8C19.7,5.4,16.5,4.1,13.2,4.2c-5,0-9.6,2.8-11.8,7.3l4.4,3.4C6.8,11.7,9.8,9.4,13.2,9.4z"/>
  </svg>
);

const PhonePeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5F259F" d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
  </svg>
);

const UPILogo = () => (
  <svg viewBox="0 0 60 24" className="w-10 h-4" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="18" fontFamily="Arial" fontWeight="800" fontSize="16" fill="#097969">UPI</text>
    <path d="M44 2 L52 12 L44 22" stroke="#FF6600" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M50 2 L58 12 L50 22" stroke="#097969" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

/* ── Animated background orbs ────────────────────────────── */
const Background = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Main glow */}
    <div
      className="absolute w-[700px] h-[700px] rounded-full blur-[130px] opacity-[0.07]"
      style={{
        background: 'radial-gradient(circle, #00BAF2, #002970)',
        top: '-20%', left: '-15%',
      }}
    />
    <div
      className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.05]"
      style={{
        background: 'radial-gradient(circle, #a78bfa, #00BAF2)',
        bottom: '-15%', right: '-10%',
      }}
    />
    {/* Grid */}
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,186,242,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,186,242,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
    {/* Radial mask over grid */}
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, #080C14 90%)',
      }}
    />
    {/* Floating particles */}
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${4 + i * 2}px`,
          height: `${4 + i * 2}px`,
          background: i % 2 === 0 ? 'rgba(0,186,242,0.4)' : 'rgba(167,139,250,0.4)',
          top: `${15 + i * 14}%`,
          left: `${8 + i * 15}%`,
          animation: `float ${3 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`,
          filter: 'blur(1px)',
        }}
      />
    ))}
  </div>
);

/* ── Payment method config ───────────────────────────────── */
const METHODS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    color: '#4285F4',
    bg: 'rgba(66,133,244,0.08)',
    logo: <GPayLogo />,
    scheme: (p) => `tez://pay?${p}`,
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    color: '#5F259F',
    bg: 'rgba(95,37,159,0.08)',
    logo: <PhonePeLogo />,
    scheme: (p) => `phonepe://pay?${p}`,
  },
  {
    id: 'paytm',
    label: 'Paytm',
    color: '#00BAF2',
    bg: 'rgba(0,186,242,0.08)',
    logo: (
      <div className="bg-white rounded-lg p-1 flex items-center justify-center" style={{ width: 32, height: 32 }}>
        <PaytmLogo size={22} />
      </div>
    ),
    scheme: (p) => `paytmmp://pay?${p}`,
  },
  {
    id: 'generic',
    label: 'Any UPI',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
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
  const amountRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua));
  }, []);

  const selectedMethod = METHODS.find((m) => m.id === method) || METHODS[3];

  const buildParams = (amt, txnId) =>
    `pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.businessName)}&am=${amt}&tn=${txnId}&cu=INR`;

  const getDeepLink = (methodId, amt, txnId) => {
    const m = METHODS.find((x) => x.id === methodId) || METHODS[3];
    return m.scheme(buildParams(amt, txnId));
  };

  const upiQrValue = orderId
    ? `upi://pay?${buildParams(amount, orderId)}`
    : '';

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
    <div className="min-h-screen flex flex-col" style={{ background: '#080C14' }}>
      <Background />

      {/* ── Top progress bar on verify step ── */}
      {step === 'verify' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
          <div className="progress-bar h-full" />
        </div>
      )}

      {/* ── Header ── */}
      <header className="relative z-10 max-w-5xl mx-auto w-full px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-fade-up">
          {/* Logo mark */}
          <div
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #00BAF2 0%, #0077C8 100%)',
              boxShadow: '0 4px 20px rgba(0,186,242,0.4)',
            }}
          >
            <Zap className="w-5 h-5 text-white" />
            <div className="absolute inset-0 bg-white opacity-10 rounded-2xl" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 60%)' }} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
              {CONFIG.businessName}
            </h1>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(139,152,184,0.7)', letterSpacing: '0.1em' }}>
              SECURE UPI GATEWAY
            </p>
          </div>
        </div>

        {/* Trust badge */}
        <div
          className="animate-fade-up delay-100 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            color: '#34d399',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-bit Secured</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Error Banner */}
          {error && (
            <div
              className="mb-5 p-4 rounded-2xl flex items-start gap-3 text-sm animate-fade-up animate-shake"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────── STEP: INPUT ─────────────── */}
          {step === 'input' && (
            <div className="glass-card noise animate-fade-up" style={{ padding: '32px 28px' }}>
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[28px]"
                style={{ background: 'linear-gradient(90deg, transparent, #00BAF2, #a78bfa, transparent)' }}
              />

              <form onSubmit={handleInitiatePayment} className="space-y-7">

                {/* Heading */}
                <div className="text-center space-y-1 animate-fade-up">
                  <h2 className="text-xl font-bold text-white tracking-tight">Complete Payment</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Fast · Secure · Instant UPI Transfer
                  </p>
                </div>

                {/* Amount */}
                <div className="space-y-3 animate-fade-up delay-100">
                  <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Amount (₹)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <IndianRupee className="w-5 h-5 transition-colors" style={{ color: 'var(--text-muted)' }} />
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
                      style={{ letterSpacing: '-0.02em' }}
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {CONFIG.quickAmounts.map((amt, i) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => { setAmount(amt.toString()); setError(''); }}
                        className={`amount-pill py-2.5 px-1 transition-all ${amount === amt.toString() ? 'active' : ''}`}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        ₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Fields */}
                <div className="space-y-3 animate-fade-up delay-200">
                  <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Your Details <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>(optional)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <User className="w-4 h-4" />, placeholder: 'Full name', type: 'text', val: name, set: setName },
                      { icon: <Mail className="w-4 h-4" />, placeholder: 'Email address', type: 'email', val: email, set: setEmail },
                      { icon: <Phone className="w-4 h-4" />, placeholder: 'Phone number', type: 'tel', val: phone, set: setPhone },
                      { icon: <MessageSquare className="w-4 h-4" />, placeholder: 'Payment note', type: 'text', val: note, set: setNote },
                    ].map(({ icon, placeholder, type, val, set }, i) => (
                      <div key={i} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                          {icon}
                        </div>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="pay-input py-3 pl-9 pr-3 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* UPI Method Selection */}
                <div className="space-y-3 animate-fade-up delay-300">
                  <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Pay Via
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={`method-card flex items-center gap-2.5 p-3 text-left ${method === m.id ? 'active' : ''}`}
                        style={method === m.id ? { borderColor: m.color, background: m.bg } : {}}
                      >
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                          {m.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">{m.label}</span>
                          {method === m.id && (
                            <span className="text-[9px] font-semibold" style={{ color: m.color }}>Selected</span>
                          )}
                        </div>
                        {method === m.id && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.color }}>
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="divider animate-fade-up delay-400" />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-shimmer rounded-2xl py-4 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 animate-fade-up delay-500"
                  style={{
                    boxShadow: '0 8px 32px rgba(0,186,242,0.3)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{isMobile ? 'Pay Securely Now' : 'Generate Secure QR'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Footer trust */}
                <p className="text-center text-[10px] animate-fade-up delay-600" style={{ color: 'var(--text-muted)' }}>
                  🔒 Your payment is protected by bank-grade 256-bit TLS encryption
                </p>
              </form>
            </div>
          )}

          {/* ─────────────── STEP: VERIFY / QR ─────────────── */}
          {step === 'verify' && (
            <div className="glass-card noise animate-scale-up" style={{ padding: '28px 24px' }}>
              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[28px]"
                style={{ background: 'linear-gradient(90deg, transparent, #00BAF2, #a78bfa, transparent)' }}
              />

              <div className="space-y-6">
                {/* Nav row */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setStep('input'); setError(''); }}
                    className="text-xs flex items-center gap-1.5 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    ← Edit details
                  </button>
                  <div className="status-badge pending animate-fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                    Awaiting Scan
                  </div>
                </div>

                {/* Amount display */}
                <div className="text-center animate-fade-up">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    Amount to Pay
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="w-8 h-8 font-bold" style={{ color: '#00BAF2' }} />
                    <span className="text-5xl font-black text-white" style={{ letterSpacing: '-0.04em' }}>
                      {parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="status-badge" style={{ background: 'rgba(0,186,242,0.1)', color: '#00BAF2', border: '1px solid rgba(0,186,242,0.25)', fontSize: '10px', padding: '3px 10px' }}>
                      {selectedMethod.label}
                    </span>
                    {name && (
                      <span className="status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontSize: '10px', padding: '3px 10px' }}>
                        {name}
                      </span>
                    )}
                  </div>
                </div>

                {/* QR Card */}
                <div className="flex justify-center animate-scale-up delay-200">
                  <div className="qr-card overflow-hidden" style={{ padding: 0 }}>
                    {/* Paytm header */}
                    <div className="flex flex-col items-center gap-1 pt-4 pb-3 px-6 bg-white">
                      <PaytmLogo size={52} />
                      <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#6B7280' }}>
                        Accepted Here
                      </span>
                    </div>
                    {/* QR */}
                    <div className="bg-white px-5 py-3">
                      <QRCode
                        value={upiQrValue}
                        size={188}
                        level="H"
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                        style={{ display: 'block' }}
                      />
                    </div>
                    {/* Footer */}
                    <div className="bg-white px-5 pt-3 pb-4 flex flex-col items-center gap-2.5 border-t border-gray-100">
                      <p className="text-[11px] text-gray-500 font-medium">
                        UPI ID: <span className="font-bold text-gray-800 font-mono">{CONFIG.upiId}</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <UPILogo />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="animate-fade-up delay-300">
                  {isMobile ? (
                    <div
                      className="rounded-2xl p-4 text-center space-y-3"
                      style={{ background: 'rgba(0,186,242,0.06)', border: '1px solid rgba(0,186,242,0.15)' }}
                    >
                      <p className="text-sm font-semibold text-white">UPI App opened automatically</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Didn't open? Tap below to retry.
                      </p>
                      <a
                        href={getDeepLink(method, amount, orderId)}
                        className="inline-flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl text-white transition-all"
                        style={{ background: selectedMethod.color, boxShadow: `0 4px 16px ${selectedMethod.color}40` }}
                      >
                        <Smartphone className="w-4 h-4" />
                        Open {selectedMethod.label}
                      </a>
                    </div>
                  ) : (
                    <div
                      className="rounded-2xl p-4 space-y-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
                    >
                      <p className="text-sm font-semibold text-white text-center">Scan with any UPI app</p>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay', 'Any UPI'].map((app) => (
                          <div key={app} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: '#00BAF2' }} />
                            {app}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Verify strip */}
                <div
                  className="rounded-xl p-3 flex items-center gap-2.5 animate-fade-up delay-400"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Verify payee: <strong className="text-white">{CONFIG.businessName}</strong>
                    <span className="mx-1 opacity-40">·</span>
                    <span className="font-mono text-[10px]" style={{ color: '#00BAF2' }}>{CONFIG.upiId}</span>
                  </div>
                </div>

                {/* Confirm button */}
                <div className="space-y-2 animate-fade-up delay-500">
                  <button
                    onClick={handleConfirmPaid}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(16,185,129,0.45)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(16,185,129,0.3)'}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>I've Paid Successfully</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Payment auto-verified via SMS within 10–30 seconds
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 py-5 text-center"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(8,12,20,0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          © 2026 {CONFIG.businessName} · All rights reserved
        </p>
        <p className="text-[9px] mt-1" style={{ color: 'rgba(74,84,115,0.6)' }}>
          Powered by Secure UPI Gateway · PCI-DSS Compliant
        </p>
      </footer>
    </div>
  );
}
