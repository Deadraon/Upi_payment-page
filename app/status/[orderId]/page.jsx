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
  AlertCircle,
} from 'lucide-react';

/* ── Success checkmark SVG animation ────────────────────── */
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#16A34A" strokeWidth="2" opacity="0.2" />
    <circle
      cx="26" cy="26" r="25"
      fill="none" stroke="#16A34A" strokeWidth="2.5"
      strokeDasharray="157" strokeDashoffset="157"
      style={{ animation: 'dash 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
      strokeLinecap="round"
    />
    <path
      d="M14 27 L22 35 L38 18"
      fill="none" stroke="#16A34A" strokeWidth="3"
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
      style={accent ? { color: '#2563EB' } : {}}
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

  useEffect(() => {
    const timer = setTimeout(() => setShowUtr(true), 60000);
    return () => clearTimeout(timer);
  }, []);

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
      setOrder(data.order);
      setUtrSuccess('Transaction UTR submitted successfully!');
    } catch (err) {
      setUtrError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#09090B' }}>
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 flex items-center justify-center animate-pulse-ring">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
          <p className="text-sm font-medium text-zinc-500">
            Loading order status...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#09090B' }}>
        <div className="glass-card w-full max-w-sm p-8 text-center space-y-5 animate-scale-up">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto bg-red-500/10 border border-red-500/30">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Order Not Found</h2>
            <p className="text-xs mt-2 text-zinc-500">
              We couldn&apos;t find any transaction matching this ID.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/pay')}
            className="w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-zinc-800 hover:bg-slate-200 text-zinc-300 border border-zinc-800"
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

  const isUtrSubmitted = order.utr && /^\d{12}$/.test(order.utr.trim());

  /* ── VERIFIED STATE ── */
  if (order.status === 'verified') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#09090B' }}>
        <header className="max-w-4xl mx-auto w-full px-6 pt-6 flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-bold text-sm text-white">PayDrift</span>
          </div>
          <div className="status-badge verified">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/100 inline-block" />
            Payment Verified
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="glass-card animate-scale-up" style={{ padding: '30px 24px', borderColor: '#BBF7D0' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-green-500/100" />

              <div className="text-center space-y-4 animate-fade-up">
                <div className="flex justify-center">
                  <div className="animate-pulse-success rounded-full">
                    <AnimatedCheck />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Payment Confirmed!</h2>
                  <p className="text-xs mt-1 text-green-600 font-semibold">
                    ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} received successfully
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl p-4 animate-fade-up delay-200 bg-zinc-800/50 border border-zinc-800">
                <div className="text-center pb-3 mb-2 border-b border-zinc-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Amount Received</p>
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    <span className="text-3xl font-extrabold text-white">
                      {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Row icon={<User className="w-3.5 h-3.5 text-zinc-500" />} label="Name" value={order.customer_name || 'N/A'} />
                  <Row icon={<CreditCard className="w-3.5 h-3.5 text-zinc-500" />} label="Method" value={order.method} />
                  <Row icon={<Key className="w-3.5 h-3.5 text-zinc-500" />} label="UTR / Ref" value={order.utr || 'Auto-verified'} mono accent />
                  <Row icon={<Calendar className="w-3.5 h-3.5 text-zinc-500" />} label="Date" value={fmt(order.verified_at)} />
                </div>

                <div className="mt-3 rounded-lg p-2.5 flex justify-between items-center text-[10px] bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 font-medium">Order ID</span>
                  <span className="font-mono text-zinc-500">{orderId?.slice(0, 18)}…</span>
                </div>
              </div>

              <button
                onClick={() => (window.location.href = '/pay')}
                className="w-full mt-5 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-fade-up delay-300"
                style={{ background: '#16A34A' }}
              >
                Done · New Payment
              </button>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center border-t border-zinc-800 bg-zinc-900">
          <p className="text-[10px] text-zinc-500">© 2026 PayDrift · Secure Payments</p>
          <p className="text-[10px] text-zinc-500 mt-1">Built with ❤️ by MOB</p>
        </footer>
      </div>
    );
  }

  /* ── REJECTED STATE ── */
  if (order.status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#09090B' }}>
        <header className="max-w-4xl mx-auto w-full px-6 pt-6 flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-bold text-sm text-white">PayDrift</span>
          </div>
          <div className="status-badge rejected">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/100 inline-block" />
            Declined
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="glass-card animate-scale-up" style={{ padding: '30px 24px', borderColor: '#FECACA' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500/100" />

              <div className="text-center space-y-4 animate-fade-up">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto bg-red-500/10 border border-red-500/30">
                  <XCircle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Payment Declined</h2>
                  <p className="text-xs mt-1 text-red-500 font-semibold">
                    We could not verify this transaction
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl p-4 animate-fade-up delay-200 bg-zinc-800/50 border border-zinc-800 text-center space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  If you were debited, please contact support with your order reference.
                </p>
                <div className="divider" />
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-medium">Order ID</span>
                  <span className="font-mono text-zinc-500">{orderId?.slice(0, 18)}…</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-medium">Amount</span>
                  <span className="font-bold text-zinc-100">₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => (window.location.href = '/pay')}
                className="w-full mt-5 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-fade-up delay-300"
                style={{ background: '#DC2626' }}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center border-t border-zinc-800 bg-zinc-900">
          <p className="text-[10px] text-zinc-500">© 2026 PayDrift · Secure Payments</p>
          <p className="text-[10px] text-zinc-500 mt-1">Built with ❤️ by MOB</p>
        </footer>
      </div>
    );
  }

  /* ── PENDING REVIEW STATE ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#09090B' }}>
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-zinc-800">
        <div className="progress-bar h-full" />
      </div>

      <header className="max-w-4xl mx-auto w-full px-6 pt-6 flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600">
            <span className="text-white font-black text-sm">P</span>
          </div>
          <span className="font-bold text-sm text-white">PayDrift</span>
        </div>
        <div className="status-badge pending">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
          Under Review
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="glass-card animate-scale-up" style={{ padding: '26px 20px' }}>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-600" />

            {/* Pending Header */}
            <div className="text-center space-y-3 animate-fade-up">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-blue-500/30 flex items-center justify-center mx-auto bg-blue-500/10">
                <ShieldCheck className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Verifying Payment</h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Your payment is being processed. You can <strong className="text-blue-600">safely close</strong> this page.
                </p>
              </div>
            </div>

            {/* Order details */}
            <div className="mt-5 rounded-xl p-4 animate-fade-up delay-150 bg-zinc-800/50 border border-zinc-800">
              <div className="text-center pb-3 border-b border-zinc-800 mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Amount</p>
                <div className="flex items-center justify-center gap-0.5">
                  <IndianRupee className="w-4 h-4 text-blue-600" />
                  <span className="text-2xl font-extrabold text-white">
                    {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 text-[11px] text-zinc-500">
                <div className="flex justify-between items-center py-1">
                  <span>Method</span>
                  <span className="text-zinc-300 font-medium">{order.method || 'UPI'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Order ID</span>
                  <span className="font-mono text-zinc-400">{orderId?.slice(0, 16)}</span>
                </div>
              </div>
            </div>

            {/* UTR Section */}
            <div className="mt-5 pt-4 border-t border-zinc-800 animate-fade-up delay-200">
              {isUtrSubmitted ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>UTR Submitted</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Reference: <strong className="text-zinc-300 font-mono">{order.utr}</strong>
                  </p>
                  <p className="text-[9px] text-green-600 font-medium pt-1">
                    Verification in progress. Please allow a few minutes.
                  </p>
                </div>
              ) : showUtr ? (
                <form onSubmit={handleUtrSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Speed Up Verification
                    </label>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      Enter your 12-digit UTR/Ref number from your bank&apos;s transaction confirmation.
                    </p>
                  </div>

                  {utrError && (
                    <div className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-[10px] text-red-600 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{utrError}</span>
                    </div>
                  )}

                  {utrSuccess && (
                    <div className="p-2 rounded-lg border border-green-500/30 bg-green-500/10 text-[10px] text-green-600 flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{utrSuccess}</span>
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="w-3.5 h-3.5 text-zinc-400 group-focus-within:text-blue-600" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="Enter 12-digit UTR"
                      value={utrInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setUtrInput(val);
                        setUtrError('');
                      }}
                      className="pay-input py-2.5 pl-9 pr-3 text-xs tracking-wider font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingUtr || utrInput.length !== 12}
                    className="w-full py-2.5 rounded-lg text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#2563EB' }}
                  >
                    {submittingUtr ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit UTR</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-2 py-3">
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Awaiting Confirmation</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 max-w-[260px] mx-auto leading-relaxed">
                    Our system is checking for your payment. Please keep this page open.
                  </p>
                </div>
              )}
            </div>

            {/* Polling indicator */}
            <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
                <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Next check in {tick}s</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center border-t border-zinc-800 bg-zinc-900">
        <p className="text-[10px] text-zinc-500">© 2026 PayDrift · Secure Payments</p>
        <p className="text-[10px] text-zinc-500 mt-1">Built with ❤️ by MOB</p>
      </footer>
    </div>
  );
}
