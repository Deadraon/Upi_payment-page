'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import QRCode from 'react-qr-code';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
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
  User, 
  Phone, 
  FileText,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Activity,
  Check,
  Settings,
  ShieldAlert,
  Store,
  ArrowUpRight,
  ExternalLink,
  Menu,
  X,
  Shield,
  Key,
  Mail,
  Zap,
  CheckCircle
} from 'lucide-react';

const MyMobPayLogo = ({ className = 'w-48 h-auto', textColor = '#FFFFFF' }) => (
  <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
    {/* Single unified wordmark with unique mixed fonts */}
    <text x="2" y="42" letterSpacing="0">
      {/* MyMob */}
      <tspan fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="36" fill={textColor}>MyMob</tspan>
      {/* Pay */}
      <tspan fontFamily="'Orbitron', sans-serif" fontWeight="900" fontStyle="italic" fontSize="36" fill="#3B82F6" dx="3">Pay</tspan>
    </text>
  </svg>
);

export default function AdminPage() {
  // Auth states
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab: overview, transactions, merchants, config
  const [activeTab, setActiveTab] = useState('overview');

  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database Data states
  const [orders, setOrders] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState('all');

  // Revealed keys mapping
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Manual actions on orders
  const [actionLoading, setActionLoading] = useState(null);
  const [manualUtr, setManualUtr] = useState('');
  const [utrPromptId, setUtrPromptId] = useState(null);

  // Double Security & platform config states
  const [require2fa, setRequire2fa] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [adminUpi, setAdminUpi] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [qrCodeUri, setQrCodeUri] = useState('');
  
  // Verification states
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  
  // Settings API states
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Platform Metrics
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  
  // Google User session
  const [googleUser, setGoogleUser] = useState(null);

  // Helper to dynamically build authorization headers (password vs OAuth token)
  const getAuthHeaders = useCallback(async () => {
    const headers = {};
    const savedPwd = sessionStorage.getItem('admin_pwd') || password;
    const isGoogleLoggedIn = sessionStorage.getItem('admin_google_logged_in') === 'true';

    if (isGoogleLoggedIn) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } else if (savedPwd) {
      headers['x-admin-password'] = savedPwd;
    }
    return headers;
  }, [password]);

  // Fetch Platform settings configurations
  const fetchSettings = useCallback(async () => {
    if (!isLoggedIn) return;
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/settings', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');

      setAdminUpi(data.upi_id || '');
      setTotpEnabled(data.totp_enabled || false);
      setAdminEmail(data.admin_email || '');
      setTotalEarnings(data.total_earnings || 0);
      setSubscriptionOrders(data.subscription_orders || []);
    } catch (err) {
      console.error('fetchSettings error:', err);
      setSettingsError('Could not load platform payment configurations.');
    } finally {
      setSettingsLoading(false);
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Sync auth state from session storage / Google OAuth on mount
  useEffect(() => {
    async function checkAuth() {
      // 1. Check if we have password login in session
      const savedPassword = sessionStorage.getItem('admin_pwd');
      if (savedPassword) {
        setPassword(savedPassword);
        setIsLoggedIn(true);
        return;
      }

      // 2. Check if we have Google OAuth session active
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setGoogleUser(session.user);
        
        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              provider: 'google', 
              token: session.access_token 
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            sessionStorage.setItem('admin_google_logged_in', 'true');
            setIsLoggedIn(true);
          } else {
            await supabase.auth.signOut();
            setGoogleUser(null);
            sessionStorage.removeItem('admin_google_logged_in');
          }
        } catch (e) {
          console.error('Google verification error on mount:', e);
        }
      }
    }
    
    checkAuth();
  }, []);

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

  // Fetch all registered merchants (bypassing RLS via our secure API)
  const fetchMerchants = useCallback(async () => {
    if (!isLoggedIn) return;
    setMerchantsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/merchants', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch merchants');
      setMerchants(data.merchants || []);
    } catch (err) {
      console.error('Error fetching merchants:', err);
      setError('Could not fetch merchant records from server.');
    } finally {
      setMerchantsLoading(false);
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Fetch all orders
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

  // Unified Refresh
  const handleRefreshAll = useCallback(() => {
    fetchOrders();
    fetchMerchants();
    fetchSettings();
  }, [fetchOrders, fetchMerchants, fetchSettings]);

  // Trigger fetch on login
  useEffect(() => {
    if (isLoggedIn) {
      handleRefreshAll();
      
      // Auto-refresh every 20 seconds
      const interval = setInterval(() => {
        handleRefreshAll();
      }, 20000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, handleRefreshAll]);

  // Password / TOTP submission login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password,
          totpCode: require2fa ? totpCode : undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.require2fa) {
        setRequire2fa(true);
        setAuthLoading(false);
        return;
      }

      sessionStorage.setItem('admin_pwd', password);
      setIsLoggedIn(true);
      setRequire2fa(false);
      setTotpCode('');
    } catch (err) {
      setAuthError(err.message || 'Incorrect Admin Password');
    } finally {
      setAuthLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setAuthError(err.message || 'An error occurred during Google authentication.');
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    sessionStorage.removeItem('admin_pwd');
    sessionStorage.removeItem('admin_google_logged_in');
    await supabase.auth.signOut();
    setPassword('');
    setIsLoggedIn(false);
    setRequire2fa(false);
    setTotpCode('');
    setOrders([]);
    setMerchants([]);
    setGoogleUser(null);
  };

  // Toggle Merchant subscription status
  const handleToggleSubscription = async (merchantId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          password: password || undefined,
          merchantId,
          action: 'toggleSubscription',
          status: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription status');

      // Update local state instantly
      setMerchants(prev => prev.map(m => m.id === merchantId ? data.merchant : m));
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  // Handle manual verify/reject actions on orders
  const handleOrderAction = async (orderId, action, utrVal = '') => {
    setActionLoading(orderId);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          password: password || undefined,
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

  // Trigger modal validation for settings changes
  const openVerification = (action) => {
    setPendingAction(action);
    setVerificationPassword('');
    setIsVerificationModalOpen(true);
    setSettingsError('');
    setSettingsSuccess('');
  };

  const handleVerifyAndConfirm = async (e) => {
    e.preventDefault();
    setIsVerificationModalOpen(false);
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          password: verificationPassword,
          action: pendingAction.type,
          ...pendingAction.data
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action verification failed.');

      setSettingsSuccess(data.message || 'Configurations updated successfully.');
      await fetchSettings();
      
      if (pendingAction.type === 'enable_totp') {
        setTotpSecret('');
        setTotpVerifyCode('');
      }
    } catch (err) {
      setSettingsError(err.message || 'Failed to apply setting change.');
    } finally {
      setSettingsLoading(false);
      setPendingAction(null);
      setVerificationPassword('');
    }
  };

  const handleGenerateTotpSecret = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          password: password || undefined,
          action: 'generate_totp'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate 2FA token');

      setTotpSecret(data.secret);
      const uri = `otpauth://totp/MyMobPay%20Admin?secret=${data.secret}&issuer=MyMobPay`;
      setQrCodeUri(uri);
    } catch (err) {
      setSettingsError(err.message || 'Failed to retrieve 2FA key details.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Toggle API Key visibility
  const toggleKeyVisibility = (id) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy API key to clipboard
  const handleCopyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
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

  const platformMetrics = useMemo(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const verifiedCount = orders.filter(o => o.status === 'verified').length;
    const totalVolume = orders
      .filter(o => o.status === 'verified')
      .reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const activeMerchants = merchants.filter(m => m.subscription_status === 'active').length;
    
    const today = getTodayStats();

    return {
      pendingCount,
      verifiedCount,
      totalVolume,
      activeMerchants,
      totalMerchants: merchants.length,
      today
    };
  }, [orders, merchants]);

  // Compile Platform-Wide Sales Data for Super Admin Area Chart
  const chartData = useMemo(() => {
    const verified = orders.filter(o => o.status === 'verified');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      days.push({
        date: dateStr,
        rawDate: d,
        revenue: 0,
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
          day.revenue += parseFloat(order.amount);
          day.orders += 1;
        }
      });
    });

    return days.map(({ date, revenue, orders }) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
      orders
    }));
  }, [orders]);

  const AdminCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl z-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-base font-black text-slate-900 mt-1.5 flex items-baseline">
            <span className="text-xs font-bold text-slate-400 mr-0.5">₹</span>
            {payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">
            {payload[0].payload.orders} {payload[0].payload.orders === 1 ? 'order' : 'orders'} processed
          </p>
        </div>
      );
    }
    return null;
  };

  // Compile Merchant Sales stats for Leaderboard
  const merchantLeaderboard = useMemo(() => {
    const leaderboard = merchants.map(m => {
      const merchantOrders = orders.filter(o => o.merchant_id === m.id && o.status === 'verified');
      const salesVolume = merchantOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
      return {
        id: m.id,
        businessName: m.business_name,
        upiId: m.upi_id,
        status: m.subscription_status,
        salesVolume,
        ordersCount: merchantOrders.length
      };
    });

    // Sort by sales volume descending
    return leaderboard.sort((a, b) => b.salesVolume - a.salesVolume).slice(0, 5);
  }, [merchants, orders]);

  // Filtering orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      // Merchant filter
      if (selectedMerchantFilter !== 'all' && o.merchant_id !== selectedMerchantFilter) return false;
      
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
  }, [orders, statusFilter, selectedMerchantFilter, searchQuery]);

  // Filtering merchants
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      if (merchantSearchQuery.trim()) {
        const q = merchantSearchQuery.toLowerCase().trim();
        const matchName = m.business_name?.toLowerCase().includes(q);
        const matchUpi = m.upi_id?.toLowerCase().includes(q);
        const matchId = m.id?.toLowerCase().includes(q);
        return matchName || matchUpi || matchId;
      }
      return true;
    });
  }, [merchants, merchantSearchQuery]);

  const brandColor = '#3B82F6'; // Unified Website Blue Brand Color

  if (!isLoggedIn) {
    /* LUXURY LIGHT THEME LOGIN WALL SCREEN */
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 font-sans selection:bg-blue-500/10">
        
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative space-y-7 overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600"></div>

          <div className="text-center space-y-2 flex flex-col items-center">
            <MyMobPayLogo className="w-36 h-auto" />
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">SaaS Super Admin Console</p>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
              <span className="font-semibold">{authError}</span>
            </div>
          )}

          {require2fa ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5 font-semibold text-xs text-slate-700">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Two-Factor Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Shield className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="Enter 6-digit code"
                    required
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-455 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-bold tracking-[0.2em] text-center"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-semibold text-center mt-1">Open Google Authenticator and enter the current 6-digit code.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRequire2fa(false);
                    setTotpCode('');
                  }}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold transition-all text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={authLoading || totpCode.length !== 6}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm tracking-wide bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-5 font-semibold text-xs text-slate-700">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Access Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Unlock SaaS Console</span>
                      <Unlock className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-3 flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[8px] font-extrabold uppercase tracking-widest">or double security</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google OAuth Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-55 flex items-center justify-center gap-2.5 shadow-sm text-xs"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.57h3.32c1.94,-1.78 3.05,-4.4 3.05,-7.47c0,-0.3 -0.03,-0.6 -0.08,-0.9Z" fill="#4285F4" />
                    <path d="M12,20.7c2.35,0 4.32,-0.78 5.76,-2.13l-3.32,-2.57c-0.92,0.62 -2.1,0.98 -3.44,0.98c-2.28,0 -4.21,-1.54 -4.9,-3.61H2.68v2.66c1.47,2.92 4.5,4.67 7.92,4.67Z" fill="#34A853" />
                    <path d="M7.1,13.38c-0.18,-0.52 -0.28,-1.09 -0.28,-1.68c0,-0.59 0.1,-1.16 0.28,-1.68V7.36H2.68C2.06,8.6 1.7,10.01 1.7,11.7c0,1.69 0.36,3.1 0.98,4.34l3.74,-2.91c-0.18,-0.52 -0.18,-0.75 -0.32,-1.75Z" fill="#FBBC05" />
                    <path d="M12,5.68c1.28,0 2.43,0.44 3.34,1.3l2.5,-2.5C16.31,3.07 14.34,2.7 12,2.7c-3.42,0 -6.45,1.75 -7.92,4.67l4.4,3.38C9.17,7.22 10.1,5.68 12,5.68Z" fill="#EA4335" />
                  </g>
                </svg>
                <span>SaaS Admin Google Login</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* LOGGED IN DASHBOARD */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-750 font-sans flex flex-col justify-between selection:bg-blue-500/10">
      
      {/* Top Header bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-[0_2px_15px_rgb(0,0,0,0.015)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MyMobPayLogo className="w-32 h-auto" />
                <span className="px-2 py-0.5 text-[9px] rounded bg-blue-50 text-blue-600 border border-blue-100 font-bold uppercase">SaaS OWNER</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gateway Platform Admin</p>
            </div>
          </div>

          {/* Tab Selection (Desktop Only) */}
          <nav className="hidden md:flex bg-slate-50 border border-slate-200 p-1.5 rounded-2xl gap-1">
            {[
              { id: 'overview', label: 'Platform Stats', icon: Activity },
              { id: 'transactions', label: 'Global Orders', icon: FileText },
              { id: 'merchants', label: 'Merchants (SaaS)', icon: Store },
              { id: 'config', label: 'System Config', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10' : 'text-slate-500 hover:text-slate-900 border border-transparent'}`}
                >
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons (Desktop Only) */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={handleRefreshAll}
              disabled={loading || merchantsLoading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              title="Sync Platform Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading || merchantsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors text-xs font-bold shadow-sm"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Hamburger Menu Controls (Mobile Only) */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={handleRefreshAll}
              disabled={loading || merchantsLoading}
              className="p-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors shadow-sm"
              title="Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || merchantsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-slate-900" /> : <Menu className="w-4 h-4 text-slate-950" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Slide-out overlay Navigation (Mobile Only) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-[64px] z-30 bg-white/95 backdrop-blur-xl flex flex-col pt-6 px-6 pb-8 space-y-8 animate-fadeIn">
          <div className="flex flex-col space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Navigation Menu</p>
            {[
              { id: 'overview', label: 'Platform Stats', icon: Activity },
              { id: 'transactions', label: 'Global Orders', icon: FileText },
              { id: 'merchants', label: 'Merchants (SaaS)', icon: Store },
              { id: 'config', label: 'System Config', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all border ${activeTab === tab.id ? 'bg-blue-50/60 text-blue-600 border-blue-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'}`}
                >
                  <Icon className="w-4.5 h-4.5 text-blue-600" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1"></div>

          {/* Mobile Drawer Actions */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center px-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gateway Platform Admin</span>
              <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-black uppercase">v1.1</span>
            </div>
            <button 
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all text-sm font-bold shadow-sm"
            >
              <LogOut className="w-4.5 h-4.5 text-slate-500" />
              <span>Log Out Platform</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Admin View */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* Error warning */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 1: OVERVIEW & PLATFORM LEADERBOARDS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Summary Metrics Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Platform volume */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Sales Volume</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-baseline">
                      <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                      <span>{platformMetrics.totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">{platformMetrics.verifiedCount} aggregate payments processed</p>
              </div>

              {/* Today's Sales */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today&apos;s Revenue</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-baseline">
                      <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                      <span>{platformMetrics.today.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold">+{platformMetrics.today.count} global checkouts today</p>
              </div>

              {/* Total SaaS Tenants */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Merchants</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2">{platformMetrics.totalMerchants}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Store className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">{platformMetrics.activeMerchants} active subscriptions</p>
              </div>

              {/* Awaiting Match */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Verification</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2">{platformMetrics.pendingCount}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-amber-500 font-bold animate-pulse">Pending automatic verification triggers</p>
              </div>

            </section>

            {/* Platform Performance Chart Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                    Platform Growth Curve
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Platform-wide aggregate daily sales and transaction frequency trends over the last 7 days.
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
                      <linearGradient id="colorAdminRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
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
                    <Tooltip content={<AdminCustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorAdminRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Merchant Leaderboard & Platform Health split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Leaderboard Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" /> Top Performing Merchants
                  </h4>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">SaaS STATS</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Business Name</th>
                        <th className="px-5 py-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">UPI ID Address</th>
                        <th className="px-5 py-3 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Verified Orders</th>
                        <th className="px-5 py-3 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Volume (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {merchantsLoading ? (
                        <tr>
                          <td colSpan="4" className="px-5 py-6 text-center text-xs text-slate-500">
                            Loading leaderboards...
                          </td>
                        </tr>
                      ) : merchantLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-5 py-6 text-center text-xs text-slate-500 font-medium">
                            No verified merchant sales logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        merchantLeaderboard.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : idx === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-50 text-slate-500'}`}>
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-900">{m.businessName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-medium text-slate-600">
                              {m.upiId}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-center text-slate-700">
                              {m.ordersCount}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-black text-right text-blue-600 flex items-center justify-end gap-0.5">
                              <span className="text-[10px] text-slate-400 font-bold">₹</span>
                              <span>{m.salesVolume.toFixed(2)}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform Health / Webhook Diagnostics */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-blue-600" /> Platform Services
                </h4>

                <div className="space-y-4">
                  {[
                    { name: 'Supabase Database', desc: 'Secure PostgreSQL & RLS Core', status: 'operational', val: 'Connected' },
                    { name: 'Outbound Webhooks', desc: 'Outbound merchant signatures', status: 'operational', val: 'HMAC-SHA256' },
                    { name: 'Bank Notification Hub', desc: 'Gmail IMAP parsing system', status: 'operational', val: 'Active' },
                    { name: 'Platform Billing System', desc: 'Zero-Fee billing routers', status: 'operational', val: 'Active' }
                  ].map((service, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{service.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{service.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                          ✓ {service.val}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 2: GLOBAL TRANSACTION LOGS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'transactions' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
            
            {/* Filters and Searches */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 tracking-wide">Global Transaction Logs</h2>
                  <p className="text-xs text-slate-400">Total: {filteredOrders.length} filtered checkouts • Auto-refresh active</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative max-w-xs w-full sm:ml-4">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search UTR, Customer, Note..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-950 text-xs"
                    >
                      ✕
                  </button>
                  )}
                </div>

                {/* Merchant Selector Filter */}
                <div className="relative w-full sm:w-[180px]">
                  <select
                    value={selectedMerchantFilter}
                    onChange={(e) => setSelectedMerchantFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-500 outline-none focus:border-blue-500 appearance-none font-bold cursor-pointer"
                  >
                    <option value="all">All Stores (SaaS)</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.business_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              {/* Filter by status */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {[
                  { id: 'all', label: 'All Logs' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'verified', label: 'Verified' },
                  { id: 'rejected', label: 'Rejected' },
                ].map(filt => (
                  <button
                    key={filt.id}
                    onClick={() => setStatusFilter(filt.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all flex-shrink-0 ${statusFilter === filt.id ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
                  >
                    {filt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant Store</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Note</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">UTR Reference</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading && orders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-xs text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        Fetching global transaction history...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-xs text-slate-500 font-semibold">
                        No transactions found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const localTime = new Date(order.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      });

                      // Join with merchant name on the fly
                      const merchantObj = merchants.find(m => m.id === order.merchant_id);
                      const merchantName = merchantObj ? merchantObj.business_name : 'Primary Account';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Merchant name */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-slate-400" />
                              {merchantName}
                            </span>
                          </td>

                          {/* Order ID */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-500">
                            <span 
                              className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
                              onClick={() => {
                                navigator.clipboard.writeText(order.id);
                                alert("Copied full Order ID!");
                              }}
                              title="Copy full Order ID"
                            >
                              {order.id.slice(0, 11)}
                              <Copy className="w-3 h-3 opacity-40 hover:opacity-100" />
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
                                <div className="font-bold flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{order.customer_name || 'N/A'}</span>
                                </div>
                                {order.customer_phone && (
                                  <div className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{order.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">Anonymous</span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">
                            <div className="flex items-center gap-0.5 font-extrabold text-sm">
                              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                              <span>{parseFloat(order.amount).toFixed(2)}</span>
                            </div>
                          </td>

                          {/* Note */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-bold max-w-[120px] truncate" title={order.note}>
                            {order.note || '-'}
                          </td>

                          {/* UTR */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                            {order.utr ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                  {order.utr}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(order.utr);
                                    alert("Copied UTR Reference!");
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-950 transition-colors"
                                  title="Copy UTR Reference"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                Awaiting Match
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            {order.status === 'verified' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Verified</span>
                              </span>
                            )}
                            {order.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                <span>Pending</span>
                              </span>
                            )}
                            {order.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Manual override action */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-center">
                            {order.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {utrPromptId === order.id ? (
                                  <div className="flex items-center gap-1 animate-fadeIn">
                                    <input
                                      type="text"
                                      placeholder="Enter UTR"
                                      value={manualUtr}
                                      onChange={(e) => setManualUtr(e.target.value)}
                                      className="px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900 outline-none w-[110px] font-semibold focus:border-blue-500"
                                    />
                                    <button
                                      onClick={() => handleOrderAction(order.id, 'verify', manualUtr)}
                                      disabled={actionLoading === order.id}
                                      className="p-1 text-emerald-600 hover:bg-slate-100 rounded transition-colors font-bold"
                                      title="Confirm"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setUtrPromptId(null)}
                                      className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"
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
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
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
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono font-medium truncate max-w-[100px] inline-block bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
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
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 3: MERCHANTS DIRECTORY (SaaS ACCOUNT CONTROLS)
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'merchants' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
            
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide">SaaS Registered Merchants</h2>
                <p className="text-xs text-slate-400">Total Merchants: {merchants.length} • Manage subscriptions and API keys instantly</p>
              </div>

              {/* Search Merchants */}
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-450" />
                </div>
                <input
                  type="text"
                  placeholder="Search Merchant Name, UPI..."
                  value={merchantSearchQuery}
                  onChange={(e) => setMerchantSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                />
                {merchantSearchQuery && (
                  <button
                    onClick={() => setMerchantSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-950 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Merchants List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant Profile</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business UPI ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Key (Sensitive)</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered On</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Webhook Route</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">SaaS Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {merchantsLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-xs text-slate-550">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        Fetching SaaS merchants database records...
                      </td>
                    </tr>
                  ) : filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-xs text-slate-500 font-semibold">
                        No registered merchants match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((merchant) => {
                      const regDate = new Date(merchant.created_at).toLocaleDateString('en-IN', {
                        dateStyle: 'medium'
                      });

                      const isKeyRevealed = revealedKeys[merchant.id];
                      const isKeyCopied = copiedKeyId === merchant.id;

                      return (
                        <tr key={merchant.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Business profile */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm" style={{ backgroundColor: merchant.theme_color || '#3B82F6' }}>
                                {merchant.business_name ? merchant.business_name.charAt(0).toUpperCase() : 'B'}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{merchant.business_name}</p>
                                <p className="text-[9px] font-mono text-slate-400 tracking-tight mt-0.5">{merchant.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* UPI ID */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono font-bold text-slate-800">
                            {merchant.upi_id}
                          </td>

                          {/* API Key */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 w-[180px] justify-between">
                              <span className="font-semibold text-slate-600 select-all">
                                {isKeyRevealed ? merchant.api_key : '••••-••••-••••'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleKeyVisibility(merchant.id)}
                                  className="text-slate-450 hover:text-slate-900 transition-colors"
                                  title={isKeyRevealed ? "Hide Key" : "Show Key"}
                                >
                                  {isKeyRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleCopyKey(merchant.id, merchant.api_key)}
                                  className="text-slate-450 hover:text-slate-900 transition-colors"
                                  title="Copy Key"
                                >
                                  {isKeyCopied ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-up" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Reg Date */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-500 font-semibold">
                            {regDate}
                          </td>

                          {/* Webhook Url */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono max-w-[150px] truncate" title={merchant.webhook_url || 'Not configured'}>
                            {merchant.webhook_url ? (
                              <a href={merchant.webhook_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1.5">
                                <span>{merchant.webhook_url}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>

                          {/* Sub Status */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs text-center">
                            {merchant.subscription_status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-55 text-emerald-600 border border-emerald-100">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-50 text-red-600 border border-red-100">
                                Suspended
                              </span>
                            )}
                          </td>

                          {/* Access Switch Actions */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs text-center">
                            <button
                              onClick={() => {
                                const actionStr = merchant.subscription_status === 'active' ? 'Suspend' : 'Activate';
                                if (confirm(`${actionStr} subscription for ${merchant.business_name}?`)) {
                                  handleToggleSubscription(merchant.id, merchant.subscription_status);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all ${merchant.subscription_status === 'active' ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white'}`}
                            >
                              {merchant.subscription_status === 'active' ? 'SUSPEND' : 'ACTIVATE'}
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 4: PLATFORM CONFIGURATION & DOUBLE SECURITY SETTINGS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Global Success/Error Alerts */}
            {settingsError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold">{settingsError}</span>
              </div>
            )}
            {settingsSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold">{settingsSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* UPI ID Management Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <IndianRupee className="w-4.5 h-4.5 text-blue-600" /> Platform UPI Configuration
                  </h3>
                  <span className="text-[9px] bg-slate-55 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">PAYMENTS</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Platform Subscriptions</p>
                    <p className="text-xl font-black text-slate-950 mt-1">₹{totalEarnings.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide">
                    {subscriptionOrders.length} Paid Subscriptions
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Receiving UPI ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="platform@upi"
                        value={adminUpi}
                        onChange={(e) => setAdminUpi(e.target.value)}
                        className="flex-1 bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={() => openVerification({ type: 'update_upi', data: { upi_id: adminUpi } })}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    💡 All merchant subscription payments (monthly, annual, custom term checkouts) will be dynamically routed and credited to this platform UPI ID.
                  </p>
                </div>
              </div>

              {/* Double Security (2FA & OAuth) Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-blue-600" /> Double Security & MFA
                  </h3>
                  <span className="text-[9px] bg-slate-55 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">SECURITY</span>
                </div>

                {/* Google Authenticator Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Google Authenticator (2FA)</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Require a 6-digit verification code when logging in</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${totpEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {totpEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {totpEnabled ? (
                    <button
                      onClick={() => openVerification({ type: 'disable_totp' })}
                      className="w-full py-2.5 border border-red-205 hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" /> Deactivate Authenticator 2FA
                    </button>
                  ) : (
                    <div className="space-y-4 bg-slate-50 border border-slate-150 rounded-2xl p-4">
                      {!totpSecret ? (
                        <button
                          onClick={handleGenerateTotpSecret}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Unlock className="w-4 h-4" /> Setup Authenticator 2FA
                        </button>
                      ) : (
                        <div className="flex flex-col items-center gap-3 animate-fade-up animate-duration-200">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">Scan QR in Authenticator App</p>
                          <div className="bg-white p-3 rounded-2xl border border-slate-200">
                            <QRCode value={qrCodeUri} size={130} />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-[10px] font-mono text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg select-all font-bold">
                              Key: {totpSecret}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                              Scan this QR or copy the manual key to your Google/Microsoft Authenticator.
                            </p>
                          </div>
                          <div className="w-full space-y-2 pt-2 border-t border-slate-200 flex flex-col items-stretch text-xs">
                            <input
                              type="text"
                              maxLength="6"
                              placeholder="Enter 6-digit verify code"
                              value={totpVerifyCode}
                              onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2 text-center font-bold tracking-[0.2em]"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setTotpSecret('')}
                                className="w-1/3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={totpVerifyCode.length !== 6}
                                onClick={() => openVerification({ 
                                  type: 'enable_totp', 
                                  data: { secret: totpSecret, code: totpVerifyCode } 
                                })}
                                className="flex-grow py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                              >
                                Confirm & Activate
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-105 pt-4 space-y-3 font-semibold text-xs text-slate-705">
                  {/* Google OAuth Config */}
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Google OAuth Admin Email(s)</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Authorizes specific Google accounts or prefixes (separated by commas) for console access</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. chauhankuna, deadraon@"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>
                      <button
                        onClick={() => openVerification({ type: 'update_email', data: { admin_email: adminEmail } })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Platform Subscriptions Ledger */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-blue-600" /> Subscription Payments Ledger
                </h3>
                <span className="text-[9px] bg-slate-55 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">LEDGER</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs font-semibold text-slate-700">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left">Order ID</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Subscriber Reference</th>
                      <th className="px-5 py-3 text-left">Billing Term</th>
                      <th className="px-5 py-3 text-right">Amount (INR)</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-xs">
                    {settingsLoading ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-6 text-center text-slate-450">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" /> Loading payment logs...
                        </td>
                      </tr>
                    ) : subscriptionOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-6 text-center text-slate-450">
                          No subscription renewals recorded on this platform.
                        </td>
                      </tr>
                    ) : (
                      subscriptionOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-slate-900">{order.id}</td>
                          <td className="px-5 py-3 text-slate-500">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </td>
                          <td className="px-5 py-3 font-mono text-[10px] text-slate-400" title={order.external_ref}>
                            {order.external_ref ? order.external_ref.slice(0, 18) + '...' : '—'}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              {order.note || 'Subscription'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-slate-900">
                            ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Original variables and diagnostics split row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Variable Health */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Platform Key Credentials
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'NEXT_PUBLIC_SUPABASE_URL', status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Active' : 'Missing' },
                    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Active' : 'Missing' },
                    { name: 'ADMIN_PASSWORD', status: 'Active (Protected)' },
                    { name: 'SUPABASE_SERVICE_KEY', status: 'Active (RLS Bypassed)' }
                  ].map((env, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0 text-xs">
                      <span className="font-mono text-slate-500 font-bold">{env.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${env.status.includes('Missing') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-105'}`}>
                        {env.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DLT Configuration */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> TRAI DLT Templates Configuration
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-start py-2 border-b border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">SMS Webhook Listener</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Listens for notifications from bank forwarders</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-500">
                      /api/webhook/sms
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Email Webhook Listener</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Receives transactional bank alerts via Cloudflare</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-500">
                      /api/webhook/email
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Password Verification Modal */}
        {isVerificationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6 animate-scale-up relative">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
              
              <div className="flex items-center gap-3 text-amber-600">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Authorize Platform Change</h3>
              </div>
              
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                You are modifying sensitive platform-wide payment or credentials settings. Please re-enter the admin access password to authorize this action.
              </p>
              
              <form onSubmit={handleVerifyAndConfirm} className="space-y-5 font-semibold text-xs text-slate-700">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Admin Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    required
                    value={verificationPassword}
                    onChange={(e) => setVerificationPassword(e.target.value)}
                    className="w-full bg-white border border-slate-350 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-semibold"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerificationModalOpen(false);
                      setPendingAction(null);
                      setVerificationPassword('');
                    }}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    Verify & Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-slate-400 border-t border-slate-200 bg-[#070b13]/85 mt-10" style={{ backgroundColor: '#ffffff' }}>
        <p>&copy; 2026 {CONFIG.businessName} SaaS Gateway Platform. All rights reserved.</p>
        <p className="mt-1 text-[9px] text-slate-500">Protected Dashboard • Session ID: {Math.floor(1000000000 + Math.random() * 9000000000)}</p>
      </footer>

    </div>
  );
}
