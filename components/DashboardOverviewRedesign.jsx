'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Building2,
  X,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Plus,
  ChevronDown,
  Filter,
  Download,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Activity,
  Check,
  Zap,
  Info,
  ExternalLink,
  Copy
} from 'lucide-react';

export default function DashboardOverviewRedesign({
  profile,
  stats = {},
  orders = [],
  analyticsTimeframe = 7,
  setAnalyticsTimeframe,
  setActiveTab
}) {
  // ─── BANK ACCOUNT MODAL STATE ───
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

  // ─── ROUTING RULES MODAL STATE ───
  const [showRoutingRules, setShowRoutingRules] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);

  // ─── FILTER & SYNC STATE ───
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'success' | 'pending' | 'refunded'
  const [currentTime, setCurrentTime] = useState('');

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasBankAccount = !!(profile?.bank_account_number && profile?.bank_name);

  // Sample fallback transactions matching the Stitch design
  const defaultSampleTransactions = useMemo(() => [
    {
      id: 'TXN_9842109',
      date: 'Today, 14:32',
      customer: 'Rahul Sharma',
      method: 'UPI',
      amount: 2450.0,
      status: 'Success'
    },
    {
      id: 'TXN_9842108',
      date: 'Today, 14:15',
      customer: 'Priya Patel',
      method: 'Credit Card',
      amount: 14200.0,
      status: 'Success'
    },
    {
      id: 'TXN_9842107',
      date: 'Today, 13:58',
      customer: 'Aman Verma',
      method: 'Net Banking',
      amount: 850.0,
      status: 'Pending'
    },
    {
      id: 'TXN_9842106',
      date: 'Today, 13:42',
      customer: 'Sneha Rao',
      method: 'UPI',
      amount: 3120.0,
      status: 'Success'
    }
  ], []);

  // Process live orders or fall back to Stitch sample transactions
  const transactions = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders.slice(0, 8).map((order) => {
        let dateStr = 'Today, ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
        if (order.created_at) {
          const d = new Date(order.created_at);
          const isToday = d.toDateString() === new Date().toDateString();
          const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
          dateStr = isToday ? `Today, ${time}` : `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, ${time}`;
        }

        const rawStatus = (order.status || '').toLowerCase();
        let displayStatus = 'Success';
        if (rawStatus === 'pending' || rawStatus === 'processing' || rawStatus === 'in_progress') {
          displayStatus = 'Pending';
        } else if (rawStatus === 'refunded' || rawStatus === 'refund') {
          displayStatus = 'Refunded';
        } else if (rawStatus === 'failed' || rawStatus === 'cancelled') {
          displayStatus = 'Failed';
        }

        const txnId = order.order_id || (order.id ? (order.id.startsWith('TXN_') ? order.id : `TXN_${order.id.toString().slice(-7).toUpperCase()}`) : 'TXN_' + Math.floor(1000000 + Math.random() * 9000000));

        return {
          id: txnId,
          date: dateStr,
          customer: order.customer_name || order.customer_email || order.vpa || 'Merchant Customer',
          method: order.upi_app || order.method || 'UPI',
          amount: parseFloat(order.amount) || 0,
          status: displayStatus
        };
      });
    }
    return defaultSampleTransactions;
  }, [orders, defaultSampleTransactions]);

  // Filter transactions based on active filter chip
  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return transactions;
    if (activeFilter === 'success') return transactions.filter(t => t.status === 'Success');
    if (activeFilter === 'pending') return transactions.filter(t => t.status === 'Pending');
    if (activeFilter === 'refunded') return transactions.filter(t => t.status === 'Refunded' || t.status === 'Failed');
    return transactions;
  }, [transactions, activeFilter]);

  // Formatted Metrics with fallbacks
  const displayTotalProcessed = useMemo(() => {
    const val = stats.todayVolume || stats.totalVolume || 412890;
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [stats.todayVolume, stats.totalVolume]);

  const displayTxnCount = useMemo(() => {
    const count = (orders && orders.length > 0) ? orders.length : (stats.todayCount || 1428);
    return Number(count).toLocaleString('en-IN');
  }, [orders, stats.todayCount]);

  const displaySettledVolume = useMemo(() => {
    const val = stats.settledVolume || stats.successfulVolume || 398450;
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [stats.settledVolume, stats.successfulVolume]);

  // Modal Handlers
  const openAddBank = () => {
    setBankError(null);
    setBankSuccess(false);
    setShowAddBank(true);
  };
  const closeAddBank = () => {
    setShowAddBank(false);
    setBankError(null);
  };

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
      setTimeout(() => {
        closeAddBank();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setBankError(err.message || 'Failed to save bank details.');
    } finally {
      setBankSaving(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Date & Time', 'Customer', 'Payment Method', 'Amount (INR)', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      `"${t.customer}"`,
      t.method,
      t.amount,
      t.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mymobpay_settlement_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyRoutingDetails = () => {
    const details = `MyMobPay Direct Pass-Through Settlement Rail\nRail Mode: Instant T+0 IMPS/UPI Pass-Through\nIntermediary Escrow: 0.00% (Zero Hold)\nPrimary Clearing Node: Mumbai AWS-South\nDaily Settlement Cap: ₹25,00,000.00\nDestination: ${hasBankAccount ? `${profile.bank_name} (${profile.bank_account_number})` : 'ICICI Bank (••••4092)'}`;
    navigator.clipboard.writeText(details);
    setRulesCopied(true);
    setTimeout(() => setRulesCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-5 font-sans antialiased text-[#0f141a]">

      {/* ─── OPTIONAL ALERT: NO BANK ACCOUNT ADDED ─── */}
      {!hasBankAccount && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Direct Pass-Through Rail Inactive</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add your bank account to enable zero-retention T+0 direct settlement to your pool.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddBank}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Link Bank Account
          </button>
        </div>
      )}

      {/* ─── ASYMMETRIC BENTO DUAL-WING WORKSPACE ─── */}
      <div className="w-full grid grid-cols-12 gap-5 items-start">

        {/* ══════════════════════════════════════════════════════════════
            LEFT WING: HERO METRIC MONOLITH & PROFILE DOCK (Span 3)
           ══════════════════════════════════════════════════════════════ */}
        <section className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          
          {/* Merchant Passport Card */}
          <div className="bg-white rounded-xl border border-[#d2dae5] p-5 shadow-sm">
            <div className="flex gap-4 items-center mb-4">
              <div
                className="aspect-square rounded-lg size-16 shrink-0 bg-cover bg-center border border-[#e8edf2] flex items-center justify-center bg-gradient-to-br from-[#0c2340] to-[#1a3a60] text-white font-bold text-2xl shadow-sm overflow-hidden"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuANhrj3dCZXeCrr2b6XzyfeHJArIfsqC4LKLgwukMGe_Mh2FXb1kaGhRN8lYOPcOPeo0ViL5WmZ_jM6bAUxbKifUDiJZR4pYS37ivkLABk2y4V3e49r5HlZpDPpb3kr-A0RtB94ViXbiP4Q3kq40eknoe9T5kIHktyj0X0xef78UZc7jVhQr2jSU-hGfkaI_HKERuhwtEMP-xlLASUBokgEWV0qgLJ3cybF8eC5s-5SASQC-7XL40s8WQ')`
                }}
              >
                {!profile?.business_name && (
                  <span className="text-white text-lg tracking-tight">M</span>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-[#0f141a] text-base font-bold leading-tight truncate">
                    {profile?.business_name || 'MyMobPay Tech'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#07883b] border border-emerald-200 shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-[#547092] text-xs font-normal truncate mt-0.5">
                  {profile?.website || (profile?.email ? profile.email.split('@')[1] : 'mymob.tech')}
                </p>
                <p className="text-[#547092] text-xs font-mono font-medium truncate">
                  MID: {profile?.merchant_id || 'MMP884920'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e8edf2] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#547092]">Settlement Type</span>
                <span className="font-medium text-[#0f141a]">Direct Pass-Through</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#547092]">Destination</span>
                <span className="font-mono font-medium text-[#0f141a]">
                  {hasBankAccount
                    ? `${profile.bank_name} •••• ${profile.bank_account_number?.slice(-4)}`
                    : 'ICICI •••• 4092'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#547092]">KYC / GSTIN</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#07883b]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#547092]">Operating Mode</span>
                <span className="font-medium text-[#0c2340]">Production Rail (T+0)</span>
              </div>
            </div>
          </div>

          {/* Monolith: Total Processed (Accent Lead) */}
          <div className="bg-[#0c2340] text-white rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <p className="text-[#b3c7ec] text-xs font-semibold uppercase tracking-wider">
                Total Processed
              </p>
              <span className="px-2 py-0.5 rounded-full bg-[#07883b]/20 text-[#4edea3] text-xs font-bold">
                +14.2%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-white font-mono">
                ₹ {displayTotalProcessed}
              </p>
              <p className="text-xs text-[#778bad] mt-1 font-medium">
                Gross settled &amp; active gateway flow
              </p>
            </div>
          </div>

          {/* Compact Bento Pair: Transaction Count & Settled Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* Transaction Count Card */}
            <div className="bg-white rounded-xl border border-[#d2dae5] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-[#547092] text-xs font-medium uppercase tracking-wider">
                  Transaction Count
                </p>
                <span className="text-[#07883b] text-xs font-bold">+8.6%</span>
              </div>
              <div className="mt-3">
                <p className="text-[#0f141a] text-2xl font-bold tracking-tight font-mono">
                  {displayTxnCount}
                </p>
                <div className="w-full bg-[#e8edf2] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#2c60ff] h-full w-[72%] rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>

            {/* Settled Volume Card */}
            <div className="bg-white rounded-xl border border-[#d2dae5] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-[#547092] text-xs font-medium uppercase tracking-wider">
                  Settled Volume
                </p>
                <span className="text-[#07883b] text-xs font-bold">+12.4%</span>
              </div>
              <div className="mt-3">
                <p className="text-[#0f141a] text-2xl font-bold tracking-tight font-mono">
                  ₹ {displaySettledVolume}
                </p>
                <div className="w-full bg-[#e8edf2] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#07883b] h-full w-[96%] rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Deck: Instant Payout API Node */}
          <div className="bg-[#eaedff] border border-[#dae2fd] rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0045de] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#0f141a]">Instant Payout API</p>
                <p className="text-[11px] text-[#547092]">Node active on Mumbai AWS-South</p>
              </div>
            </div>
            <span className="size-2 rounded-full bg-[#07883b] ring-4 ring-[#6ffbbe]/40 shrink-0"></span>
          </div>

        </section>


        {/* ══════════════════════════════════════════════════════════════
            CENTER WING: HIGH-DENSITY TABULAR LEDGER FEED (Span 6)
           ══════════════════════════════════════════════════════════════ */}
        <section className="col-span-12 xl:col-span-6 flex flex-col gap-4">
          
          {/* Filter Chips & Operational Bar */}
          <div className="bg-white border border-[#d2dae5] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* All Transactions */}
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  activeFilter === 'all'
                    ? 'bg-[#0c2340] text-white font-semibold shadow-sm'
                    : 'bg-[#e8edf2] text-[#0f141a] hover:bg-[#d2dae5] font-medium'
                }`}
              >
                <span>All Transactions</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Successful */}
              <button
                type="button"
                onClick={() => setActiveFilter('success')}
                className={`h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  activeFilter === 'success'
                    ? 'bg-[#0c2340] text-white font-semibold shadow-sm'
                    : 'bg-[#e8edf2] text-[#0f141a] hover:bg-[#d2dae5] font-medium'
                }`}
              >
                <span>Successful</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Pending */}
              <button
                type="button"
                onClick={() => setActiveFilter('pending')}
                className={`h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  activeFilter === 'pending'
                    ? 'bg-[#0c2340] text-white font-semibold shadow-sm'
                    : 'bg-[#e8edf2] text-[#0f141a] hover:bg-[#d2dae5] font-medium'
                }`}
              >
                <span>Pending</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Refunded */}
              <button
                type="button"
                onClick={() => setActiveFilter('refunded')}
                className={`h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  activeFilter === 'refunded'
                    ? 'bg-[#0c2340] text-white font-semibold shadow-sm'
                    : 'bg-[#e8edf2] text-[#0f141a] hover:bg-[#d2dae5] font-medium'
                }`}
              >
                <span>Refunded</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>

            {/* Quick Action Tool Icons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Filter ledger"
                onClick={() => setActiveFilter(f => f === 'all' ? 'success' : 'all')}
                className="size-8 rounded-lg border border-[#e8edf2] flex items-center justify-center text-[#547092] hover:text-[#0f141a] hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Export ledger as CSV"
                onClick={handleExportCSV}
                className="size-8 rounded-lg border border-[#e8edf2] flex items-center justify-center text-[#547092] hover:text-[#0f141a] hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High Density Real-Time Settlement Ledger Table */}
          <div className="bg-white rounded-xl border border-[#d2dae5] shadow-sm overflow-hidden">
            {/* Table Header Strip */}
            <div className="px-5 py-3.5 border-b border-[#e8edf2] flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#2c60ff]"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f141a]">
                  Real-Time Settlement Ledger
                </h4>
              </div>
              <span className="text-[11px] text-[#547092] font-medium">
                Sync: {currentTime || '14:32:04'} IST
              </span>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#e8edf2] text-[11px] font-bold text-[#547092] uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-3">Date &amp; Time</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf2] text-xs">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((txn, index) => (
                      <tr
                        key={txn.id || index}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        onClick={() => setActiveTab?.('transactions')}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-[#0f141a]">
                          {txn.id}
                        </td>
                        <td className="py-3 px-3 text-[#547092] whitespace-nowrap">
                          {txn.date}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#0f141a] max-w-[140px] truncate">
                          {txn.customer}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#e8edf2] text-[#0f141a] text-[11px] font-semibold">
                            {txn.method}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#0f141a] font-mono">
                          ₹ {txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {txn.status === 'Success' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#07883b] border border-emerald-200">
                              Success
                            </span>
                          )}
                          {txn.status === 'Pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                          {(txn.status === 'Refunded' || txn.status === 'Failed') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              {txn.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#547092] text-xs">
                        No transactions found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ledger Footer Summary Strip */}
            <div className="p-3 border-t border-[#e8edf2] bg-gray-50 flex items-center justify-between text-xs text-[#547092]">
              <p>Showing latest {filteredTransactions.length} settlements from session buffer</p>
              <button
                type="button"
                onClick={() => setActiveTab?.('transactions')}
                className="flex items-center gap-1 font-medium text-[#0c2340] hover:text-[#2c60ff] transition-colors"
              >
                <span>View Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </section>


        {/* ══════════════════════════════════════════════════════════════
            RIGHT WING: RAIL STATUS TELEMETRY & GATEWAY OPS (Span 3)
           ══════════════════════════════════════════════════════════════ */}
        <section className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          
          {/* Telemetry Card: Gateway Telemetry */}
          <div className="bg-white rounded-xl border border-[#d2dae5] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f141a]">
                Gateway Telemetry
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#07883b] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#07883b]"></span>
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-[#e8edf2]">
                <span className="text-xs text-[#547092]">UPI Stack Latency</span>
                <span className="text-xs font-bold text-[#07883b] font-mono">112ms</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-[#e8edf2]">
                <span className="text-xs text-[#547092]">Card Rails (Visa/MC)</span>
                <span className="text-xs font-bold text-[#0c2340] font-mono">99.98%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-[#e8edf2]">
                <span className="text-xs text-[#547092]">Webhook Engine</span>
                <span className="text-xs font-bold text-[#07883b] font-mono">Active</span>
              </div>
            </div>
          </div>

          {/* Bank Settlement Rail Card */}
          <div className="bg-white rounded-xl border border-[#d2dae5] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-[#e8edf2] flex items-center justify-center text-[#0c2340]">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0f141a]">Bank Settlement Rail</p>
                  <p className="text-[11px] text-[#547092]">Auto-sweep at 23:59 IST</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openAddBank}
                title={hasBankAccount ? "Update settlement pool account" : "Link bank account"}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {hasBankAccount ? 'Edit' : 'Add'}
              </button>
            </div>

            <div className="pt-3 border-t border-[#e8edf2] space-y-1.5 text-xs text-[#547092]">
              <div className="flex justify-between">
                <span>Primary Pool</span>
                <span className="font-medium text-[#0f141a] font-mono">
                  {hasBankAccount
                    ? `${profile.bank_name} *******${profile.bank_account_number?.slice(-3)}`
                    : 'HDFC *******492'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Daily Cap</span>
                <span className="font-medium text-[#0f141a] font-mono">₹ 25,00,000.00</span>
              </div>
            </div>
          </div>

          {/* Compact Quick Settlement Control Stack */}
          <div className="bg-gradient-to-br from-[#0c2340] to-[#1a3a60] text-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#b3c7ec]">
                Direct Pass-Through
              </p>
              <span className="px-2 py-0.5 rounded-full bg-[#07883b]/20 text-[#4edea3] text-[11px] font-bold">
                0% Escrow
              </span>
            </div>
            
            <p className="text-sm font-bold text-white mt-1">
              No Balance or Holding Period
            </p>
            <p className="text-xs text-[#d5e3ff] mt-2 leading-relaxed">
              Customer payments credit directly into your linked bank account in real-time with zero intermediary hold or rolling reserve.
            </p>

            <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-xs text-[#b3c7ec]">
              <div className="flex justify-between">
                <span>Routing Mode</span>
                <span className="font-medium text-white">Instant T+0 Pass-Through</span>
              </div>
              <div className="flex justify-between">
                <span>Intermediary Hold</span>
                <span className="font-medium text-white font-mono">₹ 0.00 (Zero Retention)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRoutingRules(true)}
              className="mt-4 w-full h-9 rounded-lg bg-white text-[#0c2340] hover:bg-gray-100 text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
            >
              <span>View Bank Routing Rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </section>

      </div>


      {/* ─── ADD / EDIT BANK ACCOUNT MODAL ─── */}
      {showAddBank && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Direct Settlement Account</h2>
                  <p className="text-xs text-slate-500">Configure instant T+0 payout destination</p>
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
                  <Check className="w-4 h-4" /> Bank account saved successfully!
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
                  placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                  value={bankForm.bank_name}
                  onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c2340]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="As per bank passbook / statement"
                  value={bankForm.bank_account_name}
                  onChange={e => setBankForm(f => ({ ...f, bank_account_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c2340]"
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
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c2340]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccNum(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c2340]"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-[#0c2340]"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Settlements credit instantly into this account with 0% escrow retention via IMPS rail.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0c2340] hover:bg-[#1a3a60] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60"
              >
                {bankSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {bankSaving ? 'Saving...' : 'Save Settlement Account'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── BANK ROUTING RULES POPUP MODAL ─── */}
      {showRoutingRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#4edea3]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Bank Routing Rules &amp; Architecture</h3>
                  <p className="text-xs text-[#b3c7ec]">Direct Pass-Through &bull; Zero Escrow Protocol</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRoutingRules(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900">0% Intermediary Retention</h4>
                  <p className="text-emerald-800 mt-0.5 leading-relaxed">
                    Customer UPI payments bypass platform escrow wallets entirely, settling straight into your commercial nodal bank account in real-time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-slate-200">
                  <span className="text-[#547092] font-semibold uppercase text-[10px]">Settlement Rail</span>
                  <p className="font-bold text-[#0f141a] mt-0.5">NPCI UPI Direct IMPS</p>
                  <p className="text-[#547092] text-[11px] mt-1">Average execution: &lt; 250ms</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-slate-200">
                  <span className="text-[#547092] font-semibold uppercase text-[10px]">Settlement Mode</span>
                  <p className="font-bold text-[#0f141a] mt-0.5">Instant T+0 Pass-Through</p>
                  <p className="text-[#547092] text-[11px] mt-1">Zero rolling reserves</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-slate-200">
                  <span className="text-[#547092] font-semibold uppercase text-[10px]">Active Node</span>
                  <p className="font-bold text-[#0f141a] mt-0.5">AWS Mumbai (ap-south-1)</p>
                  <p className="text-[#547092] text-[11px] mt-1">99.98% High Availability</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-slate-200">
                  <span className="text-[#547092] font-semibold uppercase text-[10px]">Daily Velocity Cap</span>
                  <p className="font-bold text-[#0f141a] mt-0.5">₹ 25,00,000.00 / day</p>
                  <p className="text-[#547092] text-[11px] mt-1">Upgradable via Support</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-[#547092] mb-1">
                  <span className="font-semibold text-[11px]">Active Destination Routing</span>
                  <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">ACTIVE</span>
                </div>
                <p className="font-bold text-slate-800 text-xs">
                  {hasBankAccount
                    ? `${profile.bank_name} &bull; ${profile.bank_account_name} &bull; Account: ••••${profile.bank_account_number?.slice(-4)} (${profile.bank_ifsc})`
                    : 'Default Sandbox Pool: ICICI Bank (••••4092)'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={copyRoutingDetails}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                {rulesCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {rulesCopied ? 'Routing rules copied!' : 'Copy Rule Specs'}
              </button>
              <button
                type="button"
                onClick={() => setShowRoutingRules(false)}
                className="px-4 py-2 rounded-lg bg-[#0c2340] text-white text-xs font-bold hover:bg-[#1a3a60] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}