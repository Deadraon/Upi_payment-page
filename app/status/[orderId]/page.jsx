'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle, XCircle, Loader2, IndianRupee,
  Key, Calendar, ShieldCheck, RefreshCw,
  AlertCircle, ArrowRight, ExternalLink,
} from 'lucide-react';

/* ── Animated success check ────────────────────────────────── */
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
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

/* ── Receipt row ───────────────────────────────────────────── */
const Row = ({ label, value, mono = false, green = false }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-[#1E1E22] last:border-0">
    <span className="text-xs text-[#4B5563] font-medium">{label}</span>
    <span className={`text-xs font-semibold text-right max-w-[55%] break-all ${mono ? 'font-mono' : ''} ${green ? 'text-emerald-400' : 'text-[#D1D5DB]'}`}>
      {value}
    </span>
  </div>
);

/* ── Logo header ───────────────────────────────────────────── */
const Header = ({ badge }) => (
  <header className="w-full border-b border-[#1E1E22] bg-[#0C0C0E] px-5 py-3.5 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
        <span className="text-white font-black text-[10px]">P</span>
      </div>
      <span className="font-bold text-xs text-white">PayDrift</span>
    </div>
    {badge}
  </header>
);

export default function StatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [mounted, setMounted] = useState(false);

  const [utrInput, setUtrInput]           = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrError, setUtrError]           = useState('');
  const [utrSuccess, setUtrSuccess]       = useState('');
  const [redirecting, setRedirecting]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const { data, error: dbErr } = await supabase
          .from('orders').select('*').eq('id', orderId).single();
        if (dbErr) throw dbErr;
        setOrder(data);
        setError('');
      } catch {
        setError('Could not locate this transaction.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 2000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status !== 'verified' || redirecting) return;
    const callback = localStorage.getItem(`callback_${orderId}`) || order.callback_url;
    const externalRef = localStorage.getItem(`ref_${orderId}`) || order.external_ref;
    if (callback) {
      setRedirecting(true);
      setTimeout(() => {
        const url = new URL(callback);
        url.searchParams.set('status', 'success');
        url.searchParams.set('gateway_id', orderId);
        if (order.utr) url.searchParams.set('utr', order.utr);
        if (externalRef) url.searchParams.set('ref', externalRef);
        window.location.href = url.toString();
      }, 2500);
    }
  }, [order, orderId, redirecting]);

  const handleUtrSubmit = async (e) => {
    e.preventDefault();
    setUtrError(''); setUtrSuccess('');
    const cleanUtr = utrInput.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      setUtrError('Please enter a valid 12-digit UTR number.');
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
      setUtrSuccess('UTR submitted! Verification in progress.');
    } catch (err) {
      setUtrError(err.message);
    } finally {
      setSubmittingUtr(false);
    }
  };

  const fmt = (dt) => dt
    ? new Date(dt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  /* Loading */
  if (!mounted || loading) return (
    <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm text-[#4B5563] font-medium">Loading transaction...</p>
      </div>
    </div>
  );

  /* Error */
  if (error || !order) return (
    <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#141416] rounded-2xl border border-[#252528] p-8 text-center space-y-4 animate-scale-up">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Order Not Found</h2>
          <p className="text-xs text-[#4B5563] mt-1">We couldn&apos;t find a transaction matching this ID.</p>
        </div>
        <button onClick={() => router.push('/pay')}
          className="w-full py-2.5 rounded-xl bg-[#1C1C1F] hover:bg-[#252528] text-[#9CA3AF] font-semibold text-sm transition-all">
          Back to Payment
        </button>
      </div>
    </div>
  );

  const isUtrSubmitted = order.utr && /^\d{12}$/.test(order.utr.trim());
  const callback = (typeof window !== 'undefined' && localStorage.getItem(`callback_${orderId}`)) || order.callback_url;

  /* ═══════════════════════════════════════════════════════════
     VERIFIED
  ═══════════════════════════════════════════════════════════ */
  if (order.status === 'verified') return (
    <div className="min-h-screen bg-[#0C0C0E] flex flex-col">
      <Header badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Verified
        </span>
      } />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm animate-scale-up">
          <div className="bg-[#141416] rounded-2xl border border-emerald-500/20 shadow-2xl overflow-hidden">
            <div className="h-0.5 bg-emerald-500 w-full" />
            <div className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="animate-pulse-success rounded-full"><AnimatedCheck /></div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Payment Confirmed!</h2>
                <p className="text-sm text-emerald-400 font-semibold mt-1">
                  ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} received successfully
                </p>
              </div>
            </div>
            <div className="mx-5 mb-4 rounded-xl bg-[#0C0C0E] border border-[#1E1E22] px-4 py-1">
              <Row label="Order ID" value={orderId} mono />
              <Row label="Amount" value={`₹${parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} green />
              <Row label="UTR / Ref" value={order.utr || 'Auto-verified'} mono />
              <Row label="Verified At" value={fmt(order.verified_at)} />
              {order.customer_name && <Row label="Customer" value={order.customer_name} />}
            </div>
            <div className="px-5 pb-6 space-y-2.5">
              {redirecting && callback ? (
                <div className="w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting back to {order.project || 'your app'}...
                </div>
              ) : callback ? (
                <button onClick={() => {
                  const url = new URL(callback);
                  url.searchParams.set('status', 'success');
                  url.searchParams.set('gateway_id', orderId);
                  if (order.utr) url.searchParams.set('utr', order.utr);
                  window.location.href = url.toString();
                }} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  <ExternalLink className="w-4 h-4" /> Return to {order.project || 'App'}
                </button>
              ) : (
                <button onClick={() => router.push('/pay')}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  Done · New Payment
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center">
        <p className="text-[10px] text-[#3A3A3F]">© 2026 PayDrift · Secure Payments</p>
      </footer>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     REJECTED
  ═══════════════════════════════════════════════════════════ */
  if (order.status === 'rejected') return (
    <div className="min-h-screen bg-[#0C0C0E] flex flex-col">
      <Header badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Declined
        </span>
      } />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm animate-scale-up">
          <div className="bg-[#141416] rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
            <div className="h-0.5 bg-red-500 w-full" />
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Payment Declined</h2>
                <p className="text-xs text-[#4B5563] mt-1">We could not verify this transaction.</p>
              </div>
            </div>
            <div className="mx-5 mb-4 rounded-xl bg-[#0C0C0E] border border-[#1E1E22] px-4 py-1">
              <Row label="Order ID" value={orderId} mono />
              <Row label="Amount" value={`₹${parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
            </div>
            <div className="px-5 pb-6">
              <p className="text-xs text-[#4B5563] text-center mb-3">
                If you were debited, contact support with your order reference.
              </p>
              {callback ? (
                <button onClick={() => {
                  const url = new URL(callback);
                  url.searchParams.set('status', 'failed');
                  url.searchParams.set('gateway_id', orderId);
                  window.location.href = url.toString();
                }} className="w-full py-3 rounded-xl bg-[#1C1C1F] hover:bg-[#252528] text-[#9CA3AF] font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  <ExternalLink className="w-4 h-4" /> Return to {order.project || 'App'}
                </button>
              ) : (
                <button onClick={() => router.push('/pay')}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     PENDING
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#0C0C0E] flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-[#1C1C1F]">
        <div className="progress-bar h-full" />
      </div>

      <Header badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />Under Review
        </span>
      } />

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm animate-scale-up">
          <div className="bg-[#141416] rounded-2xl border border-[#252528] shadow-2xl overflow-hidden">
            <div className="h-0.5 bg-indigo-600 w-full" />

            {/* Header */}
            <div className="p-6 text-center space-y-3 border-b border-[#1E1E22]">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center mx-auto animate-pulse-ring">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Verifying Payment</h2>
                <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                  Your payment is being processed. You can{' '}
                  <strong className="text-indigo-400">safely close</strong> this page.
                </p>
              </div>
            </div>

            {/* Order summary */}
            <div className="mx-5 mt-4 rounded-xl bg-[#0C0C0E] border border-[#1E1E22] px-4 py-1">
              <div className="flex justify-center items-baseline gap-0.5 py-2.5 border-b border-[#1E1E22] mb-1">
                <span className="text-2xl font-black text-white">₹</span>
                <span className="text-3xl font-black text-white tabular-nums">
                  {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Row label="Order ID" value={orderId} mono />
              <Row label="Method" value={order.method || 'UPI'} />
              {order.project && <Row label="Project" value={order.project} />}
            </div>

            {/* UTR input */}
            <div className="px-5 py-4 border-t border-[#1E1E22] mt-3">
              {isUtrSubmitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> UTR Submitted
                  </div>
                  <p className="text-[10px] text-[#6B7280]">
                    Ref: <strong className="font-mono text-[#9CA3AF]">{order.utr}</strong>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUtrSubmit} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-1">
                      Speed Up Verification
                    </label>
                    <p className="text-[9px] text-[#4B5563] leading-relaxed">
                      Enter the 12-digit UTR / IMPS Ref from your bank&apos;s confirmation.
                    </p>
                  </div>
                  {utrError && (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {utrError}
                    </div>
                  )}
                  {utrSuccess && (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
                      <CheckCircle className="w-3 h-3 flex-shrink-0" /> {utrSuccess}
                    </div>
                  )}
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3A3A3F]" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="Enter 12-digit UTR"
                      value={utrInput}
                      onChange={e => { setUtrInput(e.target.value.replace(/\D/g, '')); setUtrError(''); }}
                      className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl text-xs font-mono tracking-wider text-white placeholder-[#3A3A3F] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 py-2.5 pl-9 pr-3 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingUtr || utrInput.length !== 12}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingUtr
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                      : <><span>Submit UTR</span><ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </form>
              )}
            </div>

            {/* Live indicator */}
            <div className="px-5 pb-5 pt-1 flex items-center justify-center gap-1.5 text-[10px] text-[#3A3A3F]">
              <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
              Checking payment status in real-time...
            </div>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center">
        <p className="text-[10px] text-[#2A2A2E]">© 2026 PayDrift · Secure Payments</p>
      </footer>
    </div>
  );
}
