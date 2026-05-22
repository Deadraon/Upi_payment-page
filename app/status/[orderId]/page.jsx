'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import {
  CheckCircle,
  XCircle,
  Loader2,
  IndianRupee,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Key,
  CreditCard,
  User,
  ShieldCheck,
  RefreshCw,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';

/* ── Animated background (same as pay page) ─────────────── */
const Background = ({ status }) => {
  const color =
    status === 'verified' ? '#10B981' :
    status === 'rejected' ? '#EF4444' :
    '#00D2FF';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[130px] opacity-[0.06]"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          top: '-20%', left: '-15%',
          transition: 'background 1s ease',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)',
          bottom: '-15%', right: '-10%',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,210,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, #060814 90%)' }}
      />
    </div>
  );
};

/* ── Success checkmark SVG animation ────────────────────── */
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.3" />
    <circle
      cx="26" cy="26" r="25"
      fill="none" stroke="#10B981" strokeWidth="2.5"
      strokeDasharray="157" strokeDashoffset="157"
      style={{ animation: 'dash 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
      strokeLinecap="round"
    />
    <path
      d="M14 27 L22 35 L38 18"
      fill="none" stroke="#10B981" strokeWidth="3"
      strokeDasharray="33" strokeDashoffset="33"
      style={{ animation: 'dash 0.4s 0.5s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
      strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

/* ── Receipt Row ─────────────────────────────────────────── */
const Row = ({ icon, label, value, mono = false, accent = false }) => (
  <div className="receipt-row animate-fade-up">
    <span className="receipt-label text-xs">
      {icon}
      {label}
    </span>
    <span
      className={`receipt-value text-xs ${mono ? 'font-mono text-[11px]' : ''}`}
      style={accent ? { color: '#00D2FF' } : {}}
    >
      {value}
    </span>
  </div>
);

export default function StatusPage() {
  const params = useParams();
  const orderId = params.orderId;

  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [tick, setTick]     = useState(10);
  const [mounted, setMounted] = useState(false);

  // UTR submission states
  const [utrInput, setUtrInput] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState('');
  const [utrError, setUtrError] = useState('');
  const [showUtr, setShowUtr] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Delay showing UTR manual input for 60 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowUtr(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  // Poll for status updates (in case admin approves or webhook fires)
  useEffect(() => {
    if (!orderId) return;
    const fetchStatus = async () => {
      try {
        const { data, error: dbErr } = await supabase
          .from('orders').select('*').eq('id', orderId).single();
        if (dbErr) throw dbErr;
        setOrder(data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Could not locate this transaction.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  /* Countdown tick for pending updates */
  useEffect(() => {
    if (order?.status !== 'pending') return;
    setTick(10);
    const t = setInterval(() => setTick((p) => (p <= 1 ? 10 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [order?.status]);

  const handleUtrSubmit = async (e) => {
    e.preventDefault();
    setUtrError('');
    setUtrSuccess('');

    const cleanUtr = utrInput.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      setUtrError('Please enter a valid 12-digit numeric UTR/Ref number.');
      return;
    }

    setSubmittingUtr(true);
    try {
      const res = await fetch('/api/payments/utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, utr: cleanUtr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit UTR.');

      // Successfully updated order record locally
      setOrder(data.order);
      setUtrSuccess('Transaction UTR / Ref ID submitted successfully!');
    } catch (err) {
      setUtrError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#060814' }}>
        <Background status="pending" />
        <div className="relative z-10 flex flex-col items-center gap-5 animate-fade-in">
          <div
            className="w-16 h-16 rounded-full border-2 flex items-center justify-center animate-pulse-ring"
            style={{ borderColor: 'rgba(0,210,255,0.3)' }}
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00D2FF' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Retrieving Order Status...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#060814' }}>
        <Background status="rejected" />
        <div
          className="glass-card noise relative z-10 w-full max-w-sm p-8 text-center space-y-5 animate-scale-up"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Invoice Not Located</h2>
            <p className="text-xs mt-2 text-slate-400">
              We couldn&apos;t identify any transaction matching this record ID in the gateway.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/pay')}
            className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-white/[0.04]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Gateway
          </button>
        </div>
      </div>
    );
  }

  const fmt = (dt) => dt
    ? new Date(dt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  // Check if UTR is submitted and is a valid 12-digit number
  const isUtrSubmitted = order.utr && /^\d{12}$/.test(order.utr.trim());

  /* ── VERIFIED STATE ── */
  if (order.status === 'verified') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060814' }}>
        <Background status="verified" />

        <header className="relative z-10 max-w-5xl mx-auto w-full px-6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-up">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00D2FF, #0077C8)', boxShadow: '0 4px 16px rgba(0,210,255,0.35)' }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm text-white tracking-tight">{CONFIG.businessName}</span>
          </div>
          <div className="status-badge verified animate-fade-up delay-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Settled Successfully
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="glass-card noise animate-scale-up" style={{ padding: '30px 24px', borderColor: 'rgba(16,185,129,0.2)' }}>
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent, #10B981, #34d399, transparent)' }}
              />

              {/* Success mark */}
              <div className="text-center space-y-4 animate-fade-up">
                <div className="flex justify-center">
                  <div className="animate-pulse-success rounded-full">
                    <AnimatedCheck />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Payment Confirmed!</h2>
                  <p className="text-xs mt-1 text-[#34d399] font-bold">
                    ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} settled into bank
                  </p>
                </div>
              </div>

              {/* Receipt info */}
              <div
                className="mt-6 rounded-2xl p-4 animate-fade-up delay-200"
                style={{ background: 'rgba(8,14,28,0.5)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="text-center pb-4 mb-2 border-b border-white/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Receipt Settled</p>
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="w-5 h-5 text-emerald-400" />
                    <span className="text-3xl font-extrabold text-white">
                      {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Row icon={<User className="w-3.5 h-3.5 text-slate-400" />} label="Customer Name" value={order.customer_name || 'Generic Sender'} />
                  {order.customer_phone && (
                    <Row icon={<span className="w-3.5 h-3.5" />} label="Phone Reference" value={order.customer_phone} mono />
                  )}
                  <Row icon={<CreditCard className="w-3.5 h-3.5 text-slate-400" />} label="Method Selected" value={order.method} />
                  <Row icon={<Key className="w-3.5 h-3.5 text-slate-400" />} label="Transaction UTR / Ref" value={order.utr || 'SMS Confirmed'} mono accent />
                  <Row icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />} label="Settled Date" value={fmt(order.verified_at)} />
                </div>

                <div
                  className="mt-4 rounded-xl p-3 flex justify-between items-center text-[10px] bg-white/[0.01] border border-white/[0.03]"
                >
                  <span className="text-slate-500 font-bold">Transaction Reference ID</span>
                  <span className="font-mono text-slate-400">
                    {orderId?.slice(0, 18)}…
                  </span>
                </div>
              </div>

              {/* Back CTA */}
              <button
                onClick={() => (window.location.href = '/pay')}
                className="w-full mt-6 py-3.5 rounded-2xl text-slate-900 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-fade-up delay-300"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                }}
              >
                <Zap className="w-4 h-4 text-slate-900" />
                Done · Transfer Again
              </button>
            </div>
          </div>
        </main>

        <footer className="relative z-10 py-4 text-center border-t border-white/[0.03]" style={{ background: 'rgba(6,8,20,0.85)' }}>
          <p className="text-[10px] text-slate-500">© 2026 {CONFIG.businessName} · Secure Direct Transfer System</p>
        </footer>
      </div>
    );
  }

  /* ── REJECTED STATE ── */
  if (order.status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060814' }}>
        <Background status="rejected" />

        <header className="relative z-10 max-w-5xl mx-auto w-full px-6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D2FF, #0077C8)', boxShadow: '0 4px 16px rgba(0,210,255,0.35)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm text-white tracking-tight">{CONFIG.businessName}</span>
          </div>
          <div className="status-badge rejected animate-fade-up delay-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
            Verification Declined
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="glass-card noise animate-scale-up" style={{ padding: '30px 24px', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #EF4444, #f87171, transparent)' }} />

              <div className="text-center space-y-4 animate-fade-up">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Payment Declined</h2>
                  <p className="text-xs mt-1 text-[#f87171] font-bold">
                    Auditing logs could not confirm this transaction
                  </p>
                </div>
              </div>

              <div
                className="mt-6 rounded-2xl p-4 animate-fade-up delay-200 text-center space-y-4 bg-white/[0.01] border border-white/[0.04]"
              >
                <p className="text-xs leading-relaxed text-slate-400">
                  The payment details were rejected or could not be found on our bank accounts. If you have been debited, please contact our helpline with your invoice reference code.
                </p>
                <div className="divider" />
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold">Transaction Reference ID</span>
                  <span className="font-mono text-slate-400">{orderId?.slice(0, 18)}…</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold">Invoice Amount</span>
                  <span className="font-extrabold text-white">₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => (window.location.href = '/pay')}
                className="w-full mt-6 py-3.5 rounded-2xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-fade-up delay-300"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  boxShadow: '0 8px 24px rgba(239,68,68,0.25)',
                }}
              >
                <RefreshCw className="w-4 h-4 text-white" />
                Retry Invoice Transfer
              </button>
            </div>
          </div>
        </main>

        <footer className="relative z-10 py-4 text-center border-t border-white/[0.03]" style={{ background: 'rgba(6,8,20,0.85)' }}>
          <p className="text-[10px] text-slate-500">© 2026 {CONFIG.businessName} · Secure Direct Transfer System</p>
        </footer>
      </div>
    );
  }

  /* ── PENDING REVIEW STATE ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060814' }}>
      <Background status="pending" />

      {/* Low-profile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
        <div className="progress-bar h-full" />
      </div>

      <header className="relative z-10 max-w-5xl mx-auto w-full px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-fade-up">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D2FF, #0077C8)', boxShadow: '0 4px 16px rgba(0,210,255,0.35)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight">{CONFIG.businessName}</span>
        </div>
        <div className="status-badge pending animate-fade-up delay-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          Under Review
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="glass-card noise animate-scale-up" style={{ padding: '26px 20px' }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #00D2FF, #a78bfa, transparent)' }} />

            {/* Static Review Icon Header */}
            <div className="text-center space-y-3 animate-fade-up">
              <div className="relative inline-flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full border border-dashed flex items-center justify-center"
                  style={{ borderColor: 'rgba(0,210,255,0.25)', background: 'rgba(0,210,255,0.02)' }}
                >
                  <ShieldCheck className="w-7 h-7 text-[#00D2FF] animate-pulse" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">Verification in Progress</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Your transfer invoice was created successfully. You can <strong className="text-[#00D2FF]">safely close</strong> this window now.
                </p>
              </div>
            </div>

            {/* Invoice metadata */}
            <div
              className="mt-5 rounded-2xl p-4 animate-fade-up delay-150"
              style={{ background: 'rgba(8,14,28,0.5)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="text-center pb-3 border-b border-white/[0.04] mb-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Amount to Audit</p>
                <div className="flex items-center justify-center gap-0.5">
                  <IndianRupee className="w-4 h-4 text-[#00D2FF]" />
                  <span className="text-2xl font-extrabold text-white">
                    {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5 text-[11px] text-slate-400">
                <div className="flex justify-between items-center py-1">
                  <span>Method Selected</span>
                  <span className="text-white font-semibold">{order.method || 'UPI App'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Order Reference</span>
                  <span className="font-mono text-white">{orderId?.slice(0, 16)}</span>
                </div>
              </div>
            </div>

            {/* UTR Form or UTR Status Indicator */}
            <div className="mt-5 pt-4 border-t border-white/[0.04] animate-fade-up delay-200">
              {isUtrSubmitted ? (
                /* UTR already submitted state */
                <div className="bg-[#10B981]/5 border border-[#10B981]/15 rounded-2xl p-4 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Transaction UTR Submitted</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Reference ID: <strong className="text-white font-mono">{order.utr}</strong>
                  </p>
                  <p className="text-[9px] text-[#10B981] leading-normal font-medium pt-1">
                    Please allow 5–15 minutes for our staff to verify the funds and approve your account logs.
                  </p>
                </div>
              ) : showUtr ? (
                /* Input form for UTR */
                <form onSubmit={handleUtrSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                      Speed Up Verification
                    </label>
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      To facilitate instant verification, please submit your bank&apos;s 12-digit transaction UTR / Ref Number from your transaction success logs.
                    </p>
                  </div>

                  {utrError && (
                    <div className="p-2.5 rounded-xl border border-red-500/25 bg-red-500/5 text-[10px] text-red-300 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{utrError}</span>
                    </div>
                  )}

                  {utrSuccess && (
                    <div className="p-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-[10px] text-emerald-300 flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{utrSuccess}</span>
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00D2FF]" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="Enter 12-Digit Transaction UTR"
                      value={utrInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ''); // Numeric only
                        setUtrInput(val);
                        setUtrError('');
                      }}
                      className="pay-input py-2.5 pl-9 pr-3 text-xs tracking-wider font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingUtr || utrInput.length !== 12}
                    className="w-full py-2.5 rounded-xl text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg, #00D2FF 0%, #0088CC 100%)',
                      boxShadow: utrInput.length === 12 ? '0 4px 14px rgba(0,210,255,0.2)' : 'none',
                    }}
                  >
                    {submittingUtr ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Ref...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit reference UTR</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-2 py-3">
                  <div className="flex items-center justify-center gap-2 text-[#00D2FF] mb-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Bank Signal</span>
                  </div>
                  <p className="text-[9px] text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                    Our automated system is securely scanning for your bank transfer confirmation. Please keep this page open.
                  </p>
                </div>
              )}
            </div>

            {/* Quick WhatsApp Link Helper */}
            <div className="mt-5 pt-3 border-t border-white/[0.04] text-center">
              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} /> checking status: {tick}s</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center border-t border-white/[0.03]" style={{ background: 'rgba(6,8,20,0.85)' }}>
        <p className="text-[10px] text-slate-500">
          © 2026 {CONFIG.businessName} · Secure UPI Payments Gateway
        </p>
      </footer>
    </div>
  );
}
