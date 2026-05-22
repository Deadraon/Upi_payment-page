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
  Calendar,
  Key,
  CreditCard,
  User,
  ShieldCheck,
  RefreshCw,
  Clock,
  Zap,
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
    <span className="receipt-label">
      {icon}
      {label}
    </span>
    <span
      className={`receipt-value ${mono ? 'font-mono text-[11px]' : ''}`}
      style={accent ? { color: '#10B981' } : {}}
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

  useEffect(() => { setMounted(true); }, []);

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

  /* Countdown tick for pending */
  useEffect(() => {
    if (order?.status !== 'pending') return;
    setTick(10);
    const t = setInterval(() => setTick((p) => (p <= 1 ? 10 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [order?.status]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#060814' }}>
        <Background status="pending" />
        <div className="relative z-10 flex flex-col items-center gap-5 animate-fade-in">
          <div
            className="w-16 h-16 rounded-full border-2 flex items-center justify-center animate-pulse-ring"
            style={{ borderColor: 'rgba(0,186,242,0.3)' }}
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00BAF2' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Fetching payment status…
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
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Order Not Found</h2>
            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              We couldn&apos;t find a transaction matching this ID in our system.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/pay')}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment
          </button>
        </div>
      </div>
    );
  }

  const fmt = (dt) => dt
    ? new Date(dt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  /* ── VERIFIED ── */
  if (order.status === 'verified') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060814' }}>
        <Background status="verified" />

        <header className="relative z-10 max-w-5xl mx-auto w-full px-5 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-up">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00D2FF, #0077C8)', boxShadow: '0 4px 20px rgba(0,210,255,0.4)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">{CONFIG.businessName}</span>
          </div>
          <div className="status-badge verified animate-fade-up delay-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Payment Verified
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="glass-card noise animate-scale-up" style={{ padding: '32px 28px', borderColor: 'rgba(16,185,129,0.2)' }}>
              {/* Green top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[28px]"
                style={{ background: 'linear-gradient(90deg, transparent, #10B981, #34d399, transparent)' }}
              />

              {/* Success icon */}
              <div className="text-center space-y-4 animate-fade-up">
                <div className="flex justify-center animate-scale-up">
                  <div className="animate-pulse-success rounded-full">
                    <AnimatedCheck />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Payment Confirmed!</h2>
                  <p className="text-xs mt-1 font-medium" style={{ color: '#34d399' }}>
                    ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} received via UPI
                  </p>
                </div>
              </div>

              {/* Receipt */}
              <div
                className="mt-6 rounded-2xl p-5 animate-fade-up delay-200"
                style={{ background: 'rgba(8,14,28,0.6)', border: '1px solid var(--border-subtle)' }}
              >
                {/* Amount */}
                <div className="text-center pb-4 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Total Paid</p>
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="w-6 h-6 text-emerald-400" />
                    <span className="text-3xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
                      {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-0 pt-2">
                  <Row icon={<User className="w-3.5 h-3.5" />} label="Customer" value={order.customer_name || 'Anonymous'} />
                  {order.customer_phone && (
                    <Row icon={<span className="w-3.5 h-3.5" />} label="Phone" value={order.customer_phone} mono />
                  )}
                  <Row icon={<CreditCard className="w-3.5 h-3.5" />} label="Method" value={order.method} />
                  <Row icon={<Key className="w-3.5 h-3.5" />} label="UTR / Ref" value={order.utr || 'SMS Verified'} mono accent />
                  <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Paid at" value={fmt(order.verified_at)} />
                </div>

                {/* Transaction ID */}
                <div
                  className="mt-4 rounded-xl p-3 flex justify-between items-center text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {orderId?.slice(0, 18)}…
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => (window.location.href = '/pay')}
                className="w-full mt-6 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-fade-up delay-400"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(16,185,129,0.45)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(16,185,129,0.3)'}
              >
                <Zap className="w-4 h-4" />
                Done · Make Another Payment
              </button>
            </div>
          </div>
        </main>

        <footer className="relative z-10 py-5 text-center" style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(8,12,20,0.8)' }}>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>© 2026 {CONFIG.businessName} · Secure UPI Gateway</p>
        </footer>
      </div>
    );
  }

  /* ── REJECTED ── */
  if (order.status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060814' }}>
        <Background status="rejected" />

        <header className="relative z-10 max-w-5xl mx-auto w-full px-5 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D2FF, #0077C8)', boxShadow: '0 4px 20px rgba(0,210,255,0.4)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">{CONFIG.businessName}</span>
          </div>
          <div className="status-badge rejected animate-fade-up delay-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
            Rejected
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="glass-card noise animate-scale-up" style={{ padding: '32px 28px', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[28px]" style={{ background: 'linear-gradient(90deg, transparent, #EF4444, #f87171, transparent)' }} />

              <div className="text-center space-y-4 animate-fade-up">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <XCircle className="w-9 h-9 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Payment Rejected</h2>
                  <p className="text-xs mt-1" style={{ color: '#f87171' }}>
                    We could not validate this payment
                  </p>
                </div>
              </div>

              <div
                className="mt-6 rounded-2xl p-5 animate-fade-up delay-200 text-center space-y-4"
                style={{ background: 'rgba(8,14,28,0.6)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  The payment was not received or failed manual verification. If money was debited from your account, please contact support with the details below.
                </p>
                <div className="divider" />
                <div className="flex justify-between items-center text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{orderId?.slice(0, 18)}…</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                  <span className="font-semibold text-white">₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => (window.location.href = '/pay')}
                className="w-full mt-6 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-fade-up delay-300"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  boxShadow: '0 8px 32px rgba(239,68,68,0.3)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(239,68,68,0.45)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(239,68,68,0.3)'}
              >
                <RefreshCw className="w-4 h-4" />
                Retry Payment
              </button>
            </div>
          </div>
        </main>

        <footer className="relative z-10 py-5 text-center" style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(8,12,20,0.8)' }}>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>© 2026 {CONFIG.businessName} · Secure UPI Gateway</p>
        </footer>
      </div>
    );
  }

  /* ── PENDING ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060814' }}>
      <Background status="pending" />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
        <div className="progress-bar h-full" />
      </div>

      <header className="relative z-10 max-w-5xl mx-auto w-full px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-fade-up">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D2FF, #0077C8)', boxShadow: '0 4px 20px rgba(0,210,255,0.4)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight">{CONFIG.businessName}</span>
        </div>
        <div className="status-badge pending animate-fade-up delay-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          Verifying
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass-card noise animate-scale-up" style={{ padding: '32px 28px' }}>
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[28px]" style={{ background: 'linear-gradient(90deg, transparent, #00BAF2, #a78bfa, transparent)' }} />

            {/* Spinner */}
            <div className="text-center space-y-4 animate-fade-up">
              <div className="relative inline-flex items-center justify-center">
                {/* Outer ring */}
                <div
                  className="absolute w-20 h-20 rounded-full"
                  style={{ border: '1px solid rgba(0,186,242,0.15)' }}
                />
                {/* Spinning ring */}
                <svg className="w-20 h-20 -rotate-90 animate-spin" style={{ animationDuration: '2s' }}>
                  <circle
                    cx="40" cy="40" r="36"
                    fill="none" stroke="url(#spinGrad)" strokeWidth="2.5"
                    strokeDasharray="226" strokeDashoffset="170"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00BAF2" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Inner icon */}
                <div className="absolute">
                  <ShieldCheck className="w-7 h-7" style={{ color: '#00BAF2' }} />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Verifying Payment</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Please do <strong className="text-white">NOT</strong> close this window
                </p>
              </div>
            </div>

            {/* Amount card */}
            <div
              className="mt-6 rounded-2xl p-5 animate-fade-up delay-200"
              style={{ background: 'rgba(8,14,28,0.6)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="text-center pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Amount Pending</p>
                <div className="flex items-center justify-center gap-1">
                  <IndianRupee className="w-6 h-6" style={{ color: '#00BAF2' }} />
                  <span className="text-3xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
                    {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 space-y-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                <p className="text-center leading-relaxed">
                  Waiting for SMS notification from your bank to auto-confirm this transaction.
                  This usually takes <strong className="text-white">10–30 seconds</strong>.
                </p>

                {/* Polling indicator */}
                <div
                  className="flex items-center justify-between rounded-xl py-2.5 px-4"
                  style={{ background: 'rgba(0,186,242,0.06)', border: '1px solid rgba(0,186,242,0.15)' }}
                >
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: '#00BAF2' }}>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Polling gateway</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">Next check in <strong className="text-white">{tick}s</strong></span>
                  </div>
                </div>

                {/* Steps */}
                {[
                  { done: true,  label: 'Payment initiated' },
                  { done: true,  label: 'Order created in gateway' },
                  { done: false, label: 'Awaiting SMS confirmation', active: true },
                  { done: false, label: 'Marking as verified' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: s.done ? 'rgba(16,185,129,0.15)' : s.active ? 'rgba(0,186,242,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${s.done ? 'rgba(16,185,129,0.4)' : s.active ? 'rgba(0,186,242,0.4)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      {s.done
                        ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                        : s.active
                          ? <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse inline-block" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />
                      }
                    </div>
                    <span className={`text-[11px] ${s.active ? 'text-white font-semibold' : s.done ? 'text-emerald-400' : ''}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security note */}
            <p className="text-center text-[10px] mt-5 animate-fade-up delay-500" style={{ color: 'var(--text-muted)' }}>
              🔒 PCI-DSS protected · Do not share your UPI PIN with anyone
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-5 text-center" style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(8,12,20,0.8)' }}>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          © 2026 {CONFIG.businessName} · Session: <span className="font-mono">{orderId?.slice(0, 12)}</span>
        </p>
      </footer>
    </div>
  );
}
