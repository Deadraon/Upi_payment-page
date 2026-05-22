'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { 
  Lock, 
  Unlock, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  LogOut, 
  Dumbbell, 
  User, 
  Phone, 
  FileText,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Copy
} from 'lucide-react';

export default function AdminPage() {
  // Auth states
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Data states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Action states
  const [actionLoading, setActionLoading] = useState(null); // stores order ID currently in progress
  const [manualUtr, setManualUtr] = useState('');
  const [utrPromptId, setUtrPromptId] = useState(null);

  // Sync auth state from session storage on mount
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('admin_pwd');
    if (savedPassword) {
      setPassword(savedPassword);
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch orders and calculate summaries
  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setOrders(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Could not fetch transaction logs from database.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Trigger fetch when logged in or filter changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
      
      // Auto-refresh every 15 seconds
      const interval = setInterval(() => {
        fetchOrders();
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchOrders]);

  // Handle manual verify/reject actions
  const handleOrderAction = async (orderId, action, utrVal = '') => {
    setActionLoading(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          orderId,
          action,
          utr: utrVal
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      // Update local state instantly
      setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      setUtrPromptId(null);
      setManualUtr('');
    } catch (err) {
      alert(err.message || 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Password submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      sessionStorage.setItem('admin_pwd', password);
      setIsLoggedIn(true);
    } catch (err) {
      setAuthError(err.message || 'Incorrect Admin Password');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pwd');
    setPassword('');
    setIsLoggedIn(false);
    setOrders([]);
  };

  // Calculations for Metrics Cards
  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVerifiedOrders = orders.filter(o => {
      if (o.status !== 'verified') return false;
      const orderDate = new Date(o.created_at);
      return orderDate >= today;
    });

    const revenue = todayVerifiedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const count = todayVerifiedOrders.length;

    return { revenue, count };
  };

  const getMetrics = () => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const verifiedCount = orders.filter(o => o.status === 'verified').length;
    const rejectedCount = orders.filter(o => o.status === 'rejected').length;
    const today = getTodayStats();

    return { pendingCount, verifiedCount, rejectedCount, today };
  };

  const metrics = getMetrics();

  // Filtering orders
  const filteredOrders = orders.filter(o => {
    // Status filter
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = o.id?.toLowerCase().includes(q);
      const matchName = o.customer_name?.toLowerCase().includes(q);
      const matchPhone = o.customer_phone?.toLowerCase().includes(q);
      const matchUtr = o.utr?.toLowerCase().includes(q);
      const matchNote = o.note?.toLowerCase().includes(q);
      const matchAmount = o.amount?.toString().includes(q);
      
      return matchId || matchName || matchPhone || matchUtr || matchNote || matchAmount;
    }
    
    return true;
  });

  const themeColor = CONFIG.themeColor || '#1D9E75';

  if (!isLoggedIn) {
    /* LOGIN WALL SCREEN */
    return (
      <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-[#1D9E75]/30">
        
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[30%] left-[40%] w-[50%] h-[50%] rounded-full opacity-[0.05] blur-[100px]" style={{ backgroundColor: themeColor }}></div>
        </div>

        <div className="max-w-md w-full bg-[#121B2E]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative space-y-6 overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: themeColor }}></div>

          {/* Branding */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Dumbbell className="w-7 h-7 text-white" style={{ color: themeColor }} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{CONFIG.businessName}</h2>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Admin Dashboard Portal</p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4.5 h-4.5 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Dashboard Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0A0F1D]/80 border border-slate-850 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-650 outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-750 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] disabled:opacity-50 shadow-lg"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 6px 20px ${themeColor}20`
              }}
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Unlock Gateway Logs</span>
                  <Unlock className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* LOGGED IN DASHBOARD */
  return (
    <div className="min-h-screen bg-[#060A13] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#1D9E75]/30">
      
      {/* Top Header bar */}
      <header className="bg-[#0B1220] border-b border-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" style={{ color: themeColor }} />
            </div>
            <div>
              <h1 className="font-extrabold text-md tracking-tight text-white">{CONFIG.businessName}</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gateway Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchOrders}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-850 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin View */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* Error warning */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Dashboard Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Today's Revenue */}
          <div className="bg-[#0F172A]/70 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-[115px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today&apos;s Revenue</p>
                <h3 className="text-2xl font-black text-white mt-1.5 flex items-center gap-0.5">
                  <IndianRupee className="w-5 h-5 text-emerald-400" />
                  <span>{metrics.today.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">{metrics.today.count} verified transactions today</p>
          </div>

          {/* Pending Verification */}
          <div className="bg-[#0F172A]/70 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-[115px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Match</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{metrics.pendingCount}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">Awaiting automated SMS webhook</p>
          </div>

          {/* Total Verified */}
          <div className="bg-[#0F172A]/70 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-[115px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Verified</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{metrics.verifiedCount}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">Valid bank credits registered</p>
          </div>

          {/* Total Rejected */}
          <div className="bg-[#0F172A]/70 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-[115px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Rejected</p>
                <h3 className="text-2xl font-black text-white mt-1.5">{metrics.rejectedCount}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">Failed or manual overrides</p>
          </div>

        </section>

        {/* Filters and List view */}
        <section className="bg-[#0A0E17]/60 border border-slate-850/85 backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-850">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-wide">Transaction Logs</h2>
                <p className="text-xs text-slate-400">Total: {orders.length} orders • Live Auto-refreshing 15s</p>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-xs w-full sm:ml-4">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search UTR, Name, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0F1D]/80 border border-slate-800 rounded-xl py-2 pl-10 pr-8 text-xs text-white placeholder-slate-650 outline-none focus:border-slate-700 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'all', label: 'All Logs', color: 'rgb(241, 245, 249)' },
                { id: 'pending', label: 'Pending', color: 'rgb(245, 158, 11)' },
                { id: 'verified', label: 'Verified', color: 'rgb(16, 185, 129)' },
                { id: 'rejected', label: 'Rejected', color: 'rgb(239, 68, 68)' },
              ].map(filt => (
                <button
                  key={filt.id}
                  onClick={() => setStatusFilter(filt.id)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex-shrink-0"
                  style={{
                    backgroundColor: statusFilter === filt.id ? 'rgba(30, 41, 59, 0.6)' : '#0F172A',
                    borderColor: statusFilter === filt.id ? themeColor : 'rgb(30, 41, 59)',
                    color: statusFilter === filt.id ? 'white' : 'rgb(148, 163, 184)'
                  }}
                >
                  {filt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="min-w-full divide-y divide-slate-850/80">
              <thead className="bg-[#0F172A]/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">UTR Reference</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50 bg-[#070B13]/30">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-sm text-slate-500">
                      No transactions match this search/status filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const localTime = new Date(order.created_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    });

                    return (
                      <tr key={order.id} className="hover:bg-slate-900/35 transition-colors">
                        
                        {/* Order ID */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono font-bold text-slate-400 group relative">
                          <span className="cursor-pointer" onClick={() => {
                            navigator.clipboard.writeText(order.id);
                            alert("Copied Order ID to clipboard");
                          }} title="Click to copy full ID">
                            {order.id.slice(0, 8)}...
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-400 font-semibold">
                          {localTime}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-200">
                          {order.customer_name || order.customer_phone ? (
                            <div className="space-y-0.5">
                              <div className="font-bold flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>{order.customer_name || 'N/A'}</span>
                              </div>
                              {order.customer_phone && (
                                <div className="text-[10px] font-semibold text-slate-500 font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-650" />
                                  <span>{order.customer_phone}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 font-medium">Anonymous</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-slate-100">
                          <div className="flex items-center gap-0.5 font-extrabold text-sm">
                            <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                            <span>{parseFloat(order.amount).toFixed(2)}</span>
                          </div>
                        </td>

                        {/* Method */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                          <span className="px-2 py-0.5 text-[10px] rounded-lg bg-slate-850 border border-slate-800 text-slate-300 font-bold uppercase tracking-wider">
                            {order.method || 'UPI'}
                          </span>
                        </td>

                        {/* Note */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-400 font-medium max-w-[120px] truncate" title={order.note}>
                          {order.note || '-'}
                        </td>

                        {/* UTR Reference */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono">
                          {order.utr ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                                {order.utr}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.utr);
                                  alert("Copied UTR Reference to clipboard!");
                                }}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors animate-pulse"
                                title="Copy UTR Reference"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#00D2FF]" />
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
                              Awaiting Submission
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                          {order.status === 'verified' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 animate-fadeIn">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Verified</span>
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                              <span>Pending</span>
                            </span>
                          )}
                          {order.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/25 text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-center">
                          {order.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {utrPromptId === order.id ? (
                                <div className="flex items-center gap-1 animate-fadeIn">
                                  <input
                                    type="text"
                                    placeholder="Enter UTR"
                                    value={manualUtr}
                                    onChange={(e) => setManualUtr(e.target.value)}
                                    className="px-2 py-1 rounded bg-[#0A0F1D] border border-slate-700 text-xs text-white outline-none w-[110px] font-semibold"
                                  />
                                  <button
                                    onClick={() => handleOrderAction(order.id, 'verify', manualUtr)}
                                    disabled={actionLoading === order.id}
                                    className="p-1 text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                                    title="Confirm"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => setUtrPromptId(null)}
                                    className="p-1 text-slate-500 hover:bg-slate-800 rounded transition-colors"
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setUtrPromptId(order.id);
                                      setManualUtr(order.utr || `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`);
                                    }}
                                    disabled={actionLoading !== null}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm("Reject this payment?")) {
                                        handleOrderAction(order.id, 'reject');
                                      }
                                    }}
                                    disabled={actionLoading !== null}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-550 font-mono font-medium truncate max-w-[100px] inline-block bg-slate-900 px-2 py-0.5 rounded border border-slate-800/40">
                              {order.utr || 'Matched'}
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-slate-500 border-t border-slate-900 bg-[#070B13]/80">
        <p>&copy; 2026 {CONFIG.businessName}. All rights reserved.</p>
        <p className="mt-1 text-[9px] text-slate-650">Secure Session Protected • Merchant Node Reference IP-IOB/2026</p>
      </footer>

    </div>
  );
}
