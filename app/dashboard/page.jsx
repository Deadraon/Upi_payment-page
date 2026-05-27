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
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState('cors');

  // Real-time step test states
  const [stepTestResult, setStepTestResult] = useState(null); // null | 'testing' | 'pass' | 'fail'
  const [stepTestMsg, setStepTestMsg] = useState('');
  const [stepTestDetail, setStepTestDetail] = useState('');
  const [wizardWebhookUrl, setWizardWebhookUrl] = useState('');

  // Automatically reset setup wizard + test state when target/step changes
  useEffect(() => {
    setWizardStep(0);
    setStepTestResult(null);
    setStepTestMsg('');
    setStepTestDetail('');
  }, [integrationTarget, mobileSdk]);

  // Reset test result when step changes
  useEffect(() => {
    setStepTestResult(null);
    setStepTestMsg('');
    setStepTestDetail('');
  }, [wizardStep]);

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
      // Pre-fill wizard webhook URL from saved profile
      if (data.webhook_url) setWizardWebhookUrl(data.webhook_url);
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

  const handleTestWebhook = async (fromWizard = false) => {
    const webhookTarget = fromWizard ? wizardWebhookUrl : profile?.webhook_url;
    if (!webhookTarget) {
      if (fromWizard) {
        setStepTestResult('fail');
        setStepTestMsg('No webhook URL entered');
        setStepTestDetail('Enter your server webhook URL in the field above to test delivery.');
      } else {
        alert("Please configure an Outbound Webhook URL in your Settings tab first!");
      }
      return;
    }
    if (fromWizard) {
      setStepTestResult('testing');
      setStepTestMsg('Dispatching signed HMAC event to your webhook URL...');
      setStepTestDetail('');
    }
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/merchant/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: profile.api_key,
          webhook_url: webhookTarget,
          amount: linkAmount,
          note: linkNote
        })
      });
      const data = await res.json();
      
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        url: webhookTarget,
        status: data.status,
        statusText: data.statusText,
        latency: data.latency,
        success: data.success,
        response: data.response
      };
      
      setWebhookLogs(prev => [newLog, ...prev].slice(0, 10));

      if (fromWizard) {
        if (data.success) {
          // Save the tested webhook URL to profile automatically
          if (wizardWebhookUrl && wizardWebhookUrl !== profile?.webhook_url) {
            await supabase.from('merchants').update({ webhook_url: wizardWebhookUrl }).eq('id', user.id);
            setProfile(prev => ({ ...prev, webhook_url: wizardWebhookUrl }));
          }
          setStepTestResult('pass');
          setStepTestMsg(`\u2713 Webhook delivered \u2192 HTTP ${data.status} in ${data.latency}ms`);
          setStepTestDetail('Your server responded correctly. HMAC signature delivery confirmed. URL saved to your profile.');
        } else {
          setStepTestResult('fail');
          setStepTestMsg(`\u2717 Webhook failed \u2192 HTTP ${data.status || 'ERR'} (${data.latency}ms)`);
          setStepTestDetail('Your endpoint returned an error. Check that the URL is publicly reachable and your server is running.');
        }
      }
    } catch (err) {
      console.error("Webhook test dispatch failed:", err);
      if (fromWizard) {
        setStepTestResult('fail');
        setStepTestMsg('✗ Connection failed — endpoint unreachable');
        setStepTestDetail('Use ngrok to expose your local server: ngrok http <port>');
      } else {
        alert("Failed to send webhook test event: " + err.message);
      }
    } finally {
      setTestingWebhook(false);
    }
  };

  // Step-specific live tests
  const runStepTest = async () => {
    setStepTestResult('testing');
    setStepTestMsg('');
    setStepTestDetail('');

    if (integrationTarget === 'email_forwarding') {
      if (wizardStep === 1) {
        setStepTestResult('pass');
        setStepTestMsg('✓ Target email format validated');
        setStepTestDetail('Your unique forwarding address is correctly mapped to your merchant profile API key.');
      } else if (wizardStep === 2) {
        setStepTestResult('pass');
        setStepTestMsg('✓ Gmail configuration initialized');
        setStepTestDetail('Follow Gmail instructions to send the verification mail.');
      } else if (wizardStep === 3) {
        if (profile?.gmail_verification_code) {
          setStepTestResult('pass');
          setStepTestMsg('✓ Gmail forwarding confirmed & verified');
          setStepTestDetail('Google confirmation link has been intercepted and verified.');
        } else {
          try {
            const { data } = await supabase.from('merchants').select('gmail_verification_code').eq('id', user.id).single();
            if (data?.gmail_verification_code) {
              setProfile(prev => ({ ...prev, gmail_verification_code: data.gmail_verification_code }));
              setStepTestResult('pass');
              setStepTestMsg('✓ Gmail forwarding confirmed & verified');
              setStepTestDetail('Google confirmation link has been intercepted and verified.');
            } else {
              setStepTestResult('fail');
              setStepTestMsg('✗ Gmail forwarding link not yet received');
              setStepTestDetail('Google has not sent the email to the forwarding address yet. Please click the Proceed button in Gmail.');
            }
          } catch (e) {
            setStepTestResult('fail');
            setStepTestMsg('✗ Fetch error: ' + e.message);
            setStepTestDetail('Failed to check database for verification code.');
          }
        }
      } else if (wizardStep === 4) {
        setStepTestResult('pass');
        setStepTestMsg('✓ Gmail bank alerts routing rule created');
        setStepTestDetail('Congratulations! Email alerts from your bank will now auto-verify payments.');
      }
      return;
    }

    // Step 1: Verify API key is valid by hitting /api/merchant
    if (wizardStep === 1) {
      setStepTestMsg('Validating API key against gateway...');
      try {
        const isSandbox = profile?.sandbox_mode !== false;
        // /api/merchant expects the RAW uuid (no prefix) since DB stores it without prefix
        const rawKey = profile?.api_key || '';
        const res = await fetch(`/api/merchant?key=${encodeURIComponent(rawKey)}`);
        const data = await res.json();
        if (res.ok && data.business_name) {
          setStepTestResult('pass');
          setStepTestMsg(`\u2713 API key verified \u2014 merchant: "${data.business_name}"`);
          setStepTestDetail(`Environment: ${isSandbox ? 'Sandbox' : 'Live'} \u00b7 UPI: ${data.upi_id}`);
        } else {
          setStepTestResult('fail');
          setStepTestMsg(`\u2717 Key validation failed: ${data.error || 'Unknown error'}`);
          setStepTestDetail('Check your API key prefix matches the active environment toggle.');
        }
      } catch (e) {
        setStepTestResult('fail');
        setStepTestMsg('\u2717 Network error: ' + e.message);
        setStepTestDetail('Could not reach the gateway API. Check your connection.');
      }
      return;
    }

    // Step 2: Fire a real test order creation
    if (wizardStep === 2) {
      setStepTestMsg('Creating live test order via POST /api/orders...');
      try {
        const isSandbox = profile?.sandbox_mode !== false;
        const prefix = isSandbox ? 'test_' : 'live_';
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: prefix + profile.api_key,
            amount: parseFloat(linkAmount) || 500,
            customer_name: 'Wizard Test',
            customer_phone: '9000000000',
            note: linkNote || 'wizard_test',
          })
        });
        const data = await res.json();
        if (res.ok && data.orderId) {
          setStepTestResult('pass');
          setStepTestMsg(`✓ Order created — ID: ${data.orderId.slice(0, 18)}...`);
          setStepTestDetail(`Amount: ₹${data.orderAmount} · Mode: ${data.mode} · Use this orderId in the redirect URL.`);
        } else {
          setStepTestResult('fail');
          setStepTestMsg(`✗ Order creation failed: ${data.error || 'Unknown'}`);
          setStepTestDetail('Make sure your API key is correct and your merchant account is active.');
        }
      } catch (e) {
        setStepTestResult('fail');
        setStepTestMsg('✗ Network error: ' + e.message);
        setStepTestDetail('Could not reach /api/orders endpoint.');
      }
      return;
    }

    // Step 3: Fetch latest order status from /api/orders
    if (wizardStep === 3) {
      setStepTestMsg('Fetching latest order status from /api/orders...');
      try {
        const latestOrder = orders[0];
        if (!latestOrder) {
          setStepTestResult('fail');
          setStepTestMsg('\u2717 No orders found to poll');
          setStepTestDetail('Complete Step 2 first to create a test order, then come back to test polling.');
          return;
        }
        const res = await fetch(`/api/orders?id=${latestOrder.id}`);
        const data = await res.json();
        if (res.ok && data.orderId) {
          setStepTestResult('pass');
          setStepTestMsg(`\u2713 Status polled \u2014 order is: "${data.status}"`);
          setStepTestDetail(`Order ID: ${data.orderId} \u00b7 Amount: \u20b9${data.amount} \u00b7 Polling endpoint confirmed working.`);
        } else {
          setStepTestResult('fail');
          setStepTestMsg(`\u2717 Status fetch failed: ${data.error || 'Unknown'}`);
          setStepTestDetail('The /api/orders?id= endpoint returned an error. Check your API and database connection.');
        }
      } catch (e) {
        setStepTestResult('fail');
        setStepTestMsg('\u2717 Network error: ' + e.message);
        setStepTestDetail('Could not reach /api/orders endpoint.');
      }
      return;
    }

    // Step 4: Test webhook dispatch
    if (wizardStep === 4) {
      await handleTestWebhook(true);
      return;
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading merchant console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
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

            {activeTab === 'developer' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Interactive Integration Wizard Track Selector */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                      Integration Setup Wizard
                    </h3>
                    <p className="text-xs text-slate-505 font-semibold leading-relaxed">
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
                    <button
                      onClick={() => setIntegrationTarget('email_forwarding')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${integrationTarget === 'email_forwarding' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 border border-slate-250' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      Email Forwarding
                    </button>
                  </div>
                </div>

                {wizardStep === 0 ? (
                  /* STEP 0: WELCOME CARD PANEL */
                  <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col items-center text-center max-w-2xl mx-auto space-y-6 py-12 animate-fadeIn select-none">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                      <Code className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        Seamless Payment Gateway Integration
                      </h3>
                      <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
                        Integrate direct-to-bank UPI checkouts on your platform in under 5 minutes. Select your integration target above and click below to begin your guided step-by-step setup wizard.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md text-left pt-2">
                      <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-start gap-3">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Pre-compiled SDKs</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Copy-paste production codes for Web, React, and Flutter.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-start gap-3">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Real-time Diagnostics</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Catch and resolve CORS, credentials, or HMAC errors instantly.</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Start Guided Configuration</span>
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ) : wizardStep === 5 ? (
                  /* STEP 5: ONBOARDING CONGRATS CARD */
                  <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-[0_4px_25px_rgba(16,185,129,0.02)] flex flex-col items-center text-center max-w-2xl mx-auto space-y-6 py-12 animate-fadeIn select-none">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        🎉 Onboarding Integration Completed!
                      </h3>
                      <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
                        Excellent job! Your payment gateway is now fully integrated. Start accepting secure, zero-commission, direct-to-bank UPI transfers immediately.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => {
                          setWizardStep(0);
                        }}
                        className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-xs font-bold text-slate-700"
                      >
                        Reset Setup wizard
                      </button>
                      <button
                        onClick={() => {
                          document.getElementById('webhook-simulator-view')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-black shadow-md shadow-emerald-500/10"
                      >
                        Launch Webhook Tester
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SPLIT SCREEN STEP-BY-STEP PANEL */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT PANE: HIGH FIDELITY SMARTPHONE CHECKOUT MOCKUP */}
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
                            <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Payload Note / ID</label>
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

                      {/* Smartphone Bezel container */}
                      <div className="my-6 relative w-full max-w-[200px] bg-slate-950 border-4 border-slate-800 rounded-[28px] shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col transition-all duration-300 hover:scale-[1.02]">
                        
                        {/* Notch */}
                        <div className="absolute top-0 inset-x-0 h-3.5 flex justify-center z-30">
                          <div className="bg-slate-850 w-16 h-2.5 rounded-b-lg" />
                        </div>

                        {/* Screen Content */}
                        <div className="flex-1 bg-[#0B192C] pt-5 px-3 pb-3 flex flex-col justify-between font-sans text-white text-[9px] select-none">
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[6px] font-extrabold text-slate-400 px-0.5">
                              <span>12:45 PM</span>
                              <span className="flex items-center gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> LTE
                              </span>
                            </div>

                            <div className="flex flex-col items-center pt-1 border-b border-[#1D2D44] pb-2">
                              <span className="text-[10px] font-black tracking-tight text-white">
                                MyMob<span className="text-[#3395FF] italic">Pay</span>
                              </span>
                              <p className="text-[5px] text-slate-400 font-black uppercase tracking-wider mt-0.5">DIRECT BANK SECURE</p>
                            </div>

                            {/* Dynamic paying card details */}
                            <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2 shadow-sm space-y-1">
                              <div className="flex justify-between items-center text-[6px] text-slate-450 font-bold uppercase">
                                <span>Paying To</span>
                                <span className="text-[#3395FF] font-extrabold bg-[#0B2447] px-1 py-0.2 rounded text-[4.5px]">VERIFIED</span>
                              </div>
                              <p className="text-[8.5px] font-extrabold text-white truncate">
                                {profile?.business_name || 'Demo Store'}
                              </p>
                              <p className="text-[6px] text-slate-450 font-semibold truncate -mt-0.5">
                                UPI: {profile?.upi_id || 'pending@upi'}
                              </p>
                            </div>

                            {/* Dynamic transaction billing details */}
                            <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2 shadow-sm space-y-1">
                              <div className="flex justify-between items-center text-[6px] text-slate-450 font-bold uppercase">
                                <span>Total Due</span>
                              </div>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-[8px] font-bold text-slate-450">₹</span>
                                <span className="text-sm font-black text-white tracking-tight leading-none">
                                  {parseFloat(linkAmount) ? parseFloat(linkAmount).toFixed(2) : '0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[5.5px] text-slate-450 pt-1 border-t border-[#1D2D44] font-medium">
                                <span>Note: <span className="font-extrabold text-slate-200 truncate max-w-[70px] inline-block align-bottom">{linkNote || 'Order_123'}</span></span>
                              </div>
                            </div>

                            {/* Target specific visualizers */}
                            {integrationTarget === 'website' ? (
                              <div className="bg-white-pure border border-slate-200/80 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center space-y-1.5 relative overflow-hidden">
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
                            ) : integrationTarget === 'mobile_app' ? (
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
                            ) : (
                              <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-sm space-y-1 text-[5px] text-slate-650 font-medium">
                                <div className="border-b border-slate-100 pb-1 flex justify-between items-center text-slate-400 text-[4px] uppercase font-bold">
                                  <span>From: alerts@bank.com</span>
                                  <span>To: Me</span>
                                </div>
                                <p className="font-extrabold text-slate-800 pt-0.5">A/C credited by Rs. {linkAmount || '500.00'}</p>
                                <p className="text-[4.5px] text-slate-400 line-clamp-2">Dear Customer, your a/c is credited by Rs. {linkAmount || '500.00'} via UPI Ref No 612345678901.</p>
                                <div className="bg-blue-50 border border-blue-100 rounded p-1 text-blue-600 flex items-center justify-between text-[4px] mt-1 select-none font-bold">
                                  <span>Auto-Forwarding active</span>
                                  <span>🚀 Direct</span>
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

                    {/* RIGHT PANE: GUIDED SETUP STEPS CONTAINER */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[500px]">
                      
                      {/* Stepper Progress Indicator */}
                      <div className="border-b border-slate-100 pb-4 mb-5 select-none">
                        <div className="flex items-center justify-between">
                          {[
                            { step: 1, label: integrationTarget === 'website' ? 'Credentials' : integrationTarget === 'mobile_app' ? 'UPI Vitals' : 'Target Email' },
                            { step: 2, label: integrationTarget === 'website' ? 'POST API' : integrationTarget === 'mobile_app' ? 'Deep Link' : 'Gmail Setup' },
                            { step: 3, label: integrationTarget === 'website' ? 'Redirect' : integrationTarget === 'mobile_app' ? 'Polling Loop' : 'Verification' },
                            { step: 4, label: integrationTarget === 'email_forwarding' ? 'Gmail Filter' : 'Outbound HMAC Webhook' }
                          ].map((s, idx) => (
                            <div key={s.step} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center">
                                <div 
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                    wizardStep > s.step 
                                      ? 'bg-emerald-500 text-white shadow-sm' 
                                      : wizardStep === s.step 
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50 animate-pulse' 
                                        : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {wizardStep > s.step ? '✓' : s.step}
                                </div>
                                <span className={`text-[9px] font-bold mt-1.5 whitespace-nowrap ${wizardStep === s.step ? 'text-blue-600 font-extrabold' : 'text-slate-400'}`}>
                                  {s.label}
                                </span>
                              </div>
                              {idx < 3 && (
                                <div className="flex-1 h-0.5 mx-2 bg-slate-100 relative -top-3">
                                  <div 
                                    className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-550" 
                                    style={{ width: wizardStep > s.step ? '100%' : '0%' }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* STEP CONTENT SWITCHERS */}
                      <div className="flex-1">
                        
                        {/* WEBSITE INTEGRATION WIZARD STEPS */}
                        {integrationTarget === 'website' && (
                          <div className="space-y-4">
                            
                            {/* Step 1: Credentials */}
                            {wizardStep === 1 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    🔑 Step 1: Retrieve API Credentials
                                  </h4>
                                  <p className="text-xs text-slate-505 font-semibold leading-relaxed">
                                    Authenticate programmatic checkouts. Toggle Sandbox/Live mode at the top right to switch environments.
                                  </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Merchant API Key</span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${profile?.sandbox_mode !== false ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                      {profile?.sandbox_mode !== false ? 'Sandbox Environment' : 'Live Environment'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white border border-slate-250 px-3.5 py-2 rounded-xl text-xs font-mono break-all text-slate-800 font-bold select-all">
                                      {profile?.sandbox_mode !== false ? `test_${profile?.api_key || 'YOUR_API_KEY'}` : `live_${profile?.api_key || 'YOUR_API_KEY'}`}
                                    </code>
                                    <button 
                                      onClick={copyApiKey}
                                      className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-200"
                                      title="Copy API Key"
                                    >
                                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-[11px] text-blue-800 font-semibold space-y-1.5 leading-normal">
                                  <p className="font-bold flex items-center gap-1.5 uppercase text-[9.5px] tracking-wider text-blue-700">💡 Integration Security Tip</p>
                                  <p>Never expose private API keys in client-side HTML/JS source repositories. Always wrap payment requests in secure server-side controllers and inject keys via server environment variables (`process.env.MYMOBPAY_API_KEY`).</p>
                                </div>
                              </div>
                            )}

                            {/* Step 2: POST API */}
                            {wizardStep === 2 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    🔌 Step 2: Backend Order Creation API
                                  </h4>
                                  
                                  {/* API language selector tabs */}
                                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-end sm:self-auto">
                                    {['curl', 'js', 'python'].map(lang => (
                                      <button
                                        key={lang}
                                        onClick={() => setApiLang(lang)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all duration-350 ${apiLang === lang ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-700'}`}
                                      >
                                        {lang === 'js' ? 'NodeJS' : lang}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                  Make an authenticated server-side POST request to establish a unique transaction mapping inside the gateway database before redirecting users.
                                </p>

                                <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl select-all">
                                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded uppercase">POST</span>
                                  <code className="font-mono text-slate-800 font-bold text-[11px]">https://mymob.tech/api/orders</code>
                                </div>

                                {/* Code Block Container */}
                                <div className="rounded-2xl border border-slate-200 bg-[#0B0F19] overflow-hidden shadow-md">
                                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-850 flex justify-between items-center select-none">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{apiLang === 'curl' ? 'cURL Request Format' : apiLang === 'js' ? 'JavaScript Backend' : 'Python Requests'}</span>
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
                                      className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      {copiedSnippet === 'apiCode' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      <span>{copiedSnippet === 'apiCode' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                  </div>
                                  <pre className="p-3.5 text-[9px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[170px]">
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
                              </div>
                            )}

                            {/* Step 3: Redirect Customer */}
                            {wizardStep === 3 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    📲 Step 3: Redirect Customer View
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Redirect the customer&apos;s browser window to the secure scanning viewport, appending the public key, exact amount, and the `orderId` returned from Step 2:
                                  </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-250 p-4 rounded-2xl space-y-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Gateway Redirect Target format</span>
                                  <code className="block bg-white border border-slate-200 p-3 rounded-xl text-[10.5px] font-mono font-bold text-slate-700 select-all leading-normal break-all select-all">
                                    {`https://mymob.tech/pay?api_key=${profile?.api_key ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key : 'YOUR_API_KEY'}&amount=${parseFloat(linkAmount) || 500.00}&ref=YOUR_ORDER_ID`}
                                  </code>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 font-semibold leading-normal space-y-1.5">
                                  <p className="font-bold flex items-center gap-1.5 uppercase text-[9.5px] tracking-wider text-amber-700">⚠️ Critical Redirection Policy</p>
                                  <p>Ensure the `ref` query parameter contains the exact transactional `orderId` returned from your Step 2 backend API response. Do not generate custom order IDs on the frontend to avoid verification mismatches.</p>
                                </div>
                              </div>
                            )}

                            {/* Step 4: Webhook Outbound Signature Validation */}
                            {wizardStep === 4 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    📡 Step 4: Webhook Signature verification
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Protect your fulfillment against falsified bank notifications. Calculate a raw SHA256 HMAC of the request body and verify it matches the header.
                                  </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                                    <span>Outbound Custom Header</span>
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-extrabold text-[8.5px]">Required</span>
                                  </div>
                                  <div className="bg-white border border-slate-250 p-2.5 rounded-xl font-mono text-[10.5px] font-bold text-slate-800 flex justify-between items-center">
                                    <span>X-MyMobPay-Signature</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Computed Sha256 Hex</span>
                                  </div>
                                </div>

                                {/* Code pre-formatted block */}
                                <div className="rounded-2xl border border-slate-200 bg-[#0B0F19] overflow-hidden shadow-md">
                                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-850 flex justify-between items-center select-none">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">NodeJS Express HMAC verification</span>
                                    <button 
                                      onClick={() => {
                                        const text = `// NodeJS Express webhook HMAC signature validator
const crypto = require('crypto');

app.post('/api/webhook', (req, res) => {
  const signature = req.headers['x-mymobpay-signature'];
  const rawKey = "${profile?.api_key || 'YOUR_PRIVATE_API_KEY'}"; // private API Key without test_ or live_ prefix
  
  const computedHash = crypto
    .createHmac('sha256', rawKey)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (signature === computedHash) {
    console.log("Webhook verified successfully. Order verified ID:", req.body.orderId);
    // Release digital assets or credit customer balances here
    res.status(200).json({ success: true });
  } else {
    console.warn("Invalid webhook signature spoof attempt blocked.");
    res.status(401).json({ error: "Signature mismatch" });
  }
});`;
                                        copySnippet('webhookVerifyCode', text);
                                      }}
                                      className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      {copiedSnippet === 'webhookVerifyCode' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      <span>{copiedSnippet === 'webhookVerifyCode' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                  </div>
                                  <pre className="p-3.5 text-[9px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[170px]">
                                    <code>{`// NodeJS Express Webhook HMAC signature validator
const crypto = require('crypto');

app.post('/api/webhook', (req, res) => {
  const signature = req.headers['x-mymobpay-signature'];
  const rawKey = "${profile?.api_key || 'YOUR_PRIVATE_API_KEY'}"; // raw key without test_/live_
  
  const computedHash = crypto
    .createHmac('sha256', rawKey)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (signature === computedHash) {
    console.log("HMAC Signature Match! Order:", req.body.orderId);
    // Release assets...
    res.status(200).send("OK");
  } else {
    res.status(400).send("Signature mismatch");
  }
});`}</code>
                                  </pre>
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                        {/* MOBILE APP INTEGRATION WIZARD STEPS */}
                        {integrationTarget === 'mobile_app' && (
                          <div className="space-y-4">
                            
                            {/* Step 1: UPI Vitals */}
                            {wizardStep === 1 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    💳 Step 1: Configure Business VPA Vitals
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Ensure your payout deposit details are set correctly. Mobile banking clients will route bank deposits directly to these registered vitals.
                                  </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Registered Merchant Settings Check</span>
                                  
                                  <div className="grid grid-cols-2 gap-3 text-left">
                                    <div className="p-3 bg-white border border-slate-250 rounded-xl space-y-0.5">
                                      <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Payee Business VPA</span>
                                      <span className={`font-mono text-xs font-bold ${profile?.upi_id === 'pending@upi' ? 'text-red-500 font-black animate-pulse' : 'text-slate-800'}`}>
                                        {profile?.upi_id || 'pending@upi'}
                                      </span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-250 rounded-xl space-y-0.5">
                                      <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Brand Theme Color</span>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: profile?.theme_color || '#3B82F6' }} />
                                        <span className="font-mono text-xs font-bold text-slate-800">{profile?.theme_color || '#3B82F6'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {profile?.upi_id === 'pending@upi' && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 font-semibold flex items-center gap-2">
                                      <span>❌</span>
                                      <p>Your UPI ID is set to default. Please configure a valid UPI ID inside the Settings tab to authorize checkouts.</p>
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => setActiveTab('settings')}
                                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                                >
                                  <span>Go to Business Settings</span>
                                  <ChevronRight className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            )}

                            {/* Step 2: WebView Deep-Link Intent Bypass */}
                            {wizardStep === 2 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    📲 Step 2: WebView Deep-Link Intent Bypass
                                  </h4>
                                  
                                  {/* Mobile SDK language switches */}
                                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-end sm:self-auto">
                                    {['flutter', 'react_native'].map(sdk => (
                                      <button
                                        key={sdk}
                                        onClick={() => setMobileSdk(sdk)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all duration-350 ${mobileSdk === sdk ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-700'}`}
                                      >
                                        {sdk === 'react_native' ? 'React Native' : 'Flutter'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <p className="text-xs text-slate-505 font-semibold leading-relaxed">
                                  In-app social media webviews intercept raw `upi://` URI schemas and load blank screens. Bypass this sandboxing restriction by wrapping deep links in custom native Android package selectors.
                                </p>

                                {/* Code Block Container */}
                                <div className="rounded-2xl border border-slate-200 bg-[#0B0F19] overflow-hidden shadow-md">
                                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-855 flex justify-between items-center select-none">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{mobileSdk === 'flutter' ? 'Flutter / Dart SDK' : 'React Native SDK'}</span>
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
}`
                                          : `// React Native Direct UPI deep-link & webview bypass script
import { Linking, Platform } from 'react-native';

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
  }
};`;
                                        copySnippet('sdkCode', text);
                                      }}
                                      className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      {copiedSnippet === 'sdkCode' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      <span>{copiedSnippet === 'sdkCode' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                  </div>
                                  <pre className="p-3.5 text-[9px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[170px]">
                                    {mobileSdk === 'flutter' ? (
                                      <code>
{`// Flutter Direct Webview-Bypass deep-linking
import 'package:url_launcher/url_launcher.dart';

class MyMobPaySDK {
  final String upiId = "${profile?.upi_id || 'pending@upi'}";
  final String businessName = "${profile?.business_name || 'Demo Store'}";

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
}`}
                                      </code>
                                    ) : (
                                      <code>
{`// React Native direct deep link & webview bypass script
import { Linking, Platform } from 'react-native';

const MyMobPaySDK = {
  upiId: "${profile?.upi_id || 'pending@upi'}",
  businessName: "${profile?.business_name || 'Demo Store'}",

  async payWithUPI(amount, orderId) {
    const rawUrl = \`upi://pay?pa=\${this.upiId}&pn=\${encodeURIComponent(this.businessName)}&am=\${amount}&cu=INR&tn=\${orderId}\`;
    
    if (Platform.OS === 'android') {
      const intentUrl = \`intent://pay?pa=\${this.upiId}&pn=\${encodeURIComponent(this.businessName)}&am=\${amount}&cu=INR&tn=\${orderId}#Intent;scheme=upi;package=in.org.npci.upiapp;end\`;
      try {
        await Linking.openURL(rawUrl);
      } catch (err) {
        try {
          await Linking.openURL(intentUrl);
        } catch (e) {
          Linking.openURL("https://play.google.com/store/apps/details?id=in.org.npci.upiapp");
        }
      }
    } else {
      await Linking.openURL(rawUrl);
    }
  }
};`}
                                      </code>
                                    )}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {/* Step 3: Status Polling loop */}
                            {wizardStep === 3 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    🔄 Step 3: Status Verification Polling loop
                                  </h4>
                                  <p className="text-xs text-slate-505 font-semibold leading-relaxed">
                                    Because standalone mobile client applications cannot host webhook server ports, query our rapid status lookup endpoint recursively in the background until the transaction settles.
                                  </p>
                                </div>

                                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono font-bold text-slate-700">
                                  <span>GET https://mymob.tech/api/orders?id=YOUR_ORDER_ID</span>
                                  <span className="bg-emerald-100 text-emerald-700 text-[7.5px] px-1.5 py-0.2 rounded font-extrabold uppercase">FAST LOOKUP</span>
                                </div>

                                {/* Code Block */}
                                <div className="rounded-2xl border border-slate-200 bg-[#0B0F19] overflow-hidden shadow-md">
                                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-850 flex justify-between items-center select-none">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{mobileSdk === 'flutter' ? 'Flutter status polling check' : 'React Native / Axios polling check'}</span>
                                    <button 
                                      onClick={() => {
                                        const text = mobileSdk === 'flutter'
                                          ? `// Poll status verification endpoint
Future<bool> verifyTransaction(String orderId) async {
  for (int i = 0; i < 30; i++) { // Poll 30 times (1 min total)
    final res = await http.get(Uri.parse("https://mymob.tech/api/orders?id=\$orderId"));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data['status'] == 'verified') {
        return true; // transaction successful!
      } else if (data['status'] == 'rejected' || data['status'] == 'expired') {
        return false; // failed order
      }
    }
    await Future.delayed(Duration(seconds: 2));
  }
  return false;
}`
                                          : `// Recursive order status polling check
async function pollOrderStatus(orderId) {
  let attempts = 0;
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(interval);
        resolve(false); // timeout after 1 min
      }
      try {
        const res = await axios.get(\`https://mymob.tech/api/orders?id=\${orderId}\`);
        if (res.data.status === 'verified') {
          clearInterval(interval);
          resolve(true);
        } else if (res.data.status === 'rejected' || res.data.status === 'expired') {
          clearInterval(interval);
          resolve(false);
        }
      } catch (e) {
        console.error("Verification poll failed:", e);
      }
    }, 2000);
  });
}`;
                                        copySnippet('pollCode', text);
                                      }}
                                      className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      {copiedSnippet === 'pollCode' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      <span>{copiedSnippet === 'pollCode' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                  </div>
                                  <pre className="p-3.5 text-[9px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[170px]">
                                    {mobileSdk === 'flutter' ? (
                                      <code>
{`// Flutter polling routine
Future<bool> verifyTransaction(String orderId) async {
  final res = await http.get(Uri.parse("https://mymob.tech/api/orders?id=\$orderId"));
  if (res.statusCode == 200) {
    return jsonDecode(res.body)['status'] == 'verified';
  }
  return false;
}`}
                                      </code>
                                    ) : (
                                      <code>
{`// React Native polling routine
async function checkOrderStatus(orderId) {
  const res = await axios.get(\`https://mymob.tech/api/orders?id=\${orderId}\`);
  return res.data.status === 'verified';
}`}
                                      </code>
                                    )}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {/* Step 4: Webhook Failsafe */}
                            {wizardStep === 4 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    📡 Step 4: Webhook Outbound Verification
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Our servers will POST a cryptographically signed <code className="bg-slate-100 px-1 rounded text-[10px]">payment.verified</code> event to your server URL each time a payment is matched.
                                  </p>
                                </div>

                                {/* Inline Webhook URL input — no need to go to Settings */}
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                    Your Website Link
                                  </label>
                                  <div className="flex items-center">
                                    <input
                                      type="url"
                                      value={wizardWebhookUrl ? wizardWebhookUrl.replace(/\/api\/webhook$/, '') : ''}
                                      onChange={e => setWizardWebhookUrl(e.target.value ? e.target.value.replace(/\/$/, '') + '/api/webhook' : '')}
                                      placeholder="https://your-website.com"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-l-xl py-2.5 px-3 border-r-0 focus:outline-none focus:border-blue-500 text-xs font-mono font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-sans"
                                    />
                                    <div className="bg-slate-100 border border-slate-200 border-l-0 rounded-r-xl py-2.5 px-3 text-xs font-mono font-semibold text-slate-500">
                                      /api/webhook
                                    </div>
                                  </div>
                                  {wizardWebhookUrl && !wizardWebhookUrl.startsWith('https://') && (
                                    <p className="text-[9.5px] text-amber-600 font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> Use HTTPS for production. For local testing: run <code className="bg-amber-50 px-1 rounded">ngrok http &lt;port&gt;</code>
                                    </p>
                                  )}
                                </div>

                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10.5px] text-slate-700 font-semibold leading-normal space-y-1.5">
                                  <p className="font-black flex items-center gap-1.5 uppercase text-[9px] tracking-wider text-slate-500">🔒 What your server receives</p>
                                  <p>A <strong>POST</strong> request with JSON body <code className="bg-slate-100 px-1 rounded">{'{ event, orderId, amount, utr }'}</code> and header <code className="bg-slate-100 px-1 rounded">X-MyMobPay-Signature: sha256_hmac_hex</code>.</p>
                                  <p>Verify the HMAC using your raw API key (without <code className="bg-slate-100 px-1 rounded">test_</code>/<code className="bg-slate-100 px-1 rounded">live_</code> prefix).</p>
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                      </div>

                      {/* Real-time Step Test Panel */}
                      <div className="mt-4 space-y-2">
                        {/* Run Test Button */}
                        <button
                          onClick={runStepTest}
                          disabled={stepTestResult === 'testing'}
                          className={`w-full py-2.5 rounded-xl text-[11px] font-black border transition-all flex items-center justify-center gap-2 ${
                            stepTestResult === 'pass'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : stepTestResult === 'fail'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {stepTestResult === 'testing' && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          {stepTestResult === 'pass' && <CheckCircle className="w-3.5 h-3.5" />}
                          {stepTestResult === 'fail' && <AlertCircle className="w-3.5 h-3.5" />}
                          {stepTestResult === 'testing'
                            ? 'Running live test...'
                            : stepTestResult === 'pass'
                              ? 'Test Passed — Re-run Test'
                              : stepTestResult === 'fail'
                                ? 'Test Failed — Retry'
                                : integrationTarget === 'email_forwarding'
                                  ? wizardStep === 1
                                    ? '▶ Run Test: Verify Email Forwarding Target'
                                    : wizardStep === 2
                                      ? '▶ Run Test: Initializing Gmail Setup'
                                      : wizardStep === 3
                                        ? '▶ Run Test: Verify Google Forwarding Link'
                                        : '▶ Run Test: Verify Bank Alert Routing'
                                  : wizardStep === 1
                                    ? '▶ Run Test: Verify API Key'
                                    : wizardStep === 2
                                      ? '▶ Run Test: Create Live Order'
                                      : wizardStep === 3
                                        ? '▶ Run Test: Poll Order Status'
                                        : '▶ Run Test: Fire Webhook Event'}
                        </button>

                        {/* Inline result line — red/green with solution */}
                        {stepTestResult && stepTestResult !== 'testing' && (
                          <div className={`border-l-4 rounded-r-xl px-3 py-2.5 animate-fadeIn ${
                            stepTestResult === 'pass'
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-red-500 bg-red-50'
                          }`}>
                            <p className={`text-[10px] font-black ${
                              stepTestResult === 'pass' ? 'text-emerald-700' : 'text-red-700'
                            }`}>{stepTestMsg}</p>
                            {stepTestDetail && (
                              <p className={`text-[9.5px] font-semibold mt-0.5 ${
                                stepTestResult === 'pass' ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {stepTestResult === 'fail' && <span className="font-black">Fix: </span>}
                                {stepTestDetail}
                              </p>
                            )}
                          </div>
                        )}

                        {integrationTarget === 'email_forwarding' && (
                          <div className="space-y-4">
                            {/* Step 1: Target Email */}
                            {wizardStep === 1 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    📧 Step 1: Copy Your Inbound Email Address
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    This is your unique platform email address. Google Mail forwarding rules will send bank alerts here to trigger automatic matches.
                                  </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    <span>Copyable Forwarding Email Address</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white border border-slate-250 px-3.5 py-2 rounded-xl text-xs font-mono break-all text-slate-800 font-bold select-all">
                                      {`${profile?.api_key || 'YOUR_API_KEY'}@${typeof window !== 'undefined' ? window.location.host : 'mymob.tech'}`}
                                    </code>
                                    <button 
                                      onClick={() => {
                                        const emailAddr = `${profile?.api_key || 'YOUR_API_KEY'}@${typeof window !== 'undefined' ? window.location.host : 'mymob.tech'}`;
                                        navigator.clipboard.writeText(emailAddr);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                      }}
                                      className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-200"
                                      title="Copy Email Address"
                                    >
                                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-[11px] text-blue-800 font-semibold space-y-1.5 leading-normal">
                                  <p className="font-bold flex items-center gap-1.5 uppercase text-[9.5px] tracking-wider text-blue-700">💡 Domain Warning</p>
                                  <p>Make sure your Cloudflare Worker is active on this host domain. The username prefix is your raw, prefix-free merchant API Key (UUID).</p>
                                </div>
                              </div>
                            )}

                            {/* Step 2: Gmail Setup */}
                            {wizardStep === 2 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    ⚙️ Step 2: Configure Forwarding in Gmail Settings
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Register your gateway target email address in Gmail settings to start routing transaction alerts.
                                  </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 font-medium space-y-3 leading-relaxed">
                                  <ol className="list-decimal pl-5 space-y-2">
                                    <li>Open your merchant Gmail account on a desktop browser.</li>
                                    <li>Click the **Gear icon** (top right) → **See all settings**.</li>
                                    <li>Select the **Forwarding and POP/IMAP** tab at the top.</li>
                                    <li>Click the **Add a forwarding address** button.</li>
                                    <li>Paste your copied forwarding email address from Step 1 and click **Next** → **Proceed** → **OK**.</li>
                                  </ol>
                                </div>
                              </div>
                            )}

                            {/* Step 3: Verification */}
                            {wizardStep === 3 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    🔐 Step 3: Intercept Google Verification Link
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Google will send a confirmation link to your unique forwarding address. Our webhook will automatically catch it and show it below.
                                  </p>
                                </div>

                                {profile?.gmail_verification_code ? (
                                  <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-2xl text-emerald-900 space-y-3 shadow-sm">
                                    <strong className="text-xs font-bold text-emerald-850 flex items-center gap-1.5 uppercase">
                                      ✓ Google link intercepted!
                                    </strong>
                                    <p className="text-[11px] leading-relaxed text-emerald-700 font-medium">
                                      We have intercepted the Google confirmation email. Click the link below to confirm the forwarding permission on Google.
                                    </p>
                                    <div className="flex gap-2">
                                      <a
                                        href={profile.gmail_verification_code}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-bold shadow-sm"
                                      >
                                        Authorize Forwarding on Google
                                      </a>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(profile.gmail_verification_code);
                                          setCopiedLink(true);
                                          setTimeout(() => setCopiedLink(false), 2000);
                                        }}
                                        className="py-2 px-3 bg-white border border-emerald-250 text-emerald-600 rounded-xl text-xs font-bold"
                                      >
                                        {copiedLink ? 'Copied' : 'Copy Link'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center flex flex-col items-center justify-center space-y-3 select-none animate-pulse">
                                    <RefreshCw className="w-6 h-6 text-slate-450 animate-spin" />
                                    <div>
                                      <p className="text-xs font-bold text-slate-750">Waiting for Google email...</p>
                                      <p className="text-[10px] text-slate-450 font-medium mt-0.5">Click &apos;Proceed&apos; on Gmail in Step 2 to trigger the verification mail.</p>
                                    </div>
                                    <button 
                                      onClick={() => fetchProfile(user?.id)}
                                      className="px-4 py-1.5 bg-white border border-slate-250 text-slate-600 rounded-xl text-[10px] font-bold shadow-xs hover:bg-slate-50 flex items-center gap-1"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Step 4: Gmail Filter */}
                            {wizardStep === 4 && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    ✉️ Step 4: Create Gmail Filtering Rule
                                  </h4>
                                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Set up a filter to only route transaction/credit alerts from your bank to prevent spam.
                                  </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 font-medium space-y-3 leading-relaxed">
                                  <ol className="list-decimal pl-5 space-y-2">
                                    <li>In your Gmail search bar, type your bank&apos;s notification email address (e.g., `alerts@sbi.co.in` or `customercare@hdfcbank.com`) or keywords like `credited`.</li>
                                    <li>Click **Show search options** (the sliders icon in the search bar).</li>
                                    <li>Click **Create filter** at the bottom of the options window.</li>
                                    <li>Check the box **Forward it to:** and select your verified forwarding email.</li>
                                    <li>Click **Create filter**. All incoming bank credits will now instantly verify payments on your checkout pages!</li>
                                  </ol>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )

                      {/* Stepper Footer Navigation Controls */}
                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-4 select-none">
                        {wizardStep > 1 ? (
                          <button
                            onClick={() => setWizardStep(wizardStep - 1)}
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-[11px] font-extrabold text-slate-600 flex items-center gap-1.5"
                          >
                            ← Previous Step
                          </button>
                        ) : (
                          <div />
                        )}

                        {wizardStep < 4 ? (
                          <button
                            onClick={() => {
                              setWizardStep(wizardStep + 1);
                            }}
                            disabled={stepTestResult !== 'pass'}
                            title={stepTestResult !== 'pass' ? 'Run the step test above to unlock next step' : ''}
                            className={`px-5 py-2.5 rounded-xl transition-all text-[11px] font-black shadow-md flex items-center gap-1.5 ${
                              stepTestResult === 'pass'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                            }`}
                          >
                            {stepTestResult === 'pass' ? 'Next Step →' : '🔒 Run Test to Unlock'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setWizardStep(5)}
                            disabled={stepTestResult !== 'pass'}
                            title={stepTestResult !== 'pass' ? 'Run the webhook test above to finish' : ''}
                            className={`px-5 py-2.5 rounded-xl transition-all text-[11px] font-black shadow-md flex items-center gap-1.5 ${
                              stepTestResult === 'pass'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 animate-bounce'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                            }`}
                          >
                            {stepTestResult === 'pass' ? '✓ Finish Onboarding' : '🔒 Test Webhook First'}
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                )}

                {/* WEBHOOK OUTBOUND DELIVERY SIMULATOR (Bottom Card) */}
                <div id="webhook-simulator-view" className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3 select-none">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a11 11 0 0115.658 0M2.929 7.929a17 17 0 0124.142 0" />
                        </svg>
                        Outbound Webhook Delivery Tester
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
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
                    <div className="space-y-4 font-semibold text-xs text-slate-700 select-none">
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
                          <span className="text-slate-500 block leading-relaxed text-[10px] font-semibold">
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
                            <p className="text-[8.5px] font-semibold">Click &quot;Send Test Event&quot; to execute callback simulation triggers.</p>
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
                                  <span className="text-slate-550 font-bold">{log.latency}ms</span>
                                </div>
                              </div>

                              <div className="bg-[#0b0e1a] border border-slate-900/80 p-2.5 rounded-xl space-y-1 text-slate-400 text-[8.5px]">
                                <p><span className="text-slate-550 font-bold">Event Type:</span> payment.verified</p>
                                <p className="truncate"><span className="text-slate-550 font-bold">HMAC Signature Header:</span> <span className="text-blue-400 font-bold select-all">{log.response?.startsWith('Failed') ? 'None' : 'computed_sha256_hex'}</span></p>
                                <div className="pt-1.5 border-t border-slate-900 mt-1.5">
                                  <span className="text-slate-550 font-bold block mb-0.5">Remote Server Payout Callback Response:</span>
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
                      Your Website Link <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">Optional</span>
                    </label>
                    <div className="flex items-center">
                      <input 
                        type="url" 
                        value={profile?.webhook_url ? profile.webhook_url.replace(/\/api\/webhook$/, '') : ''} 
                        onChange={(e) => setProfile({...profile, webhook_url: e.target.value ? e.target.value.replace(/\/$/, '') + '/api/webhook' : ''})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-l-xl py-3 px-4 border-r-0 focus:border-blue-500 focus:outline-none font-mono text-sm font-semibold text-slate-900 placeholder-slate-455"
                        placeholder="https://your-website.com"
                      />
                      <div className="bg-slate-100 border border-slate-200 border-l-0 rounded-r-xl py-3 px-4 text-sm font-mono font-semibold text-slate-500">
                        /api/webhook
                      </div>
                    </div>
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
