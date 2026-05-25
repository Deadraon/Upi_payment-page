'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { 
  LogOut, Save, Key, User, Briefcase, Link as LinkIcon, 
  Loader2, Copy, CheckCircle, CreditCard, Mail, X, 
  LayoutDashboard, Search, Download, RefreshCw, IndianRupee,
  Clock, CheckCircle2, XCircle, Code, ChevronRight, BookOpen,
  Menu, TrendingUp, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Setup Wizard & Webhook Simulator States
  const [integrationTarget, setIntegrationTarget] = useState('website');
  const [mobileSdk, setMobileSdk] = useState('flutter');
  const [apiLang, setApiLang] = useState('curl');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState([]);

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

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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

  const toggleSandboxMode = async () => {
    if (!user || !profile) return;
    const currentSandbox = profile.sandbox_mode !== false;
    const nextSandbox = !currentSandbox;
    try {
      const { error } = await supabase
        .from('merchants')
        .update({ sandbox_mode: nextSandbox })
        .eq('id', user.id);
      
      if (error) throw error;
      setProfile({ ...profile, sandbox_mode: nextSandbox });
    } catch (err) {
      console.error("Failed to switch modes:", err);
      alert("Failed to change environment mode.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyApiKey = () => {
    if (!profile?.api_key) return;
    const isSandbox = profile.sandbox_mode !== false;
    const prefix = isSandbox ? 'test_' : 'live_';
    navigator.clipboard.writeText(prefix + profile.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestWebhook = async () => {
    if (!profile?.webhook_url) {
      alert("Please configure an Outbound Webhook URL in your Settings tab first!");
      return;
    }
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/merchant/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: profile.api_key,
          webhook_url: profile.webhook_url,
          amount: linkAmount,
          note: linkNote
        })
      });
      const data = await res.json();
      
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        url: profile.webhook_url,
        status: data.status,
        statusText: data.statusText,
        latency: data.latency,
        success: data.success,
        response: data.response
      };
      
      setWebhookLogs(prev => [newLog, ...prev].slice(0, 10)); // keep last 10 logs
    } catch (err) {
      console.error("Webhook test dispatch failed:", err);
      alert("Failed to send webhook test event: " + err.message);
    } finally {
      setTestingWebhook(false);
    }
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
      // Separator filter based on environment mode
      const isTestOrder = o.mode === 'test';
      const activeSandbox = profile?.sandbox_mode !== false;
      if (isTestOrder !== activeSandbox) return false;

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
  }, [orders, searchQuery, statusFilter, profile]);

  // Calculations for Metrics Cards
  const stats = useMemo(() => {
    const activeSandbox = profile?.sandbox_mode !== false;
    const modeFiltered = orders.filter(o => (o.mode === 'test') === activeSandbox);
    const verified = modeFiltered.filter(o => o.status === 'verified');
    const totalVolume = verified.reduce((sum, o) => sum + parseFloat(o.amount), 0);
    
    // Today's counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVerified = verified.filter(o => new Date(o.created_at) >= today);
    const todayVolume = todayVerified.reduce((sum, o) => sum + parseFloat(o.amount), 0);

    const pendingCount = modeFiltered.filter(o => o.status === 'pending').length;

    return {
      totalVolume,
      totalCount: verified.length,
      todayVolume,
      todayCount: todayVerified.length,
      pendingCount
    };
  }, [orders, profile]);

  // Compile Time-Series Data for Area Chart over last 7 days
  const chartData = useMemo(() => {
    const activeSandbox = profile?.sandbox_mode !== false;
    const modeFiltered = orders.filter(o => (o.mode === 'test') === activeSandbox);
    const verified = modeFiltered.filter(o => o.status === 'verified');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      days.push({
        date: dateStr,
        rawDate: d,
        sales: 0,
        orders: 0
      });
    }

    verified.forEach(order => {
      const orderDate = new Date(order.created_at);
      days.forEach(day => {
        const d1 = new Date(orderDate);
        d1.setHours(0, 0, 0, 0);
        const d2 = new Date(day.rawDate);
        d2.setHours(0, 0, 0, 0);
        
        if (d1.getTime() === d2.getTime()) {
          day.sales += parseFloat(order.amount);
          day.orders += 1;
        }
      });
    });

    return days.map(({ date, sales, orders }) => ({
      date,
      sales: parseFloat(sales.toFixed(2)),
      orders
    }));
  }, [orders, profile]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl z-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-base font-black text-slate-900 mt-1.5 flex items-baseline">
            <span className="text-xs font-bold text-slate-400 mr-0.5">₹</span>
            {payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">
            {payload[0].payload.orders} {payload[0].payload.orders === 1 ? 'order' : 'orders'} verified
          </p>
        </div>
      );
    }
    return null;
  };

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
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            MyMob<span className="text-blue-600 italic">Pay</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer (Razorpay Style) */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 bottom-0 top-[64px] z-30 bg-white/95 backdrop-blur-md flex flex-col pt-6 px-6 pb-6 animate-fadeIn">
            {/* Drawer Header Info */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: profile?.theme_color || '#3B82F6' }}
              >
                {profile?.business_name ? profile.business_name.charAt(0).toUpperCase() : 'B'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{profile?.business_name || 'My Business'}</p>
                <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="flex flex-col space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">Menu Navigation</p>
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'transactions', label: 'Transactions', icon: CreditCard },
                { id: 'developer', label: 'Developer API', icon: BookOpen },
                { id: 'settings', label: 'Settings', icon: Briefcase },
                { id: 'api', label: 'API Keys', icon: Key },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all border ${activeTab === tab.id ? 'bg-blue-50/60 text-blue-600 border-blue-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1"></div>

            {/* Drawer Sign Out */}
            <div className="pt-6 border-t border-slate-100">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-xs font-bold text-slate-700 shadow-sm"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header section with active tab label and sandbox toggle */}
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

              {/* Sandbox Toggle Switch */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm select-none">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${profile?.sandbox_mode !== false ? 'text-amber-600' : 'text-slate-400'}`}>
                  {profile?.sandbox_mode !== false ? 'Sandbox Mode' : 'Live Mode'}
                </span>
                <button
                  onClick={toggleSandboxMode}
                  className={`w-11 h-6 rounded-full transition-all duration-300 relative flex items-center px-1 focus:outline-none ${profile?.sandbox_mode !== false ? 'bg-amber-400 shadow-sm shadow-amber-400/20' : 'bg-slate-200'}`}
                  title="Toggle Sandbox/Live Mode"
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${profile?.sandbox_mode !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
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
                
                {/* Sandbox Mode Warning Banner */}
                {profile?.sandbox_mode !== false && (
                  <div className="p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600 border border-amber-200">
                      <AlertCircle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <strong className="text-amber-800 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">Sandbox Test Environment Active</strong>
                      <p className="text-[11px] mt-1 text-amber-600 font-semibold leading-normal">
                        All transaction data, stats, and revenue calculations displayed below are dynamic sandbox mocks. Real checkouts and bank notifications are disabled.
                      </p>
                    </div>
                  </div>
                )}
                
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

                {/* Sales Analytics Chart Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                        Sales Performance
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Daily sales volume and transaction count trends over the last 7 days.
                      </p>
                    </div>
                  </div>

                  <div className="h-[280px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={profile?.theme_color || '#3B82F6'} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={profile?.theme_color || '#3B82F6'} stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          dx={-5}
                          tickFormatter={(v) => `₹${v}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke={profile?.theme_color || '#3B82F6'} 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorSales)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
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
            {/* ═══════════════════════════════════════════════════════════
               TAB: DEVELOPER PORTAL
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'developer' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Interactive Integration Wizard Track Selector */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                      Integration Setup Wizard
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Select where you want to collect payments. We will adapt your step-by-step setup guides, credentials, and codebases in real time.
                    </p>
                  </div>
                  
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 select-none">
                    <button
                      onClick={() => setIntegrationTarget('website')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${integrationTarget === 'website' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 border border-slate-250' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Website Checkout
                    </button>
                    <button
                      onClick={() => setIntegrationTarget('mobile_app')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${integrationTarget === 'mobile_app' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 border border-slate-250' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Mobile App SDK
                    </button>
                  </div>
                </div>

                {/* Split Screen Setup wizard panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT PANE: HIGH FIDELITY SMARTPHONE CHECKOUT MOCKUP (Reacts in real time) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-between min-h-[500px]">
                    <div className="w-full">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 select-none">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Gateway Mockup Simulator
                      </h3>
                      
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Set Payload Amount (INR)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                            <input 
                              type="number"
                              value={linkAmount}
                              onChange={e => setLinkAmount(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-3 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-900"
                              placeholder="500.00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payload Note / ID</label>
                          <input 
                            type="text"
                            value={linkNote}
                            onChange={e => setLinkNote(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-900"
                            placeholder="Order_123"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Smartphone Bezel Bezel container */}
                    <div className="my-6 relative w-full max-w-[200px] bg-slate-950 border-4 border-slate-800 rounded-[28px] shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col transition-all duration-300 hover:scale-[1.02]">
                      
                      {/* Notch */}
                      <div className="absolute top-0 inset-x-0 h-3.5 flex justify-center z-30">
                        <div className="bg-slate-850 w-16 h-2.5 rounded-b-lg" />
                      </div>

                      {/* Screen Content */}
                      <div className="flex-1 bg-[#F8FAFC] pt-5 px-3 pb-3 flex flex-col justify-between font-sans text-slate-900 text-[9px] select-none">
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[6px] font-extrabold text-slate-400 px-0.5">
                            <span>12:45 PM</span>
                            <span className="flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> LTE
                            </span>
                          </div>

                          <div className="flex flex-col items-center pt-1 border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-black tracking-tight text-slate-900">
                              MyMob<span className="text-blue-600 italic">Pay</span>
                            </span>
                            <p className="text-[5px] text-slate-400 font-black uppercase tracking-wider mt-0.5">DIRECT BANK SECURE</p>
                          </div>

                          {/* Dynamic paying card details */}
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-sm space-y-1">
                            <div className="flex justify-between items-center text-[6px] text-slate-400 font-bold uppercase">
                              <span>Paying To</span>
                              <span className="text-blue-600 font-extrabold bg-blue-50 px-1 py-0.2 rounded text-[4.5px]">VERIFIED</span>
                            </div>
                            <p className="text-[8.5px] font-extrabold text-slate-900 truncate">
                              {profile?.business_name || 'Demo Store'}
                            </p>
                            <p className="text-[6px] text-slate-400 font-semibold truncate -mt-0.5">
                              UPI: {profile?.upi_id || 'pending@upi'}
                            </p>
                          </div>

                          {/* Dynamic transaction billing details */}
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-sm space-y-1">
                            <div className="flex justify-between items-center text-[6px] text-slate-400 font-bold uppercase">
                              <span>Total Due</span>
                            </div>
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-[8px] font-bold text-slate-400">₹</span>
                              <span className="text-sm font-black text-slate-900 tracking-tight leading-none">
                                {parseFloat(linkAmount) ? parseFloat(linkAmount).toFixed(2) : '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[5.5px] text-slate-450 pt-1 border-t border-slate-100 font-medium">
                              <span>Note: <span className="font-extrabold text-slate-700 truncate max-w-[70px] inline-block align-bottom">{linkNote || 'Order_123'}</span></span>
                            </div>
                          </div>

                          {/* Target specific visualizers */}
                          {integrationTarget === 'website' ? (
                            <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center space-y-1.5 relative overflow-hidden">
                              {/* QR Vector preview */}
                              <svg viewBox="0 0 100 100" className="w-12 h-12 text-slate-800" fill="currentColor">
                                <rect x="10" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                                <rect x="14" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                                <rect x="17" y="17" width="6" height="6" fill="#3B82F6" />
                                <rect x="70" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                                <rect x="74" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                                <rect x="77" y="17" width="6" height="6" fill="#3B82F6" />
                                <rect x="10" y="70" width="20" height="20" fill="#0F172A" rx="2" />
                                <rect x="14" y="74" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                                <rect x="17" y="77" width="6" height="6" fill="#3B82F6" />
                                <path d="M40,10 h6 v6 h-6 z M50,15 h8 v4 h-8 z M45,25 h10 v4 h-10 z M35,35 h8 v8 h-8 z M55,35 h12 v4 h-12 z M35,50 h12 v4 h-12 z M50,50 h6 v6 h-6 z M10,40 h8 v8 h-8 z M70,40 h8 v6 h-8 z M70,55 h12 v4 h-12 z M10,55 h6 v6 h-6 z M80,70 h10 v8 h-10 z M80,85 h8 v8 h-8 z" fill="#0F172A" />
                                <rect x="40" y="40" width="20" height="20" fill="#3B82F6" rx="3" />
                              </svg>
                              <span className="text-[5px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" /> SCAN UPI QR CODE
                              </span>
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-sm space-y-1">
                              <span className="text-[5.5px] text-slate-400 font-bold uppercase tracking-wider block">CHOOSE UPI CLIENT</span>
                              <div className="grid grid-cols-2 gap-1">
                                <div className="p-1 bg-slate-50 border border-slate-200 rounded flex items-center gap-1 cursor-pointer">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  <span className="font-extrabold text-[5px] text-slate-700">PhonePe</span>
                                </div>
                                <div className="p-1 bg-slate-50 border border-slate-200 rounded flex items-center gap-1 cursor-pointer">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  <span className="font-extrabold text-[5px] text-slate-700">GPay</span>
                                </div>
                                <div className="p-1 bg-slate-50 border border-slate-200 rounded flex items-center gap-1 cursor-pointer">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                  <span className="font-extrabold text-[5px] text-slate-700">Paytm</span>
                                </div>
                                <div className="p-1 bg-slate-50 border border-slate-200 rounded flex items-center gap-1 cursor-pointer">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                  <span className="font-extrabold text-[5px] text-slate-700">BHIM</span>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>

                        <div className="pt-2 border-t border-slate-100 text-center text-[5.5px] font-bold text-slate-400 uppercase tracking-wider">
                          🔒 256-BIT CRYPTO SECURITY
                        </div>

                      </div>

                    </div>

                    <button 
                      onClick={copyPaymentLink}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2"
                    >
                      {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
                      <span>{copiedLink ? 'Copied Checkout URL' : 'Copy Gateway URL'}</span>
                    </button>
                  </div>

                  {/* RIGHT PANE: PRE-FILLED CODE PANELS & DOCUMENTATION (Left 2 cols) */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    
                    {integrationTarget === 'website' ? (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Code className="w-5 h-5 text-blue-600" /> REST API Order Integration
                          </h3>
                          
                          {/* Code Language tabs */}
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                            {['curl', 'js', 'python'].map(lang => (
                              <button
                                key={lang}
                                onClick={() => setApiLang(lang)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${apiLang === lang ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                {lang === 'js' ? 'NodeJS' : lang}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Integration steps */}
                        <div className="space-y-4 font-medium text-slate-600 text-xs leading-relaxed">
                          
                          <div className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900">Programmatic Order POST Request</h4>
                              <p className="text-slate-500 font-semibold">
                                Dispatch an authenticated POST request from your secure backend to create a transactional order ID mapping inside the gateway database.
                              </p>
                            </div>
                          </div>

                          {/* Method path visualizer */}
                          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl select-all">
                            <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-md uppercase">POST</span>
                            <code className="font-mono text-slate-800 font-bold text-xs">https://mymob.tech/api/orders</code>
                          </div>

                          {/* Code pre-formatted block */}
                          <div className="rounded-2xl border border-slate-200 bg-[#0B0F19] overflow-hidden shadow-md">
                            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex justify-between items-center select-none">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{apiLang === 'curl' ? 'cURL Request Format' : apiLang === 'js' ? 'JavaScript Backend SDK' : 'Python Requests integration'}</span>
                              <button 
                                onClick={() => {
                                  const text = apiLang === 'curl' 
                                    ? `curl -X POST https://mymob.tech/api/orders \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${profile?.api_key ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key : 'YOUR_API_KEY'}",
    "amount": ${parseFloat(linkAmount) || 500.00},
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "note": "${linkNote || 'Order_123'}",
    "callback_url": "${profile?.webhook_url || 'https://your-server.com/api/callback'}"
  }'`
                                    : apiLang === 'js' 
                                      ? snippets.js 
                                      : snippets.python;
                                  copySnippet('apiCode', text);
                                }}
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                {copiedSnippet === 'apiCode' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedSnippet === 'apiCode' ? 'Copied' : 'Copy Code'}</span>
                              </button>
                            </div>
                            <pre className="p-4 text-[9.5px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[190px]">
                              {apiLang === 'curl' ? (
                                <code>
{`curl -X POST https://mymob.tech/api/orders \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${profile?.api_key ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key : 'YOUR_API_KEY'}",
    "amount": ${parseFloat(linkAmount) || 500.00},
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "note": "${linkNote || 'Order_123'}",
    "callback_url": "${profile?.webhook_url || 'https://your-server.com/api/callback'}"
  }'`}
                                </code>
                              ) : apiLang === 'js' ? (
                                <code>{snippets.js}</code>
                              ) : (
                                <code>{snippets.python}</code>
                              )}
                            </pre>
                          </div>

                          <div className="flex items-start gap-3 pt-2">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900">Redirect Customer to Checkout URL</h4>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                Redirect your customer&apos;s viewport to the scanning page, appending the newly created `orderId` parameter returned in Step 1:
                              </p>
                              <code className="block bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[9.5px] font-mono font-bold text-slate-700 select-all leading-normal break-all">
                                {`https://mymob.tech/pay?api_key=${profile?.api_key ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key : 'YOUR_API_KEY'}&amount=${parseFloat(linkAmount) || 500.00}&ref=YOUR_ORDER_ID`}
                              </code>
                            </div>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Mobile App Integration Track
                          </h3>
                          
                          {/* SDK language switches */}
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                            {['flutter', 'react_native'].map(sdk => (
                              <button
                                key={sdk}
                                onClick={() => setMobileSdk(sdk)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${mobileSdk === sdk ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                {sdk === 'react_native' ? 'React Native' : 'Flutter'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mobile SDK integrations */}
                        <div className="space-y-4 font-medium text-slate-600 text-xs leading-relaxed">
                          
                          <div className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900">Bypass Blocked Webview Intents</h4>
                              <p className="text-slate-500 font-semibold">
                                Sandboxed social media apps intercept standard `upi://` URLs, leading to white screen blocks. Bypass this restriction by compiling a custom Android `intent://` string template.
                              </p>
                            </div>
                          </div>

                          {/* Code pre-formatted block */}
                          <div className="rounded-2xl border border-slate-200 bg-[#0B0F19] overflow-hidden shadow-md">
                            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex justify-between items-center select-none">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{mobileSdk === 'flutter' ? 'Flutter / Dart SDK' : 'React Native Javascript Integration'}</span>
                              <button 
                                onClick={() => {
                                  const text = mobileSdk === 'flutter' 
                                    ? `// Flutter direct deep-link & webview bypass script
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MyMobPaySDK {
  final String upiId = "${profile?.upi_id || 'pending@upi'}";
  final String businessName = "${profile?.business_name || 'Demo Store'}";

  // Trigger payout intents bypassing restrictions
  Future<void> triggerNativeCheckout({required double amount, required String orderId}) async {
    final String upiUrl = "upi://pay?pa=$upiId&pn=\${Uri.encodeComponent(businessName)}&am=\$amount&cu=INR&tn=\$orderId";
    
    // Fallback Android webview package bypass intent
    final String androidIntent = "intent://pay?pa=$upiId&pn=\${Uri.encodeComponent(businessName)}&am=\$amount&cu=INR&tn=\$orderId#Intent;scheme=upi;package=in.org.npci.upiapp;end";
    
    if (await canLaunchUrl(Uri.parse(upiUrl))) {
      await launchUrl(Uri.parse(upiUrl), mode: LaunchMode.externalApplication);
    } else if (await canLaunchUrl(Uri.parse(androidIntent))) {
      await launchUrl(Uri.parse(androidIntent), mode: LaunchMode.externalApplication);
    } else {
      throw "No banking/UPI applications installed on this mobile phone.";
    }
  }

  // Poll gateway verification status
  Future<bool> verifyTransaction(String orderId) async {
    final res = await http.get(Uri.parse("https://mymob.tech/api/orders?id=\$orderId"));
    if (res.statusCode == 200) {
      return jsonDecode(res.body)['status'] == 'verified';
    }
    return false;
  }
}`
                                    : `// React Native Direct UPI deep-link & webview bypass script
import { Linking, Platform } from 'react-native';
import axios from 'axios';

const MyMobPaySDK = {
  upiId: "${profile?.upi_id || 'pending@upi'}",
  businessName: "${profile?.business_name || 'Demo Store'}",

  // Trigger direct Native UPI
  async payWithUPI(amount, orderId) {
    const rawUrl = \`upi://pay?pa=\${this.upiId}&pn=\${encodeURIComponent(this.businessName)}&am=\${amount}&cu=INR&tn=\${orderId}\`;
    
    if (Platform.OS === 'android') {
      const intentUrl = \`intent://pay?pa=\${this.upiId}&pn=\${encodeURIComponent(this.businessName)}&am=\${amount}&cu=INR&tn=\${orderId}#Intent;scheme=upi;package=in.org.npci.upiapp;end\`;
      try {
        await Linking.openURL(rawUrl);
      } catch (err) {
        // Bypass restricted webviews safely
        try {
          await Linking.openURL(intentUrl);
        } catch (e) {
          Linking.openURL("https://play.google.com/store/apps/details?id=in.org.npci.upiapp");
        }
      }
    } else {
      await Linking.openURL(rawUrl);
    }
  },

  // Recursive status polling checks
  async pollOrderStatus(orderId) {
    try {
      const res = await axios.get(\`https://mymob.tech/api/orders?id=\${orderId}\`);
      return res.data.status === 'verified';
    } catch (e) {
      console.error("Order verification polling failed:", e);
      return false;
    }
  }
};`;
                                  copySnippet('sdkCode', text);
                                }}
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                {copiedSnippet === 'sdkCode' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedSnippet === 'sdkCode' ? 'Copied' : 'Copy Code'}</span>
                              </button>
                            </div>
                            <pre className="p-4 text-[9.5px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[190px]">
                              {mobileSdk === 'flutter' ? (
                                <code>
{`// Flutter Direct Webview-Bypass deep-linking
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MyMobPaySDK {
  final String upiId = "${profile?.upi_id || 'pending@upi'}";
  final String businessName = "${profile?.business_name || 'Demo Store'}";

  // Trigger direct Deep links
  Future<void> triggerNativeCheckout({required double amount, required String orderId}) async {
    final String upiUrl = "upi://pay?pa=$upiId&pn=\${Uri.encodeComponent(businessName)}&am=\$amount&cu=INR&tn=\$orderId";
    final String androidIntent = "intent://pay?pa=$upiId&pn=\${Uri.encodeComponent(businessName)}&am=\$amount&cu=INR&tn=\$orderId#Intent;scheme=upi;package=in.org.npci.upiapp;end";
    
    if (await canLaunchUrl(Uri.parse(upiUrl))) {
      await launchUrl(Uri.parse(upiUrl), mode: LaunchMode.externalApplication);
    } else if (await canLaunchUrl(Uri.parse(androidIntent))) {
      await launchUrl(Uri.parse(androidIntent), mode: LaunchMode.externalApplication);
    } else {
      throw "No UPI payment app detected on this smartphone.";
    }
  }

  // Poll status verification endpoint
  Future<bool> verifyTransaction(String orderId) async {
    final res = await http.get(Uri.parse("https://mymob.tech/api/orders?id=\$orderId"));
    if (res.statusCode == 200) {
      return jsonDecode(res.body)['status'] == 'verified';
    }
    return false;
  }
}`}
                                </code>
                              ) : (
                                <code>
{`// React Native direct deep link & webview bypass script
import { Linking, Platform } from 'react-native';
import axios from 'axios';

const MyMobPaySDK = {
  upiId: "${profile?.upi_id || 'pending@upi'}",
  businessName: "${profile?.business_name || 'Demo Store'}",

  // Trigger native mobile payout clients
  async payWithUPI(amount, orderId) {
    const rawUrl = \`upi://pay?pa=\${this.upiId}&pn=\${encodeURIComponent(this.businessName)}&am=\${amount}&cu=INR&tn=\${orderId}\`;
    
    if (Platform.OS === 'android') {
      const intentUrl = \`intent://pay?pa=\${this.upiId}&pn=\${encodeURIComponent(this.businessName)}&am=\${amount}&cu=INR&tn=\${orderId}#Intent;scheme=upi;package=in.org.npci.upiapp;end\`;
      try {
        await Linking.openURL(rawUrl);
      } catch (err) {
        // Bypass blocked webviews safely
        try {
          await Linking.openURL(intentUrl);
        } catch (e) {
          Linking.openURL("https://play.google.com/store/apps/details?id=in.org.npci.upiapp");
        }
      }
    } else {
      await Linking.openURL(rawUrl);
    }
  },

  // Recursive status polling checks
  async checkOrderStatus(orderId) {
    try {
      const res = await axios.get(\`https://mymob.tech/api/orders?id=\${orderId}\`);
      return res.data.status === 'verified';
    } catch (e) {
      console.error("Order verification polling failed:", e);
      return false;
    }
  }
};`}
                                </code>
                              )}
                            </pre>
                          </div>

                          <div className="flex items-start gap-3 pt-2">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900">Execute Order Status Polling loop</h4>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                Query our direct order status endpoint recursively to verify client payouts dynamically.
                              </p>
                              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-[9.5px] font-mono font-bold text-slate-700">
                                <span>GET https://mymob.tech/api/orders?id=ORDER_ID</span>
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.2 rounded uppercase">FAST LOOKUP</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                    
                    {/* Security credentials footer */}
                    <div className="pt-4 border-t border-slate-100 space-y-2 mt-4 select-none">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Key className="w-4 h-4 text-blue-600" /> Outbound Signature Validations
                      </h4>
                      <p className="text-[11px] text-slate-550 font-semibold leading-normal">
                        To secure integrations, double check incoming webhook parameters using your platform API credentials and raw secrets before releasing digital assets.
                      </p>
                    </div>

                  </div>

                </div>

                {/* WEBHOOK OUTBOUND DELIVERY SIMULATOR (Bottom Card) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3 select-none">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a11 11 0 0115.658 0M2.929 7.929a17 17 0 0124.142 0" />
                        </svg>
                        Outbound Webhook Delivery Tester
                      </h3>
                      <p className="text-xs text-slate-550 font-semibold">
                        Verify your server webhook handshake by dispatching authenticated mock event payloads.
                      </p>
                    </div>

                    <button
                      onClick={handleTestWebhook}
                      disabled={testingWebhook || !profile?.webhook_url}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
                    >
                      {testingWebhook ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching HMAC Event...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Send Test Event</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Settings Config card */}
                    <div className="space-y-4 font-semibold text-xs text-slate-655 select-none">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Simulator Parameters</span>
                        
                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">Callback Endpoint</span>
                          <code className="block font-mono text-slate-800 font-bold truncate text-[10.5px]" title={profile?.webhook_url || 'Not Configured'}>
                            {profile?.webhook_url || '❌ Configure Webhook URL in Settings'}
                          </code>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">Event Model type</span>
                          <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9.5px] font-extrabold uppercase">
                            payment.verified
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">Security Cryptography</span>
                          <span className="text-slate-500 block leading-relaxed text-[10px]">
                            Outbound callbacks are cryptographically signed using your private merchant API Key. We attach the resulting HMAC hex directly to the custom header `X-MyMobPay-Signature`.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Console logger Terminal */}
                    <div className="lg:col-span-2 bg-[#060813] rounded-3xl p-5 border border-slate-800 flex flex-col justify-between shadow-lg h-[240px]">
                      
                      {/* Terminal header */}
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2 select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-mono text-slate-500 font-bold ml-2">mymobpay-webhook-tester.sh</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-600">TERMINAL OUTPUT</span>
                      </div>

                      {/* Terminal Body */}
                      <div className="flex-1 font-mono text-[9.5px] text-slate-300 overflow-y-auto space-y-2.5 leading-relaxed pr-1">
                        
                        {webhookLogs.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-1.5 select-none pt-2">
                            <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="font-bold">No webhook dispatch logs found in current session cache.</p>
                            <p className="text-[8.5px] font-semibold">Click "Send Test Event" to execute callback simulation triggers.</p>
                          </div>
                        ) : (
                          webhookLogs.map(log => (
                            <div key={log.id} className="border-b border-slate-900 pb-2.5 last:border-b-0 space-y-1.5">
                              
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500">[{log.timestamp}]</span>
                                  <span className="text-blue-450 font-bold">POST</span>
                                  <span className="text-slate-200 font-bold truncate max-w-[150px]" title={log.url}>{log.url}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${log.success ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/80 text-red-400 border border-red-900/50'}`}>
                                    {log.status ? `${log.status} ${log.statusText}` : 'FAIL'}
                                  </span>
                                  <span className="text-slate-500 font-bold">{log.latency}ms</span>
                                </div>
                              </div>

                              <div className="bg-[#0b0e1a] border border-slate-900/80 p-2.5 rounded-xl space-y-1 text-slate-400 text-[8.5px]">
                                <p><span className="text-slate-500 font-bold">Event Type:</span> payment.verified</p>
                                <p className="truncate"><span className="text-slate-500 font-bold">HMAC Signature Header:</span> <span className="text-blue-400 font-bold select-all">{log.response?.startsWith('Failed') ? 'None' : 'computed_sha256_hex'}</span></p>
                                <div className="pt-1.5 border-t border-slate-900 mt-1.5">
                                  <span className="text-slate-500 font-bold block mb-0.5">Remote Server Payout Callback Response:</span>
                                  <code className="text-slate-300 select-all whitespace-pre-wrap block bg-slate-950/50 p-1.5 rounded border border-slate-900/60 font-semibold break-all text-[8px]">
                                    {log.response || 'Empty payload response returned.'}
                                  </code>
                                </div>
                              </div>

                            </div>
                          ))
                        )}

                      </div>

                      {/* Terminal Footer */}
                      <div className="border-t border-slate-900 pt-1.5 mt-2 flex justify-between items-center text-[8px] text-slate-600 font-mono select-none">
                        <span>Simulator status: Online</span>
                        <span>Session cache size: {webhookLogs.length} attempts</span>
                      </div>

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
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: profile?.sandbox_mode !== false ? '#f59e0b' : '#2563eb' }}>
                  <Key className="w-3.5 h-3.5" /> {profile?.sandbox_mode !== false ? 'Sandbox Private API Key' : 'Live Private API Key'}
                </h3>
                <p className="text-xs text-slate-500 mb-5 font-medium">
                  {profile?.sandbox_mode !== false 
                    ? 'Use this test API key to authorize simulated checkout creations. Keep sandbox transactions isolated from real bank payouts.' 
                    : 'Use this live API key to authorize production checkout creations. Keep it secure and never share it publicly.'}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono break-all text-slate-700 font-bold">
                    {profile?.sandbox_mode !== false ? `test_${profile?.api_key || 'Loading...'}` : `live_${profile?.api_key || 'Loading...'}`}
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
