'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'react-qr-code';
import {
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Clock,
  ShieldCheck,
  Sparkles,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CheckCircle,
  MessageCircle,
  ChevronDown,
  X,
  Share2,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  Zap,
  QrCode as QrIcon,
  RotateCcw
} from 'lucide-react';

// No default starter links — only show links the merchant actually created
const DEFAULT_INITIAL_LINKS = [];

export default function PaymentLinksRedesign({
  profile = {},
  orders = [],
  payLinkHistory = [],
  setPayLinkHistory,
  setActiveTab,
}) {
  // Form input states
  const [amount, setAmount] = useState('2499.00');
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'
  const [purpose, setPurpose] = useState('Software Consulting Retainer / Q1 Sprint');
  const [refCode, setRefCode] = useState('REF-84920');
  const [customerName, setCustomerName] = useState('Rohan Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [customerContact, setCustomerContact] = useState('+91 98765 43210');
  const [allowPartial, setAllowPartial] = useState(false);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [railUpi, setRailUpi] = useState(true);
  const [railImps, setRailImps] = useState(true);
  const [railCrypto, setRailCrypto] = useState(false);
  const [linkValidity, setLinkValidity] = useState('7d');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active generated preview link (null until user clicks generate)
  const [activeUrl, setActiveUrl] = useState('');
  const [activeLinkId, setActiveLinkId] = useState('');
  const [generatedLinkData, setGeneratedLinkData] = useState(null);

  // Filter and Search states
  const [statusFilter, setStatusFilter] = useState('All'); // All, Paid, Pending, Expired
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Container ref for smooth scroll
  const createPanelRef = useRef(null);

  // Show Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Seed sample links if payLinkHistory is empty
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mymobpay_payment_links');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (setPayLinkHistory) setPayLinkHistory(parsed);
            return;
          }
        } catch (e) {
          console.error('Error parsing stored payment links', e);
        }
      }
      // If none, initialize with default initial links
      if (setPayLinkHistory) {
        setPayLinkHistory(DEFAULT_INITIAL_LINKS);
        localStorage.setItem('mymobpay_payment_links', JSON.stringify(DEFAULT_INITIAL_LINKS));
      }
    }
  }, [setPayLinkHistory]);

  // Combine custom history with initial default links if needed
  const allLinks = useMemo(() => {
    const list = Array.isArray(payLinkHistory) && payLinkHistory.length > 0
      ? payLinkHistory
      : DEFAULT_INITIAL_LINKS;

    // Harmonize status with real database orders if matching
    return list.map((item) => {
      const matchingOrder = orders.find(
        (o) =>
          o.external_ref === item.id ||
          o.external_ref?.startsWith(item.id + ':') ||
          (o.note && item.purpose && o.note === item.purpose)
      );

      if (matchingOrder) {
        if (matchingOrder.status === 'verified') return { ...item, status: 'Paid' };
        if (matchingOrder.status === 'failed') return { ...item, status: 'Expired' };
      }
      return item;
    });
  }, [payLinkHistory, orders]);

  // Expose global preview update helpers for compatibility with mock script
  useEffect(() => {
    window.updateLinkPreview = () => {
      const amtEl = document.getElementById('input-amount');
      const purEl = document.getElementById('input-purpose');
      const refEl = document.getElementById('input-ref');

      const amtVal = amtEl?.value || '0.00';
      const purVal = purEl?.value || 'Direct Payment';
      const refVal = refEl?.value || 'REF-GEN';

      const numAmt = parseFloat(amtVal);
      const formatted = isNaN(numAmt)
        ? '₹ 0.00'
        : '₹ ' + numAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const prevAmtEl = document.getElementById('preview-amount');
      const prevPurEl = document.getElementById('preview-purpose');
      const prevRefEl = document.getElementById('preview-ref');

      if (prevAmtEl) prevAmtEl.innerText = formatted;
      if (prevPurEl) prevPurEl.innerText = purVal;
      if (prevRefEl) prevRefEl.innerText = refVal;
    };

    window.generateMockLink = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let rand = '';
      for (let i = 0; i < 8; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const host = typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech';
      const mockAmt = amount ? parseFloat(amount) : 100;
      const mockPur = purpose.trim() || 'Payment for Services';
      const mockRef = refCode.trim() || `REF-${Math.floor(1000 + Math.random() * 9000)}`;
      const newUrl = `${host}/pay?order_id=MOCK${rand.slice(0, 4)}&amount=${mockAmt.toFixed(2)}&ref=${mockRef}`;
      
      setActiveUrl(newUrl);
      setActiveLinkId('pl_' + rand);
      setGeneratedLinkData({
        url: newUrl,
        id: 'pl_' + rand,
        orderId: 'MOCK' + rand.slice(0, 4),
        amount: mockAmt,
        purpose: mockPur,
        ref: mockRef,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });
      showToast('Quick demo payment link generated!');
    };
  }, []);

  // Filter links based on status tab and search query
  const filteredLinks = useMemo(() => {
    return allLinks.filter((link) => {
      // Status filter
      if (statusFilter === 'Paid' && link.status !== 'Paid') return false;
      if (statusFilter === 'Pending' && link.status !== 'Pending' && link.status !== 'Partial') return false;
      if (statusFilter === 'Expired' && link.status !== 'Expired') return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesId = link.id?.toLowerCase().includes(q);
        const matchesPurpose = link.purpose?.toLowerCase().includes(q);
        const matchesCustomer = link.customerName?.toLowerCase().includes(q) || link.customerPhone?.toLowerCase().includes(q);
        const matchesRef = link.ref?.toLowerCase().includes(q);
        const matchesAmt = link.amount?.toString().includes(q);
        if (!matchesId && !matchesPurpose && !matchesCustomer && !matchesRef && !matchesAmt) {
          return false;
        }
      }
      return true;
    });
  }, [allLinks, statusFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage) || 1;
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLinks.slice(start, start + itemsPerPage);
  }, [filteredLinks, currentPage]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    let totalAmt = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    allLinks.forEach((l) => {
      const amt = parseFloat(l.amount) || 0;
      if (l.status === 'Paid') {
        totalAmt += amt;
        paidCount++;
      } else if (l.status === 'Pending' || l.status === 'Partial') {
        pendingCount++;
      } else if (l.status === 'Expired') {
        expiredCount++;
      }
    });

    const totalLinks = paidCount + pendingCount + expiredCount;
    const avgTicket = paidCount > 0 ? Math.round(totalAmt / paidCount) : 0;
    const conversionRate = totalLinks > 0
      ? ((paidCount / totalLinks) * 100).toFixed(1)
      : '0.0';

    return {
      totalCollected: totalAmt,
      totalCount: paidCount,
      activeLinks: pendingCount,
      paidLinks: paidCount,
      expiredLinks: expiredCount,
      avgTicket,
      conversionRate,
    };
  }, [allLinks]);

  // Generate a random Reference Code if empty
  const handleRandomRef = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const prefixes = ['REF-CH', 'APX', 'PO-BL', 'TX-USDT', 'RET-CON', 'INV-MM'];
    const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];
    setRefCode(`${pfx}-${num}`);
  };

  // Copy to clipboard helper
  const copyText = (text, label = 'Link') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Share via WhatsApp
  const shareWhatsApp = (link) => {
    const text = encodeURIComponent(
      `Hello ${link.customerName || 'there'},\n\nPlease complete your payment of ₹${parseFloat(link.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for "${link.purpose}".\n\nDirect Payment Link: ${link.url}\n\nProcessed instantly via MyMobPay NPCI T+0 Direct Rails.`
    );
    const phone = link.customerPhone?.replace(/[^0-9]/g, '');
    const waUrl = phone && phone.length >= 10
      ? `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  // Handle Create Payment Link
  const handleCreateLink = async (e) => {
    if (e) e.preventDefault();
    setIsGenerating(true);

    const linkId = 'pl_' + Math.random().toString(36).substring(2, 10);
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech';
    const effectiveAmount = amount ? parseFloat(amount) : null;
    const effectivePurpose = purpose.trim() || 'Payment for Services';
    const effectiveRef = refCode.trim() || `REF-${Math.floor(1000 + Math.random() * 9000)}`;

    let generatedUrl = '';
    let dbOrderId = '';

    // Attempt real database order creation if amount is positive
    if (effectiveAmount && effectiveAmount > 0) {
      try {
        const apiKey = profile?.api_key
          ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key
          : 'live_mymob_demo_key';

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            amount: effectiveAmount,
            note: effectivePurpose,
            customer_name: customerName || '',
            customer_phone: customerPhone || '',
            external_ref: linkId,
            project: profile?.business_name || 'MyMobPay Merchant',
            method: 'LINK',
          }),
        });

        const data = await res.json();
        if (res.ok && data?.orderId) {
          dbOrderId = data.orderId;
          const params = new URLSearchParams();
          params.set('order_id', data.orderId);
          params.set('key', apiKey);
          params.set('amount', effectiveAmount.toFixed(2));
          if (effectiveRef) params.set('ref', effectiveRef);
          generatedUrl = `${host}/pay?${params.toString()}`;
        }
      } catch (err) {
        console.warn('API order pre-generation skipped, falling back to dynamic link', err);
      }
    }

    if (!generatedUrl) {
      const params = new URLSearchParams();
      if (profile?.api_key) params.set('key', profile.api_key);
      if (effectiveAmount) params.set('amount', effectiveAmount.toFixed(2));
      params.set('note', effectivePurpose);
      params.set('lid', linkId);
      if (effectiveRef) params.set('ref', effectiveRef);
      if (customerName) params.set('name', customerName);
      if (customerPhone) params.set('phone', customerPhone);
      generatedUrl = `${host}/pay?${params.toString()}`;
    }

    const newLink = {
      id: linkId,
      orderId: dbOrderId || null,
      purpose: effectivePurpose,
      ref: effectiveRef,
      customerName: customerName.trim() || 'Direct Customer',
      customerPhone: customerPhone.trim() || '--',
      amount: effectiveAmount ? effectiveAmount.toFixed(2) : 'Flexible',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      url: generatedUrl,
    };

    const updated = [newLink, ...allLinks];
    if (setPayLinkHistory) setPayLinkHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mymobpay_payment_links', JSON.stringify(updated));
    }

    setActiveUrl(generatedUrl);
    setActiveLinkId(linkId);
    setGeneratedLinkData({
      url: generatedUrl,
      id: linkId,
      orderId: dbOrderId || linkId,
      amount: effectiveAmount,
      purpose: effectivePurpose,
      ref: effectiveRef,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    });
    setIsGenerating(false);

    showToast('Payment link generated successfully! Ready to dispatch.');

    // Update DOM preview element if present
    const prevUrl = document.getElementById('preview-url');
    if (prevUrl) prevUrl.innerText = generatedUrl;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLinks.length === 0) {
      showToast('No payment links to export');
      return;
    }

    const headers = ['Link ID', 'Purpose', 'Reference', 'Customer Name', 'Contact', 'Amount (INR)', 'Status', 'Created Date', 'Payment URL'];
    const rows = filteredLinks.map((l) => [
      l.id,
      `"${(l.purpose || '').replace(/"/g, '""')}"`,
      l.ref || '',
      `"${(l.customerName || '').replace(/"/g, '""')}"`,
      l.customerPhone || '',
      l.amount,
      l.status,
      new Date(l.createdAt).toLocaleString('en-IN'),
      l.url,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mymobpay_payment_links_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment links exported successfully');
  };

  // Refresh data handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Payment links status refreshed');
    }, 600);
  };

  // Delete Link
  const handleDeleteLink = (id) => {
    const updated = allLinks.filter((item) => item.id !== id);
    if (setPayLinkHistory) setPayLinkHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mymobpay_payment_links', JSON.stringify(updated));
    }
    showToast('Payment link deleted');
  };

  // Computed preview values
  const previewAmountFormatted = useMemo(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return '₹ 0.00';
    return '₹ ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [amount]);

  const previewPurposeFormatted = purpose.trim() || 'Direct Payment';
  const previewRefFormatted = refCode.trim() || 'REF-GEN';

  const destBank = profile?.bank_name || profile?.settlement_bank || 'ICICI';
  const accNum = profile?.account_number || profile?.bank_account_number || '4092';
  const lastFour = accNum ? String(accNum).slice(-4) : '4092';

  const previewUrlDynamic = useMemo(() => {
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech';
    const cleanRef = refCode.trim() || '84920';
    return `${host}/pay/pl_${cleanRef.toLowerCase().replace(/[^a-z0-9]/g, '') || '84920'}`;
  }, [refCode]);

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto w-full animate-fade-in text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          HEADER BLOCK
          ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Links</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-slate-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Direct Rails T+0
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Create, manage, and track instant payment links for your customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium active:scale-[0.98]"
            type="button"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setShowCreateModal((prev) => !prev);
              if (!showCreateModal) {
                setTimeout(() => {
                  createPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all text-sm font-semibold active:scale-[0.98]"
            type="button"
          >
            <Plus className="w-4 h-4" />
            {showCreateModal ? 'Close Generator' : 'Create Payment Link'}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SUMMARY KPI CARDS
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Collected */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Total Collected
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-2xl text-slate-900 tracking-tight font-bold">
              ₹ {metrics.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {metrics.totalCount > 0 ? `Across ${metrics.totalCount} paid link${metrics.totalCount !== 1 ? 's' : ''}` : 'No payments yet'}
            </span>
          </div>
        </div>

        {/* Card 2: Active Links */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Active Links
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-2xl text-slate-900 tracking-tight font-bold">
              {metrics.activeLinks}
            </span>
            <span className="text-xs text-slate-500 mt-1">Awaiting customer payment</span>
          </div>
        </div>

        {/* Card 3: Paid Links */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Paid Links
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-2xl text-slate-900 tracking-tight font-bold">
              {metrics.paidLinks}
            </span>
            <span className="text-xs text-emerald-600 font-medium mt-1">
              {metrics.conversionRate}% Conversion rate
            </span>
          </div>
        </div>

        {/* Card 4: Average Ticket */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Average Ticket
            </span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-2xl text-slate-900 tracking-tight font-bold">
              {metrics.avgTicket > 0 ? `₹ ${metrics.avgTicket.toLocaleString('en-IN')}` : '—'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {metrics.paidLinks > 0 ? 'Per successful payment' : 'No paid links yet'}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MASTER PAYMENT LINK CONSOLE (IMAGE 2 DESIGN)
          ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div ref={createPanelRef} className="w-full flex justify-center py-4 bg-slate-100 bg-dot-pattern rounded-2xl border border-slate-200/80 shadow-xs animate-fade-up">
          {/* BEGIN: MasterPaymentLinkConsole */}
          <main
            className="w-full max-w-4xl bg-white border border-[#cbd5e1] rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden font-sans"
            style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
            data-purpose="payment-generator-card"
          >
            {/* BEGIN: ConsoleHeader */}
            <header
              className="border-b border-slate-800 bg-[#0f172a] px-5 py-4 text-white"
              style={{ backgroundColor: '#0f172a' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Status & Title */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse"></span>
                      {profile?.sandbox_mode !== false ? 'Test Rail' : 'Live Rail'}
                    </span>
                    <span className="text-xs font-mono text-slate-400 tracking-wide uppercase">Direct-to-Bank Engine</span>
                  </div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    CREATE INSTANT PAYMENT LINK
                    <span className="text-slate-500 font-mono text-xs font-normal">{'// PROTOCOL v2.4'}</span>
                  </h1>
                </div>
                {/* Right: Destination Route Badge & Escrow Micro-Badge */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[11px] font-mono text-slate-400 leading-none">DESTINATION A/C</span>
                    <span className="text-xs font-mono font-medium text-slate-200 mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-blue-400 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                        <path clipRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" fillRule="evenodd"></path>
                      </svg>
                      {destBank} •••• {lastFour}
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                    0% ESCROW HOLD
                  </span>
                </div>
              </div>
              {/* Settlement Guarantee Subtext Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-mono">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  Direct T+0 Passthrough: Zero intermediate ledger holding. Funds credited to account instantly.
                </p>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">NPCI SWITCH CONNECTED</span>
              </div>
            </header>
            {/* END: ConsoleHeader */}

            {/* BEGIN: FormBody */}
            <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ backgroundColor: '#ffffff' }}>
              {/* BEGIN: LeftColumn (Amount & Details) */}
              <section aria-labelledby="section-amount-details" className="lg:col-span-7 space-y-5">
                <h2 className="sr-only" id="section-amount-details">Payment Details and Customer Information</h2>

                {/* Monetary Input Card */}
                <div
                  className="rounded-lg p-4 shadow-sm border border-[#cbd5e1]"
                  style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
                  data-purpose="amount-panel"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono font-bold tracking-wider uppercase text-slate-600" htmlFor="payment-amount">
                      Amount &amp; Denomination
                    </label>
                    <div
                      className="flex items-center gap-1 border border-[#cbd5e1] rounded px-1.5 py-0.5 text-xs font-mono text-slate-700"
                      style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                    >
                      <button
                        type="button"
                        onClick={() => setCurrency('INR')}
                        className={`px-1 py-0.5 rounded transition-colors ${currency === 'INR' ? 'font-bold text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        INR (₹)
                      </button>
                      <span className="text-slate-400">|</span>
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`px-1 py-0.5 rounded transition-colors ${currency === 'USD' ? 'font-bold text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>

                  {/* Numeric Hero Input */}
                  <div
                    className="relative rounded-md shadow-sm border border-[#cbd5e1] focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600"
                    style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                  >
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-xl sm:text-2xl font-bold font-mono text-slate-500">
                        {currency === 'USD' ? '$' : '₹'}
                      </span>
                    </div>
                    <input
                      className="block w-full rounded-md border-0 py-2.5 pl-9 pr-14 text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums focus:ring-0 sm:leading-8 placeholder-slate-400 outline-none"
                      style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                      id="payment-amount"
                      name="amount"
                      placeholder="0.00"
                      type="number"
                      step="any"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        0% MDR
                      </span>
                    </div>
                  </div>

                  {/* Quick Denomination Increments */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-600 mr-1 font-semibold">Quick Add:</span>
                    {[
                      { label: '+₹500', val: 500, isBlue: false },
                      { label: '+₹1,000', val: 1000, isBlue: false },
                      { label: '+₹2,500', val: 2500, isBlue: true },
                      { label: '+₹5,000', val: 5000, isBlue: false },
                      { label: '+₹10,000', val: 10000, isBlue: false },
                    ].map((inc) => (
                      <button
                        key={inc.val}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(amount) || 0;
                          setAmount((curr + inc.val).toFixed(2));
                        }}
                        className={`px-2 py-1 border rounded text-xs font-mono transition shadow-2xs cursor-pointer ${
                          inc.isBlue
                            ? 'bg-blue-50/80 border-blue-300 font-bold text-blue-700 hover:bg-blue-100'
                            : 'bg-white hover:bg-slate-100 active:bg-slate-200 border-[#cbd5e1] font-medium text-slate-700 hover:border-slate-400'
                        }`}
                        style={{
                          backgroundColor: inc.isBlue ? 'rgba(239, 246, 255, 0.8)' : '#ffffff',
                          borderColor: inc.isBlue ? '#93c5fd' : '#cbd5e1',
                          color: inc.isBlue ? '#1d4ed8' : '#334155',
                        }}
                      >
                        {currency === 'USD' ? `+$${inc.val}` : inc.label}
                      </button>
                    ))}
                  </div>

                  {/* Partial Payments Option */}
                  <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between">
                    <label className="inline-flex items-center text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        className="h-3.5 w-3.5 rounded border-[#cbd5e1] text-blue-600 focus:ring-blue-500"
                        type="checkbox"
                        checked={allowPartial}
                        onChange={(e) => setAllowPartial(e.target.checked)}
                      />
                      <span className="ml-2 font-mono text-[11px] text-slate-600">Allow customer partial payments or custom installments</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Optional</span>
                  </div>
                </div>

                {/* Purpose & Internal Ref Compact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3" data-purpose="metadata-fields">
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1" htmlFor="payment-purpose">
                      Purpose / Description <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className="w-full text-xs font-sans rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs placeholder-slate-400 py-2 px-3 outline-none border border-[#cbd5e1]"
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      id="payment-purpose"
                      name="purpose"
                      placeholder="e.g. Design Invoice #1029"
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600" htmlFor="internal-ref">
                        Internal Ref / Order ID
                      </label>
                      <button
                        type="button"
                        onClick={handleRandomRef}
                        className="text-[10px] font-mono text-blue-600 hover:text-blue-800 transition font-medium"
                      >
                        ⚡ Auto-Gen
                      </button>
                    </div>
                    <input
                      className="w-full text-xs font-mono uppercase rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs placeholder-slate-400 py-2 px-3 outline-none border border-[#cbd5e1]"
                      style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}
                      id="internal-ref"
                      name="internal_ref"
                      placeholder="REF-XXXX"
                      type="text"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                {/* Customer Notification Details Box */}
                <div
                  className="rounded-lg p-3.5 space-y-3 border border-[#cbd5e1]"
                  style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                  data-purpose="customer-info-box"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                      Customer Contact Details
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Instant notification &amp; receipt
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1" htmlFor="customer-name">Customer Name</label>
                      <input
                        className="w-full text-xs rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-1.5 px-2.5 outline-none border border-[#cbd5e1]"
                        style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                        id="customer-name"
                        placeholder="Full name"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1" htmlFor="customer-contact">Phone or Email</label>
                      <input
                        className="w-full text-xs font-mono rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-1.5 px-2.5 outline-none border border-[#cbd5e1]"
                        style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                        id="customer-contact"
                        placeholder="+91 or name@domain.com"
                        type="text"
                        value={customerContact}
                        onChange={(e) => {
                          setCustomerContact(e.target.value);
                          setCustomerPhone(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  {/* Instant Trigger Flags */}
                  <div className="pt-2 border-t border-[#f1f5f9] flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={notifySms}
                        onChange={(e) => setNotifySms(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[#cbd5e1] text-blue-600 focus:ring-blue-500"
                      />
                      <span>Notify via SMS</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={notifyWhatsapp}
                        onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[#cbd5e1] text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="flex items-center gap-1 text-slate-800 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        Send WhatsApp link
                      </span>
                    </label>
                  </div>
                </div>
              </section>
              {/* END: LeftColumn */}

              {/* BEGIN: RightColumn (Accepted Rails & Generation) */}
              <section aria-labelledby="section-rails-output" className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <h2 className="sr-only" id="section-rails-output">Accepted Payment Rails and Live Link Action</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">Accepted Rails</label>
                    <span className="text-[10px] font-mono text-slate-400">SELECT MULTIPLE</span>
                  </div>

                  {/* Rail A: UPI QR (Enabled) */}
                  <label
                    className={`flex items-start justify-between p-3 rounded-lg border-2 cursor-pointer shadow-xs transition ${
                      railUpi
                        ? 'border-blue-600 bg-blue-50/40 hover:bg-blue-50/70'
                        : 'border-[#cbd5e1] bg-white hover:border-slate-400 opacity-80'
                    }`}
                    style={{ backgroundColor: railUpi ? 'rgba(239, 246, 255, 0.5)' : '#ffffff' }}
                    data-purpose="rail-bento-upi"
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={railUpi}
                        onChange={(e) => setRailUpi(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-blue-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 tracking-tight">UPI QR (Instant)</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded">PRIMARY</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm, BHIM</p>
                        <p className="text-[10px] font-mono font-medium text-emerald-700 mt-0.5">✓ 0% MDR • Zero Escrow Passthrough</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">T+0</span>
                  </label>

                  {/* Rail B: Direct Bank IMPS (Enabled) */}
                  <label
                    className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer shadow-2xs transition ${
                      railImps
                        ? 'border-[#cbd5e1] bg-white hover:border-slate-400'
                        : 'border-[#e2e8f0] bg-slate-50/60 opacity-80'
                    }`}
                    style={{ backgroundColor: railImps ? '#ffffff' : '#f8fafc', borderColor: '#cbd5e1' }}
                    data-purpose="rail-bento-imps"
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={railImps}
                        onChange={(e) => setRailImps(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#cbd5e1] text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900">Bank IMPS / NEFT</span>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">Dedicated Virtual Account direct credit</p>
                        <p className="text-[10px] font-mono text-slate-600 mt-0.5">RTGS supported for &gt;₹2,00,000</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">24/7</span>
                  </label>

                  {/* Rail C: Polygon USDT (Inactive by default) */}
                  <label
                    className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer shadow-2xs transition ${
                      railCrypto
                        ? 'border-purple-400 bg-purple-50/50'
                        : 'border-[#cbd5e1] bg-slate-50 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: railCrypto ? '#faf5ff' : '#f8fafc', borderColor: railCrypto ? '#c084fc' : '#cbd5e1' }}
                    data-purpose="rail-bento-usdt"
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={railCrypto}
                        onChange={(e) => setRailCrypto(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#cbd5e1] text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-800">Crypto (USDT / USDC)</span>
                          <span className="text-[9px] font-mono bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-semibold">WEB3</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">Polygon Mainnet passthrough</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Auto-swap</span>
                  </label>

                  {/* Expiry Duration Selector */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">Link Validity</label>
                      <span className="text-[10px] font-mono text-slate-400">Auto-expires after term</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center font-mono text-[11px]">
                      {['24h', '3d', '7d', '30d', 'Never'].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setLinkValidity(term)}
                          className={`py-1 px-1 border rounded transition cursor-pointer ${
                            linkValidity === term
                              ? 'border-blue-600 bg-blue-600 font-bold text-white shadow-2xs'
                              : 'border-[#cbd5e1] rounded hover:bg-slate-100 text-slate-600 bg-white'
                          }`}
                          style={{
                            backgroundColor: linkValidity === term ? '#2563eb' : '#ffffff',
                            borderColor: linkValidity === term ? '#2563eb' : '#cbd5e1',
                            color: linkValidity === term ? '#ffffff' : '#475569',
                          }}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Link Output & Submit Button Group */}
                <div className="space-y-3 pt-3 border-t border-[#e2e8f0]" data-purpose="output-action-group">
                  {/* Live Preview Pill Card — Matching Image 2 */}
                  <div
                    className="p-2.5 rounded-lg border border-[#cbd5e1] text-xs shadow-2xs"
                    style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-600 mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${generatedLinkData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        Generated Link Preview
                      </span>
                      <span className="text-emerald-700 font-bold">HTTPS SECURE</span>
                    </div>
                    <div
                      className="flex items-center justify-between border border-[#cbd5e1] rounded px-2.5 py-1.5"
                      style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path clipRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" fillRule="evenodd"></path>
                        </svg>
                        <span className="font-mono text-[11px] text-slate-700 truncate" id="link-url-display">
                          {activeUrl || previewUrlDynamic}
                        </span>
                      </div>
                      <button
                        onClick={() => copyText(activeUrl || previewUrlDynamic, 'Payment Link')}
                        className={`shrink-0 inline-flex items-center gap-1 font-mono text-[11px] font-bold border px-2 py-0.5 rounded transition cursor-pointer ${
                          copiedId === (activeUrl || previewUrlDynamic)
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-200'
                        }`}
                        style={{ backgroundColor: copiedId === (activeUrl || previewUrlDynamic) ? '#d1fae5' : '#eff6ff' }}
                        id="copy-link-btn"
                        type="button"
                      >
                        {copiedId === (activeUrl || previewUrlDynamic) ? (
                          <span>✓ Copied</span>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    {/* Direct action buttons when active link exists */}
                    {generatedLinkData && (
                      <div className="mt-2 pt-2 border-t border-[#e2e8f0] flex items-center justify-between gap-2 animate-fade-in">
                        <a
                          href={activeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded text-xs font-mono font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Go to Checkout ↗</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => shareWhatsApp(generatedLinkData)}
                          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-mono font-semibold transition cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Main CTA Trigger Button */}
                  <button
                    onClick={handleCreateLink}
                    disabled={isGenerating}
                    className={`w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                      isGenerating ? 'opacity-80 cursor-wait' : ''
                    }`}
                    style={{ backgroundColor: '#2563eb' }}
                    type="button"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Payment Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Create &amp; Share Payment Link</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Micro Security Footnote */}
                  <p className="text-[10px] font-mono text-center text-slate-500">
                    Locked to Bank A/C {lastFour} • End-to-End Signed Signature • 256-bit TLS
                  </p>
                </div>
              </section>
              {/* END: RightColumn */}
            </div>
            {/* END: FormBody */}
          </main>
          {/* END: MasterPaymentLinkConsole */}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DATA TABLE & FILTER PANEL
          ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/80">
        {/* Filter bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'All', label: 'All', count: allLinks.length },
              { id: 'Paid', label: 'Paid', count: allLinks.filter((l) => l.status === 'Paid').length },
              { id: 'Pending', label: 'Pending', count: allLinks.filter((l) => l.status === 'Pending' || l.status === 'Partial').length },
              { id: 'Expired', label: 'Expired', count: allLinks.filter((l) => l.status === 'Expired').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 font-normal ${
                    statusFilter === tab.id ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Timeframe & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by ID, description or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option>Last 30 Days</option>
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>This Month</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh Payment Links"
              type="button"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Link ID
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Description &amp; Purpose
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Customer
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Amount
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Created Date
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Status
                </th>
                <th className="py-3.5 px-6 font-semibold text-right" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LinkIcon className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No payment links found</p>
                      <p className="text-xs text-slate-400">
                        Try clearing your search query or generate a new link using the studio above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLinks.map((link) => {
                  const numAmt = parseFloat(link.amount);
                  const isFlex = isNaN(numAmt) || link.amount === 'Flexible';
                  const isCopied = copiedId === link.id || copiedId === link.url;

                  return (
                    <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Link ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900 text-xs">
                            {link.id}
                          </span>
                          <button
                            onClick={() => copyText(link.id, 'Link ID')}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded"
                            title="Copy Link ID"
                            type="button"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Description & Purpose */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col max-w-xs">
                          <span className="font-medium text-slate-900 truncate" title={link.purpose}>
                            {link.purpose}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {link.ref || 'REF-GEN'}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {link.customerName || 'Direct Customer'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {link.customerPhone || '--'}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {isFlex ? (
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                                Flexible
                              </span>
                            ) : (
                              `₹ ${numAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            )}
                          </span>
                          {link.partialAmount && (
                            <span className="text-[10px] text-slate-500">
                              ₹{parseFloat(link.partialAmount).toLocaleString('en-IN')} received
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-6">
                        <span className="text-xs text-slate-500">
                          {new Date(link.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          {new Date(link.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {link.status === 'Paid' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Paid
                          </span>
                        )}
                        {link.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Pending
                          </span>
                        )}
                        {link.status === 'Partial' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Partial
                          </span>
                        )}
                        {link.status === 'Expired' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyText(link.url, 'Payment Link')}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Copy Payment Link"
                            type="button"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => shareWhatsApp(link)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                            title="Share on WhatsApp"
                            type="button"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Open Checkout Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete Link"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing{' '}
            <strong className="text-slate-900 font-semibold">
              {filteredLinks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredLinks.length)}
            </strong>{' '}
            of {filteredLinks.length} payment links
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  currentPage === num
                    ? 'bg-slate-900 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                type="button"
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DIRECT-TO-BANK INSTANT PAYOUT GUARANTEE CALLOUT BANNER
          ══════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-100/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Direct-to-Bank Instant Payout Guarantee (Zero Escrow Hold)
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                NPCI 2.0 IMPS
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Every payment collected via your custom payment links settles directly to your verified{' '}
              <strong className="text-slate-800 font-semibold">
                ICICI Bank Current Account (•••• {profile?.bank_account_number?.slice(-4) || '4092'})
              </strong>
              . Funds never route through intermediary holding wallets or aggregate escrow accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveTab?.('settlements')}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
          >
            Settlement Advices
          </button>
          <button
            type="button"
            onClick={() => setActiveTab?.('developer')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/20"
          >
            View Webhook Logs
          </button>
        </div>
      </div>
    </div>
  );
}
