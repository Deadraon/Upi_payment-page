'use client';

/**
 * MyMobPay Dashboard Overview - Redesigned
 * Inspired by modern fintech dashboards (Razorpay/BharatPay style)
 * Light theme with clean metrics and real-time data visualization
 */

import { 
  TrendingUp, CheckCircle, QrCode, History, Calendar, Clock,
  Download, Key, Plus, AlertCircle, Zap, Activity, ArrowRight,
  ExternalLink, Bell, HelpCircle
} from 'lucide-react';

export default function DashboardOverviewRedesign({ 
  profile, 
  stats = {}, 
  orders = [],
  analyticsTimeframe = 7,
  setAnalyticsTimeframe,
  setActiveTab 
}) {
  
  // Calculate hourly data for chart (mock data for demo)
  const hourlyData = [
    { hour: '00:00', value: 205 },
    { hour: '04:00', value: 195 },
    { hour: '08:00', value: 180 },
    { hour: '12:00', value: 60 },  // Lunch peak
    { hour: '16:00', value: 140 },
    { hour: '20:00', value: 45 },  // Evening peak
    { hour: '23:59', value: 110 }
  ];

  // Recent transactions (last 4)
  const recentTransactions = orders.slice(0, 4).map(order => ({
    id: order.id,
    amount: order.amount || 0,
    status: order.status || 'pending',
    timestamp: order.created_at,
    method: order.upi_app || 'UPI',
    vpa: order.vpa || 'user@upi'
  }));

  // Calculate UPI app distribution
  const upiDistribution = {
    phonepe: 38,
    googlepay: 31,
    paytm: 18,
    other: 13
  };

  return (
    <div className="space-y-6">
      
      {/* ══════════════════════════════════════════════════════════
          TOP MERCHANT OVERVIEW HERO CARD
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Business Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-blue-500/20 shrink-0">
              mP
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {profile?.business_name || 'MyMobPay Technologies'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" fill="currentColor" />
                  KYC Verified
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Live Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Merchant ID: <strong className="text-slate-700 font-medium">{profile?.merchant_id || 'MID_MMP884920'}</strong></span>
                <span>•</span>
                <span>Settlement Account: <strong className="text-slate-800 font-semibold">ICICI Bank •••• {profile?.bank_account_number?.slice(-4) || '4092'}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  Instant Direct-to-Bank / Zero Escrow
                </span>
              </p>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              type="button"
              onClick={() => {/* Export functionality */}}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export Report
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab?.('developer')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Key className="w-4 h-4 text-slate-500" />
              View API Keys
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab?.('payment-links')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create Payment Link
            </button>
          </div>
        </div>

        {/* Gateway Status Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Gateway Status</p>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Operational • 99.98% uptime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Settlement Routing</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">ICICI Current A/C • Real-time T+0 IMPS</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Webhook Rail Latency</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {profile?.webhook_url?.replace('/api/webhook', '') || 'https://api.mymob.tech/v1'} • <span className="text-emerald-600">142ms</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4 KEY PERFORMANCE METRICS
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Today&apos;s Gross Volume</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">₹ {(stats.todayVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +18.4%
            </span>
            <span className="text-xs text-slate-400">vs yesterday</span>
            <svg className="w-16 h-5" fill="none" viewBox="0 0 60 20">
              <path d="M2 18 L12 14 L24 16 L36 8 L48 10 L58 2" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Successful Payments</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.todayCount || 0}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              98.2% conversion
            </span>
            <span className="text-xs text-slate-400">26 abandoned</span>
          </div>
        </div>

        {/* UPI Rail Share */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">UPI Rail Share</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">76.4%</span>
            <span className="text-xs text-slate-500 font-medium">1,091 txns</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 w-full">
            <div className="h-2 rounded-l-full bg-[#5f259f]" style={{ width: '38%' }} title="PhonePe 38%"></div>
            <div className="h-2 bg-[#1a73e8]" style={{ width: '31%' }} title="Google Pay 31%"></div>
            <div className="h-2 bg-[#00b9f5]" style={{ width: '18%' }} title="Paytm 18%"></div>
            <div className="h-2 rounded-r-full bg-slate-200" style={{ width: '13%' }} title="Other 13%"></div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>PhonePe 38%</span>
            <span>GPay 31%</span>
            <span>Paytm 18%</span>
          </div>
        </div>

        {/* Refunds */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Refunds &amp; Disputes</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">₹ 2,400.00</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              0.05% of vol • Healthy
            </span>
            <span className="text-xs text-slate-400">2 auto-cleared</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN ANALYTICS & RIGHT COLUMN GRID
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Hourly Payment Inflow Chart (2 cols on desktop) */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Hourly Payment Inflow (INR ₹)</h2>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold">Real-Time</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Volume spikes recorded during lunch (12:00 PM - 02:00 PM) and evening peak hours (08:00 PM IST)</p>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto border border-slate-200">
                <button 
                  onClick={() => setAnalyticsTimeframe?.(1)}
                  className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${analyticsTimeframe === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  type="button"
                >
                  24H
                </button>
                <button 
                  onClick={() => setAnalyticsTimeframe?.(7)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${analyticsTimeframe === 7 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  type="button"
                >
                  7D
                </button>
                <button 
                  onClick={() => setAnalyticsTimeframe?.(30)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${analyticsTimeframe === 30 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  type="button"
                >
                  30D
                </button>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full h-72 pt-6">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 900 240">
                <defs>
                  <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="900" y1="40" y2="40" />
                <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="900" y1="100" y2="100" />
                <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="900" y1="160" y2="160" />
                <line stroke="#e2e8f0" strokeWidth="1.5" x1="0" x2="900" y1="220" y2="220" />
                
                {/* Smooth Area & Stroke */}
                <path d="M 0,205 Q 75,195 150,180 T 300,165 T 450,60 T 600,140 T 750,45 T 900,110 L 900,220 L 0,220 Z" fill="url(#blueGradient)" />
                <path d="M 0,205 Q 75,195 150,180 T 300,165 T 450,60 T 600,140 T 750,45 T 900,110" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="3.5" />
                
                {/* Peak Callout Circles */}
                <circle cx="450" cy="60" fill="#ffffff" r="6" stroke="#2563eb" strokeWidth="3.5" />
                <circle cx="750" cy="45" fill="#ffffff" r="6" stroke="#2563eb" strokeWidth="3.5" />
              </svg>

              {/* Floating Data Markers */}
              <div className="absolute left-[47%] top-[12%] -translate-x-1/2 bg-slate-900 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-lg pointer-events-none flex items-center gap-1.5 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                12:00 PM • ₹ 62,400
              </div>
              <div className="absolute left-[81%] top-[7%] -translate-x-1/2 bg-blue-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-lg pointer-events-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                08:00 PM • ₹ 88,290
              </div>
            </div>

            {/* Chart Timeline Labels */}
            <div className="flex justify-between items-center text-xs text-slate-400 pt-3 px-1 border-t border-slate-100">
              <span>12:00 AM</span>
              <span>04:00 AM</span>
              <span>08:00 AM</span>
              <span className="font-semibold text-blue-600">12:00 PM (Lunch)</span>
              <span>04:00 PM</span>
              <span className="font-semibold text-blue-600">08:00 PM (Peak)</span>
              <span>11:59 PM</span>
            </div>
          </div>

          {/* Mini Bottom Status Pill */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-600" />
              Settlement Mode: <strong className="text-slate-800">T+0 Instant IMPS (Direct Bank Credit)</strong>
            </span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Escrow Hold: 0%
            </span>
          </div>
        </div>

        {/* Right Column: Recent Transactions & Payment Rails */}
        <div className="space-y-6">
          
          {/* Recent Transactions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                <p className="text-[11px] text-slate-500">Live Indian UPI &amp; Direct Bank settlements</p>
              </div>
              <button 
                onClick={() => setActiveTab?.('transactions')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentTransactions.length > 0 ? recentTransactions.map((txn, idx) => (
                <div key={txn.id || idx} className="py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors -mx-2 px-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      txn.method?.toLowerCase().includes('phonepe') ? 'bg-[#5f259f]/10 text-[#5f259f]' :
                      txn.method?.toLowerCase().includes('google') || txn.method?.toLowerCase().includes('gpay') ? 'bg-[#1a73e8]/10 text-[#1a73e8]' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {txn.method?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">₹ {txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <p className="text-[11px] text-slate-500">{txn.vpa} • {txn.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      txn.status === 'success' || txn.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {txn.status === 'success' || txn.status === 'completed' ? 'Success' : 'Processing'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {txn.timestamp ? new Date(txn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No transactions yet
                </div>
              )}
            </div>
          </div>

          {/* Payment Rails Pulse */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Payment Rails Pulse</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                NPCI Live
              </span>
            </div>
            
            <div className="space-y-3.5 my-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    UPI QR &amp; Autopay 2.0
                  </span>
                  <span className="font-bold text-slate-900">99.8%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Bank IMPS / NEFT Direct
                  </span>
                  <span className="font-bold text-slate-900">99.2%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '99.2%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Web3 USDT / Crypto Rails
                  </span>
                  <span className="font-bold text-slate-900">99.9%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '99.9%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>IMPS Latency: <strong className="text-slate-800">142ms</strong></span>
              <span>Escrow Hold: <strong className="text-emerald-700">0% (Direct)</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SETTLEMENT & GST BANNERS
          ══════════════════════════════════════════════════════════ */}
      
      {/* Direct-to-Bank Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Direct-to-Bank Instant Payouts — Zero Intermediary Escrow</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                Zero Escrow
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All transaction collections credit directly into your registered ICICI bank account via direct IMPS/UPI routing with full automated GST settlement reconciliations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button 
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            type="button"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Download Direct Settlement &amp; GST Advice
          </button>
        </div>
      </div>

      {/* GST Invoice Banner */}
      <div className="bg-[#0c2340] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Settlement Advice &amp; GST Invoices Available</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Download official monthly settlement certificates and GST statements (B2B compliant) for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button 
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors shadow-sm"
            type="button"
          >
            <Download className="w-4 h-4" />
            Download {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} GST Advice
          </button>
        </div>
      </div>

    </div>
  );
}
