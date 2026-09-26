'use client';

import { useState } from 'react';
import {
  TrendingUp, CheckCircle, QrCode, History,
  Download, Key, Plus, Zap, Activity, ArrowRight,
  AlertCircle, Building2, CreditCard, X, Save, Eye, EyeOff
} from 'lucide-react';

export default function DashboardOverviewRedesign({
  profile,
  stats = {},
  orders = [],
  analyticsTimeframe = 7,
  setAnalyticsTimeframe,
  setActiveTab
}) {
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_number_confirm: '',
    bank_ifsc: '',
    bank_account_name: ''
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [showAccNum, setShowAccNum] = useState(false);

  const hasBankAccount = !!(profile?.bank_account_number && profile?.bank_name);

  const recentTransactions = orders.slice(0, 4).map(order => ({
    id: order.id,
    amount: order.amount || 0,
    status: order.status || 'pending',
    timestamp: order.created_at,
    method: order.upi_app || 'UPI',
    vpa: order.vpa || 'user@upi'
  }));

  const openAddBank = () => { setBankError(null); setBankSuccess(false); setShowAddBank(true); };
  const closeAddBank = () => { setShowAddBank(false); setBankError(null); };

  const handleBankSave = async () => {
    setBankError(null);
    if (!bankForm.bank_name.trim()) return setBankError('Bank name is required.');
    if (!bankForm.bank_account_name.trim()) return setBankError('Account holder name is required.');
    if (!bankForm.bank_account_number.trim()) return setBankError('Account number is required.');
    if (bankForm.bank_account_number !== bankForm.bank_account_number_confirm)
      return setBankError('Account numbers do not match.');
    if (!bankForm.bank_ifsc.trim()) return setBankError('IFSC code is required.');
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.bank_ifsc.trim().toUpperCase()))
      return setBankError('Invalid IFSC code (e.g. HDFC0001234).');
    setBankSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankForm.bank_name.trim(),
          bank_account_number: bankForm.bank_account_number.trim(),
          bank_ifsc: bankForm.bank_ifsc.trim().toUpperCase(),
          bank_account_name: bankForm.bank_account_name.trim()
        })
        .eq('id', profile.id);
      if (error) throw error;
      setBankSuccess(true);
      setTimeout(() => { closeAddBank(); window.location.reload(); }, 1500);
    } catch (err) {
      setBankError(err.message || 'Failed to save bank details.');
    } finally {
      setBankSaving(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ─── ADD BANK MODAL ─── */}
      {showAddBank && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.55)' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Add Bank Account</h2>
                  <p className="text-xs text-slate-500">For settlement and direct payouts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAddBank}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {bankSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" /> Bank account saved successfully!
                </div>
              )}
              {bankError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {bankError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, Axis Bank"
                  value={bankForm.bank_name}
                  onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="As per bank records"
                  value={bankForm.bank_account_name}
                  onChange={e => setBankForm(f => ({ ...f, bank_account_name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAccNum ? 'text' : 'password'}
                    placeholder="Enter account number"
                    value={bankForm.bank_account_number}
                    onChange={e => setBankForm(f => ({ ...f, bank_account_number: e.target.value }))}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccNum(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showAccNum ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Re-enter account number"
                  value={bankForm.bank_account_number_confirm}
                  onChange={e => setBankForm(f => ({ ...f, bank_account_number_confirm: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={bankForm.bank_ifsc}
                  onChange={e => setBankForm(f => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))}
                  maxLength={11}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Settlement payouts are credited directly to this account. Ensure all details are accurate.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeAddBank}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBankSave}
                disabled={bankSaving || bankSuccess}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60"
              >
                {bankSaving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {bankSaving ? 'Saving...' : 'Save Bank Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NO BANK ACCOUNT ALERT ─── */}
      {!hasBankAccount && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">No Bank Account Added</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add your bank account to receive settlement payouts directly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddBank}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Bank Account
          </button>
        </div>
      )}

      {/* ─── MERCHANT HERO CARD ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Business Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20 shrink-0">
              {profile?.business_name?.charAt(0)?.toUpperCase() || 'M'}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {profile?.business_name || 'My Business'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold whitespace-nowrap">
                  <CheckCircle className="w-3 h-3" fill="currentColor" /> KYC Verified
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Live Mode
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  Merchant ID: <strong className="text-slate-700">{profile?.merchant_id || '—'}</strong>
                </span>
                <span className="text-slate-300">•</span>
                {hasBankAccount ? (
                  <span>
                    Settlement:{' '}
                    <strong className="text-slate-800">
                      {profile.bank_name} ••••{profile.bank_account_number?.slice(-4)}
                    </strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={openAddBank}
                    className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 font-semibold transition-colors"
                  >
                    <AlertCircle className="w-3 h-3" /> No settlement account — Add now
                  </button>
                )}
                {hasBankAccount && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <Zap className="w-3 h-3" /> Instant T+0 Payout
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" /> Export Report
            </button>
            <button
              type="button"
              onClick={() => setActiveTab?.('developer')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Key className="w-4 h-4 text-slate-500" /> View API Keys
            </button>
            <button
              type="button"
              onClick={() => setActiveTab?.('payment-links')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Create Payment Link
            </button>
          </div>
        </div>

        {/* Gateway Status Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold tracking-wide" style={{ fontSize: '10px' }}>Gateway Status</p>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational • 99.98% uptime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-400 uppercase font-semibold tracking-wide" style={{ fontSize: '10px' }}>Settlement Routing</p>
              {hasBankAccount ? (
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {profile.bank_name} — T+0 IMPS
                </p>
              ) : (
                <button
                  type="button"
                  onClick={openAddBank}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-800 mt-0.5 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Bank Account
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-400 uppercase font-semibold tracking-wide" style={{ fontSize: '10px' }}>Webhook URL</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {profile?.webhook_url
                  ? profile.webhook_url.replace('https://', '').substring(0, 30) + '…'
                  : 'Not configured'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 KEY METRICS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today Volume */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase font-semibold tracking-wide" style={{ fontSize: '10px' }}>
              Today&apos;s Volume
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-slate-900">
              ₹{(stats.todayVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Today
            </span>
            <svg className="w-14 h-4" fill="none" viewBox="0 0 60 20">
              <path d="M2 18 L12 14 L24 16 L36 8 L48 10 L58 2" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase font-semibold tracking-wide" style={{ fontSize: '10px' }}>
              Successful
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-slate-900">{stats.todayCount || 0}</span>
            <span className="text-xs text-slate-500 ml-1.5">payments</span>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Today&apos;s count
            </span>
          </div>
        </div>

        {/* UPI Rail Share */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase font-semibold tracking-wide" style={{ fontSize: '10px' }}>
              UPI Rail Share
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">76.4%</span>
            <span className="text-xs text-slate-500">of txns</span>
          </div>
          <div className="mt-2 flex items-center gap-0.5 w-full">
            <div className="h-1.5 rounded-l-full bg-purple-600" style={{ width: '38%' }} title="PhonePe 38%" />
            <div className="h-1.5 bg-blue-600" style={{ width: '31%' }} title="GPay 31%" />
            <div className="h-1.5 bg-sky-400" style={{ width: '18%' }} title="Paytm 18%" />
            <div className="h-1.5 rounded-r-full bg-slate-200 flex-1" title="Other" />
          </div>
          <div className="mt-1 flex items-center gap-2 text-slate-400 font-medium" style={{ fontSize: '10px' }}>
            <span>PhonePe</span><span>GPay</span><span>Paytm</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase font-semibold tracking-wide" style={{ fontSize: '10px' }}>
              Total Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-slate-900">{orders.length}</span>
            <span className="text-xs text-slate-500 ml-1.5">orders</span>
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setActiveTab?.('transactions')}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CHART + RIGHT PANEL ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Hourly Payment Chart */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Hourly Payment Inflow (INR ₹)</h2>
                <span
                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold"
                  style={{ fontSize: '10px' }}
                >
                  Real-Time
                </span>
              </div>
              <p className="text-slate-500 mt-0.5" style={{ fontSize: '11px' }}>
                Volume spikes during lunch and evening peak hours
              </p>
            </div>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              {[{ label: '24H', val: 1 }, { label: '7D', val: 7 }, { label: '30D', val: 30 }].map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAnalyticsTimeframe?.(val)}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                    analyticsTimeframe === val
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full h-56 pt-4">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 900 200">
              <defs>
                <linearGradient id="blueGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="900" y1="40" y2="40" />
              <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="900" y1="90" y2="90" />
              <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="900" y1="140" y2="140" />
              <line stroke="#e2e8f0" strokeWidth="1" x1="0" x2="900" y1="185" y2="185" />
              <path
                d="M 0,170 Q 75,160 150,150 T 300,135 T 450,40 T 600,115 T 750,30 T 900,90 L 900,185 L 0,185 Z"
                fill="url(#blueGrad)"
              />
              <path
                d="M 0,170 Q 75,160 150,150 T 300,135 T 450,40 T 600,115 T 750,30 T 900,90"
                fill="none"
                stroke="#2563eb"
                strokeLinecap="round"
                strokeWidth="3"
              />
              <circle cx="450" cy="40" fill="#fff" r="5" stroke="#2563eb" strokeWidth="3" />
              <circle cx="750" cy="30" fill="#fff" r="5" stroke="#2563eb" strokeWidth="3" />
            </svg>

            <div
              className="absolute left-[47%] top-[10%] -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded-md font-semibold shadow-lg pointer-events-none flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontSize: '11px' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              12:00 PM • ₹62,400
            </div>
            <div
              className="absolute left-[80%] top-[5%] -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded-md font-semibold shadow-lg pointer-events-none flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontSize: '11px' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              08:00 PM • ₹88,290
            </div>
          </div>

          <div
            className="flex justify-between items-center pt-2 px-1 border-t border-slate-100 text-slate-400"
            style={{ fontSize: '10px' }}
          >
            <span>12 AM</span>
            <span>4 AM</span>
            <span>8 AM</span>
            <span className="font-semibold text-blue-600">12 PM</span>
            <span>4 PM</span>
            <span className="font-semibold text-blue-600">8 PM</span>
            <span>12 AM</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Recent Transactions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                <p className="text-slate-500" style={{ fontSize: '11px' }}>Live UPI and bank settlements</p>
              </div>
              <button
                onClick={() => setActiveTab?.('transactions')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((txn, idx) => (
                  <div
                    key={txn.id || idx}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors -mx-1 px-1 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          txn.method?.toLowerCase().includes('phonepe')
                            ? 'bg-purple-50 text-purple-700'
                            : txn.method?.toLowerCase().includes('google') || txn.method?.toLowerCase().includes('gpay')
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {txn.method?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-slate-500" style={{ fontSize: '11px' }}>
                          {txn.vpa} • {txn.method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-bold border ${
                          txn.status === 'success' || txn.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {txn.status === 'success' || txn.status === 'completed' ? 'Success' : 'Processing'}
                      </span>
                      <p className="text-slate-400 mt-0.5" style={{ fontSize: '10px' }}>
                        {txn.timestamp
                          ? new Date(txn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No transactions yet
                </div>
              )}
            </div>
          </div>

          {/* Settlement Account Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Settlement Account</h3>
              {hasBankAccount ? (
                <button
                  type="button"
                  onClick={openAddBank}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  Update
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAddBank}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>

            {hasBankAccount ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">{profile.bank_name}</p>
                    <p className="text-slate-600" style={{ fontSize: '11px' }}>{profile.bank_account_name}</p>
                    <p className="text-slate-500 font-mono" style={{ fontSize: '11px' }}>
                      ••••{profile.bank_account_number?.slice(-4)} &nbsp;•&nbsp; {profile.bank_ifsc}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-500" style={{ fontSize: '11px' }}>
                  <Zap className="w-3 h-3 text-blue-500" /> Instant T+0 IMPS payout enabled
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={openAddBank}
                  className="w-full flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700">Add Bank Account</p>
                    <p className="text-slate-400 mt-0.5" style={{ fontSize: '11px' }}>Required for settlements</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SETTLEMENT BANNER ─── */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                Direct-to-Bank Instant Payouts — Zero Escrow
              </h3>
              <span
                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase"
                style={{ fontSize: '10px' }}
              >
                Zero Escrow
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasBankAccount
                ? `All collections credit directly into your ${profile.bank_name} account via IMPS/UPI routing.`
                : 'Add your bank account to enable direct instant payouts.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          {hasBankAccount ? (
            <button
              type="button"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" /> Download Settlement Advice
            </button>
          ) : (
            <button
              type="button"
              onClick={openAddBank}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Bank Account
            </button>
          )}
        </div>
      </div>

    </div>
  );
}