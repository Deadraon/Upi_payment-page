'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { 
  LogOut, Save, Key, User, Briefcase, Link as LinkIcon, 
  Loader2, Copy, CheckCircle, CreditCard, Mail, X, 
  LayoutDashboard, Search, Download, RefreshCw, IndianRupee,
  Clock, CheckCircle2, XCircle, Code, ChevronRight, BookOpen
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Transaction States
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Interactive Payment Link Builder State
  const [linkAmount, setLinkAmount] = useState('500');
  const [linkNote, setLinkNote] = useState('Order_123');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  // Error Banner
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
    };

    fetchSession();
  }, [router]);

  // Safe UUID generator
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const fetchProfile = async (userId) => {
    try {
      setDbError(null);
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;

      // Auto-fix missing api_key
      if (!data.api_key) {
        const newKey = generateUUID();
        await supabase.from('merchants').update({ api_key: newKey }).eq('id', userId);
        data.api_key = newKey;
      }

      setProfile(data);
      // Fetch orders for this merchant
      fetchOrders(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      if (error.code === 'PGRST116') {
         const newKey = generateUUID();
         const newProfile = { id: userId, business_name: 'My Business', upi_id: 'pending@upi', api_key: newKey };
         const { data: insertedData, error: insertErr } = await supabase.from('merchants').insert(newProfile).select().single();
         if (insertErr) {
            setDbError(`Insert Error: ${insertErr.message} (Code: ${insertErr.code})`);
         } else {
            setProfile(insertedData);
            fetchOrders(userId);
         }
      } else {
         setDbError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (userId) => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleRefreshOrders = () => {
    if (user) {
      fetchOrders(user.id);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          business_name: profile.business_name,
          upi_id: profile.upi_id,
          webhook_url: profile.webhook_url,
          theme_color: profile.theme_color || '#3B82F6'
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyApiKey = () => {
    if (!profile?.api_key) return;
    navigator.clipboard.writeText(profile.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismissVerification = async () => {
    try {
      await supabase
        .from('merchants')
        .update({ gmail_verification_code: null })
        .eq('id', user.id);
      
      setProfile({ ...profile, gmail_verification_code: null });
    } catch (error) {
      console.error('Failed to dismiss banner', error);
    }
  };

  // Filter Transactions list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
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
  }, [orders, searchQuery, statusFilter]);

  // Calculations for Metrics Cards
  const stats = useMemo(() => {
    const verified = orders.filter(o => o.status === 'verified');
    const totalVolume = verified.reduce((sum, o) => sum + parseFloat(o.amount), 0);
    
    // Today's counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVerified = verified.filter(o => new Date(o.created_at) >= today);
    const todayVolume = todayVerified.reduce((sum, o) => sum + parseFloat(o.amount), 0);

    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return {
      totalVolume,
      totalCount: verified.length,
      todayVolume,
      todayCount: todayVerified.length,
      pendingCount
    };
  }, [orders]);

  // Client-side CSV Download
  const downloadCSV = () => {
    const headers = ['Order ID', 'Date & Time', 'Customer Name', 'Customer Phone', 'Amount (INR)', 'Note', 'UTR Reference', 'Status'];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      o.customer_name || 'Anonymous',
      o.customer_phone || 'N/A',
      parseFloat(o.amount).toFixed(2),
      o.note || '',
      o.utr || 'N/A',
      o.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mymobpay_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Interactive link builder
  const generatedPaymentLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.origin;
    const key = profile?.api_key || 'YOUR_API_KEY';
    return `${host}/pay?api_key=${key}&amount=${linkAmount}&note=${encodeURIComponent(linkNote)}`;
  }, [profile, linkAmount, linkNote]);

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(generatedPaymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copySnippet = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // REST API and SDK code snippets
  const snippets = {
    js: `// 1. Create a payment order via Node.js/Javascript
const createOrder = async () => {
  const response = await fetch('https://your-domain.com/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: "${profile?.api_key || 'YOUR_API_KEY'}",
      amount: ${parseFloat(linkAmount) || 500.00},
      customer_name: "John Doe",
      customer_phone: "9876543210",
      note: "${linkNote}",
      callback_url: "https://your-website.com/api/callback"
    })
  });
  const data = await response.json();
  console.log("MyMobPay Order Created:", data.orderId);
  // Redirect customer to: \`https://your-domain.com/pay?api_key=${profile?.api_key || 'YOUR_API_KEY'}&amount=\${data.orderAmount}&ref=\${data.orderId}\`
};`,
    python: `# 2. Create a payment order via Python Requests
import requests

payload = {
    "api_key": "${profile?.api_key || 'YOUR_API_KEY'}",
    "amount": ${parseFloat(linkAmount) || 500.00},
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "note": "${linkNote}",
    "callback_url": "https://your-website.com/api/callback"
}

res = requests.post("https://your-domain.com/api/orders", json=payload)
data = res.json()
print("Order ID:", data.get("orderId"))`,
    php: `<?php
// 3. Create a payment order via PHP cURL
$payload = [
    "api_key" => "${profile?.api_key || 'YOUR_API_KEY'}",
    "amount" => ${parseFloat(linkAmount) || 500.00},
    "customer_name" => "John Doe",
    "customer_phone" => "9876543210",
    "note" => "${linkNote}",
    "callback_url" => "https://your-website.com/api/callback"
];

$ch = curl_init("https://your-domain.com/api/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$data = json_decode($response, true);
echo "Order Created: " . $data['orderId'];
?>`
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading merchant console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      
      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            MyMob<span className="text-blue-600 italic">Pay</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'transactions' ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <CreditCard className="w-4 h-4" /> Transactions
          </button>

          <button 
            onClick={() => setActiveTab('developer')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'developer' ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <BookOpen className="w-4 h-4" /> Developer API
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Briefcase className="w-4 h-4" /> Settings
          </button>

          <button 
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'api' ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Key className="w-4 h-4" /> API Keys
          </button>
        </nav>

        {/* User Card info footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: profile?.theme_color || '#3B82F6' }}
            >
              {profile?.business_name ? profile.business_name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{profile?.business_name || 'My Business'}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-sm font-bold text-slate-700 shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Mobile Header Bar */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            MyMob<span className="text-blue-600 italic">Pay</span>
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-slate-900 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header section with active tab label */}
            <div className="mb-6 pt-2 md:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 capitalize">{activeTab === 'api' ? 'API Credentials' : activeTab === 'developer' ? 'Developer Portal' : activeTab}</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {activeTab === 'overview' && 'Real-time overview of business revenue and platform subscription details.'}
                  {activeTab === 'transactions' && 'Monitor and filter payment orders. Export history instantly.'}
                  {activeTab === 'developer' && 'Configure custom integrations, fetch orders via REST APIs, or copy-paste client SDK snippets.'}
                  {activeTab === 'settings' && 'Customize your business metadata, direct UPI deposit addresses, and brand colors.'}
                  {activeTab === 'api' && 'Secret credential tokens for creating programmatic checkouts.'}
                </p>
              </div>

              {activeTab === 'transactions' && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleRefreshOrders}
                    disabled={ordersLoading}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-55"
                    title="Refresh Transactions"
                  >
                    <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={downloadCSV}
                    disabled={filteredOrders.length === 0}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Export CSV Report
                  </button>
                </div>
              )}
            </div>

            {/* Gmail Forwarding Banner */}
            {profile?.gmail_verification_code && (
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 shadow-sm relative pr-12">
                <button 
                  onClick={handleDismissVerification}
                  className="absolute top-4 right-4 p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <strong className="text-blue-700 flex items-center gap-2 text-sm"><Mail className="w-4 h-4"/> Gmail Forwarding Verification</strong>
                    <p className="text-xs mt-1 text-blue-600 font-medium">Google sent a verification link to confirm your bank email forwarding rule.</p>
                  </div>
                  <a 
                    href={profile.gmail_verification_code} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={handleDismissVerification}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl whitespace-nowrap transition-all shadow-sm shadow-blue-500/20"
                  >
                    Click Here to Verify
                  </a>
                </div>
              </div>
            )}

            {/* DB Error Banner */}
            {dbError && (
              <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-900 shadow-sm">
                <strong className="text-sm text-red-700">Database Connection Error:</strong>
                <p className="font-mono text-xs mt-1 text-red-600">{dbError}</p>
                <p className="text-[10px] mt-2 text-red-500 font-medium">Make sure the `merchants` and `orders` tables are configured inside Supabase SQL Editor.</p>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               TAB: OVERVIEW
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Stats Dashboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Total Volume */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[120px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Sales (INR)</p>
                    <h3 className="text-3xl font-black text-slate-900 leading-none mt-2 flex items-baseline">
                      <span className="text-lg font-bold text-slate-400 mr-0.5">₹</span>
                      {stats.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">{stats.totalCount} verified payments overall</p>
                  </div>

                  {/* Today Sales */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[120px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today&apos;s Sales</p>
                    <h3 className="text-3xl font-black text-slate-900 leading-none mt-2 flex items-baseline">
                      <span className="text-lg font-bold text-slate-400 mr-0.5">₹</span>
                      {stats.todayVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">+{stats.todayCount} transactions today</p>
                  </div>

                  {/* Pending match */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[120px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Awaiting Verification</p>
                    <h3 className="text-3xl font-black text-slate-900 leading-none mt-2">
                      {stats.pendingCount}
                    </h3>
                    <p className="text-[10px] text-amber-500 font-bold mt-1 animate-pulse">Awaiting bank notification match</p>
                  </div>

                  {/* Settlement Time */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[120px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settlement Period</p>
                    <h3 className="text-xl font-black text-emerald-600 leading-none mt-2 uppercase tracking-wide">
                      Instant P2P
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Funds deposited directly to UPI ID</p>
                  </div>

                </div>

                {/* Account / Subscription Status Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Account Subscription
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <div className={`w-3 h-3 rounded-full ${profile?.subscription_status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                      <span className="font-extrabold text-lg text-slate-900 capitalize">{profile?.subscription_status || 'Inactive'}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Active accounts process API transactions and SMS triggers in real-time.</p>
                  </div>

                  {profile?.subscription_status !== 'active' ? (
                    <button
                      onClick={() => {
                        const url = `/pay?api_key=${CONFIG.platformApiKey}&amount=${CONFIG.subscriptionFee}&ref=${profile.id}&note=Subscription_Renewal`;
                        window.open(url, '_blank');
                      }}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                    >
                      <CreditCard className="w-4 h-4" /> Renew for ₹{CONFIG.subscriptionFee}/mo
                    </button>
                  ) : (
                    <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Renewal Date</p>
                      <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                        {profile?.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Next billing cycle'}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               TAB: TRANSACTIONS LOGS
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'transactions' && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                
                {/* Search Bar & Filters */}
                <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Search input field */}
                  <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search Customer Name, UTR, Order ID, Note..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3 text-[10px] text-slate-400 hover:text-slate-900">
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter controls */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                    {[
                      { id: 'all', label: 'All Orders' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'verified', label: 'Verified' },
                      { id: 'rejected', label: 'Rejected' },
                      { id: 'expired', label: 'Expired' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${statusFilter === f.id ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Live transaction log table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount (INR)</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Note</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">UTR / Ref</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settlement</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {ordersLoading ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-xs text-slate-500">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto mb-2" />
                            Loading transaction records...
                          </td>
                        </tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-xs font-medium text-slate-500">
                            No transaction logs matched your query.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => {
                          const localTime = new Date(order.created_at).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          });

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                              
                              {/* Order ID */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-400">
                                <span 
                                  className="cursor-pointer hover:text-blue-600 flex items-center gap-1.5"
                                  onClick={() => {
                                    navigator.clipboard.writeText(order.id);
                                    alert("Copied Order ID!");
                                  }}
                                  title="Copy Order ID"
                                >
                                  {order.id}
                                  <Copy className="w-3 h-3 flex-shrink-0 opacity-40 hover:opacity-100" />
                                </span>
                              </td>

                              {/* Date */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-semibold">
                                {localTime}
                              </td>

                              {/* Customer */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-900">
                                {order.customer_name || order.customer_phone ? (
                                  <div className="space-y-0.5">
                                    <p className="font-bold">{order.customer_name || 'N/A'}</p>
                                    {order.customer_phone && <p className="text-[10px] text-slate-400 font-semibold">{order.customer_phone}</p>}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-medium">Anonymous</span>
                                )}
                              </td>

                              {/* Amount */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-950 flex items-center gap-0.5">
                                <span className="text-slate-400 font-bold">₹</span>
                                {parseFloat(order.amount).toFixed(2)}
                              </td>

                              {/* Note */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-semibold max-w-[120px] truncate" title={order.note}>
                                {order.note || '-'}
                              </td>

                              {/* UTR */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-semibold text-slate-700">
                                {order.utr ? (
                                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">{order.utr}</span>
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </td>

                              {/* Settlement */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs">
                                {order.status === 'verified' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Instant Bank
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                                    <Clock className="w-3 h-3 text-slate-400" /> Escrow holding
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="px-6 py-4 whitespace-nowrap text-xs">
                                {order.status === 'verified' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    ✓ Verified
                                  </span>
                                )}
                                {order.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                    ● Pending
                                  </span>
                                )}
                                {order.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                                    ✕ Rejected
                                  </span>
                                )}
                                {order.status === 'expired' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                    Expired
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

                {/* Footer Count */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Escrow Release Policy: Immediate P2P settlement</span>
                  <span className="text-xs text-slate-500 font-semibold">{filteredOrders.length} records filtered</span>
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               TAB: DEVELOPER PORTAL
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'developer' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Custom Payment Link Builder (Left 1 col) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <LinkIcon className="w-5 h-5 text-blue-600" /> Interactive Checkout Link
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount (INR)</label>
                      <input 
                        type="number"
                        value={linkAmount}
                        onChange={e => setLinkAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-900"
                        placeholder="500.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction Note / ID</label>
                      <input 
                        type="text"
                        value={linkNote}
                        onChange={e => setLinkNote(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-900"
                        placeholder="Order_123"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Your Dynamic URL</p>
                    <code className="block bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-mono break-all text-slate-700 leading-normal font-semibold">
                      {generatedPaymentLink || 'Generating link...'}
                    </code>
                  </div>

                  <button 
                    onClick={copyPaymentLink}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
                  >
                    {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'Copied to Clipboard!' : 'Copy Payment Link'}
                  </button>
                </div>

                {/* API Specs & Code Snippets (Right 2 cols) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Code className="w-5 h-5 text-blue-600" /> REST API Order Integration
                  </h3>

                  {/* API specs description */}
                  <div className="space-y-4 text-slate-600 text-xs leading-relaxed font-medium">
                    <p>
                      Generate orders programmatically using our payment API. Authenticate requests by sending your `api_key` in the request body.
                    </p>
                    
                    {/* Method header card */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-extrabold rounded-md uppercase">POST</span>
                      <code className="font-mono text-slate-800 font-bold text-xs">/api/orders</code>
                    </div>

                    {/* Code Snippets tabs */}
                    <div className="space-y-3 pt-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select SDK Language</p>
                      
                      <div className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden">
                        
                        {/* Tab header selectors */}
                        <div className="bg-slate-850 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                          <div className="flex gap-4">
                            <span className="text-[11px] font-bold text-slate-300">HTTP REST Code Snippet</span>
                          </div>
                          <button 
                            onClick={() => copySnippet('snippets', snippets.js)}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            {copiedSnippet === 'snippets' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedSnippet === 'snippets' ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        {/* Raw code content */}
                        <pre className="p-4 text-[10px] font-mono text-slate-200 overflow-x-auto leading-relaxed bg-[#0d0e15] max-h-[300px]">
                          {snippets.js}
                        </pre>

                      </div>

                    </div>

                    {/* Webhooks instructions */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-blue-600"/> Secure Webhook Verification</h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                        Webhook callbacks are signed using your private API Key as the HMAC SHA-256 secret. Verify the payload authenticity by computing the HMAC of the incoming JSON raw body and comparing it to the `X-MyMobPay-Signature` header.
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               TAB: API KEYS
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'api' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" /> Private API Key
                </h3>
                <p className="text-xs text-slate-500 mb-5 font-medium">Use this key to authorize checkout generation requests from your backend server. Keep it secure and never share it publicly.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono break-all text-slate-700 font-bold">
                    {profile?.api_key || 'Loading...'}
                  </code>
                  <button 
                    onClick={copyApiKey}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-200"
                    title="Copy API Key"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               TAB: SETTINGS
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-slate-900">
                  <Briefcase className="w-5 h-5 text-blue-600" /> Business Profile
                </h2>
                
                <div className="space-y-6 font-medium text-xs text-slate-700">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Business Name</label>
                    <input 
                      type="text" 
                      value={profile?.business_name || ''} 
                      onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-blue-500 focus:outline-none transition-all text-sm font-semibold text-slate-900"
                      placeholder="e.g. My Awesome Store"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">This brand name appears on public scanning gateways.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">UPI ID (VPA)</label>
                    <input 
                      type="text" 
                      value={profile?.upi_id || ''} 
                      onChange={(e) => setProfile({...profile, upi_id: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-blue-500 focus:outline-none font-mono text-sm font-semibold text-slate-900"
                      placeholder="merchant@upi"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">UPI deposits will be directly routed to this bank VPA account instantly.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Custom Brand Theme Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={profile?.theme_color || '#3B82F6'} 
                        onChange={(e) => setProfile({...profile, theme_color: e.target.value})}
                        className="w-12 h-12 bg-white border border-slate-200 rounded-xl cursor-pointer p-1"
                      />
                      <input 
                        type="text" 
                        value={profile?.theme_color || '#3B82F6'} 
                        onChange={(e) => setProfile({...profile, theme_color: e.target.value})}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-blue-500 focus:outline-none font-mono text-sm font-semibold text-slate-900"
                        placeholder="#3B82F6"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">This color will be used as the theme for your public payment scanning page.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                      Webhook Outbound URL <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">Optional</span>
                    </label>
                    <input 
                      type="url" 
                      value={profile?.webhook_url || ''} 
                      onChange={(e) => setProfile({...profile, webhook_url: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-blue-500 focus:outline-none font-mono text-sm font-semibold text-slate-900 placeholder-slate-455"
                      placeholder="https://your-website.com/api/webhook"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">We will fire a POST request here carrying HMAC signatures when a customer payment succeeds.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-500/20"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {saving ? 'Saving Profile...' : 'Save Profile'}
                    </button>
                    {message && (
                      <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> {message}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
