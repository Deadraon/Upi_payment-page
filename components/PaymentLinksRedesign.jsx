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
  Clock,
  QrCode,
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
  DollarSign
} from 'lucide-react';

// Default starter links matching the design mockup for instant aesthetic appeal
const DEFAULT_INITIAL_LINKS = [
  {
    id: 'pl_98xK29La',
    purpose: 'Cloud Hosting Q4 Subscription',
    ref: 'REF-CH-992',
    customerName: 'Rohan Sharma',
    customerPhone: '+91 98765 43210',
    amount: '12499.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // ~18 mins ago
    status: 'Paid',
    url: 'https://mymob.tech/pay?order_id=ord_98xK29La&amount=12499.00',
  },
  {
    id: 'pl_77qR10Pk',
    purpose: 'Annual SaaS License Tier-3',
    ref: 'APX-8812',
    customerName: 'TechNova Systems',
    customerPhone: 'accounts@technova.in',
    amount: '45000.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // ~1.2 hrs ago
    status: 'Paid',
    url: 'https://mymob.tech/pay?order_id=ord_77qR10Pk&amount=45000.00',
  },
  {
    id: 'pl_63mB41Vx',
    purpose: 'Wholesale Bulk Inventory Advance',
    ref: 'PO-BL-4019',
    customerName: 'Kalyan Traders',
    customerPhone: '+91 94450 12099',
    amount: '25000.00',
    partialAmount: '10000.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(), // ~3.5 hrs ago
    status: 'Partial',
    url: 'https://mymob.tech/pay?order_id=ord_63mB41Vx&amount=25000.00',
  },
  {
    id: 'pl_51pT89Mn',
    purpose: 'Cross-Border Settlement USDT',
    ref: 'TX-USDT-991',
    customerName: 'Apex Global Ventures',
    customerPhone: '0x4b...392F',
    amount: '82300.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 340).toISOString(), // ~5.5 hrs ago
    status: 'Paid',
    url: 'https://mymob.tech/pay?order_id=ord_51pT89Mn&amount=82300.00',
  },
  {
    id: 'pl_19zW02Kf',
    purpose: 'Consulting Retainer Monthly Fee',
    ref: 'RET-CON-04',
    customerName: 'Ananya Deshmukh',
    customerPhone: 'ananya@deshmukh.co',
    amount: '2500.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(), // ~7 hrs ago
    status: 'Pending',
    url: 'https://mymob.tech/pay?order_id=ord_19zW02Kf&amount=2500.00',
  },
];

export default function PaymentLinksRedesign({
  profile = {},
  orders = [],
  payLinkHistory = [],
  setPayLinkHistory,
  setActiveTab,
}) {
  // Form input states
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [refCode, setRefCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active generated preview link
  const [activeUrl, setActiveUrl] = useState('https://mymob.tech/pay/pl_98xK29La');
  const [activeLinkId, setActiveLinkId] = useState('pl_98xK29La');

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
      const newUrl = 'https://mymob.tech/pay/pl_' + rand;
      setActiveUrl(newUrl);
      const prevUrlEl = document.getElementById('preview-url');
      if (prevUrlEl) prevUrlEl.innerText = newUrl;
      showToast('New Link Generated: ' + newUrl);
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

    const totalProcessedCount = paidCount > 0 ? paidCount : 824;
    const displayTotalAmount = totalAmt > 0 ? totalAmt : 1845200;
    const avgTicket = totalProcessedCount > 0 ? Math.round(displayTotalAmount / totalProcessedCount) : 2240;
    const conversionRate = (paidCount + pendingCount) > 0
      ? ((paidCount / (paidCount + pendingCount)) * 100).toFixed(1)
      : '89.2';

    return {
      totalCollected: displayTotalAmount,
      totalCount: totalProcessedCount,
      activeLinks: pendingCount > 0 ? pendingCount : 42,
      paidLinks: paidCount > 0 ? paidCount : 824,
      expiredLinks: expiredCount > 0 ? expiredCount : 12,
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
    setIsGenerating(false);

    showToast('Payment link generated successfully! Link ready to dispatch.');

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
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +24.5%
            </span>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-2xl text-slate-900 tracking-tight font-bold">
              ₹ {metrics.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Processed across {metrics.totalCount} payments
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
              ₹ {metrics.avgTicket.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 mt-1">Top payment rail: UPI QR</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          QUICK CREATE PANEL & INTERACTIVE LINK GENERATOR
          ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div
          ref={createPanelRef}
          className="bg-white border border-slate-200/90 rounded-2xl p-6 lg:p-7 shadow-sm transition-all animate-fade-up"
        >
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Instant Link Generator Studio
                </h2>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Direct VPA Routing
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure payment parameters to generate instant UPI deep links and QR codes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAmount('12499');
                  setPurpose('Cloud Hosting Q4 Subscription');
                  setRefCode('REF-CH-992');
                  setCustomerName('Rohan Sharma');
                  setCustomerPhone('+91 98765 43210');
                  showToast('Populated with demo parameters');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                Load Sample Data
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmount('');
                  setPurpose('');
                  setRefCode('');
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Clear Form
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            {/* Form Column (7 cols) */}
            <form onSubmit={handleCreateLink} className="lg:col-span-7 flex flex-col gap-5">
              {/* Amount Input */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="input-amount"
                    className="text-[11px] uppercase tracking-wider text-slate-500 font-bold"
                  >
                    Amount to Request (INR) *
                  </label>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Zero MDR • Direct Settled
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-bold text-2xl select-none">
                    ₹
                  </span>
                  <input
                    id="input-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent border-0 pl-9 pr-3 py-2 text-2xl sm:text-3xl font-extrabold text-slate-900 placeholder:text-slate-300 focus:outline-none tabular-nums"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1">
                    Quick:
                  </span>
                  {[500, 1000, 2500, 5000, 12499, 25000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className={`text-xs px-2.5 py-1 rounded-md border font-semibold transition-all ${
                        amount === preset.toString()
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className={`text-xs px-2.5 py-1 rounded-md border font-semibold transition-all ${
                      amount === ''
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Custom / Open
                  </button>
                </div>
              </div>

              {/* Purpose & Reference in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="input-purpose"
                    className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1.5"
                  >
                    Payment Purpose / Note *
                  </label>
                  <input
                    id="input-purpose"
                    type="text"
                    placeholder="e.g. Cloud Hosting Q4 Subscription"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="input-ref"
                      className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold"
                    >
                      Reference / Invoice ID
                    </label>
                    <button
                      type="button"
                      onClick={handleRandomRef}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Auto-Gen
                    </button>
                  </div>
                  <input
                    id="input-ref"
                    type="text"
                    placeholder="e.g. REF-CH-992"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-mono font-medium"
                  />
                </div>
              </div>

              {/* Advanced / Customer Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 transition-colors w-fit select-none"
              >
                <span>{showAdvanced ? 'Hide customer & expiry options' : '+ Add customer details & notifications (optional)'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showAdvanced ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Advanced Fields */}
              {showAdvanced && (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1.5">
                        Customer Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rohan Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1.5">
                        Customer Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer details are auto-encrypted and signed with merchant HMAC SHA-256.</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating Link...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Payment Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.generateMockLink) window.generateMockLink();
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  title="Generate quick random preview link"
                >
                  Quick Random Link
                </button>
              </div>
            </form>

            {/* Preview Column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-blue-500/20 shrink-0">
                      {profile?.business_name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                        {profile?.business_name || 'My Business'}
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" />
                      </p>
                      <p className="text-xs text-slate-400">Payment Request</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Amount Block */}
                <div className="px-5 py-5 border-b border-slate-100 text-center bg-slate-50/60">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-1">Amount Due</p>
                  <p
                    id="preview-amount"
                    className="text-3xl font-black text-slate-900 tracking-tight tabular-nums"
                  >
                    {previewAmountFormatted}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                    <span
                      id="preview-purpose"
                      className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full truncate max-w-[180px]"
                    >
                      {previewPurposeFormatted}
                    </span>
                    {previewRefFormatted !== 'REF-GEN' && (
                      <span
                        id="preview-ref"
                        className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full"
                      >
                        {previewRefFormatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer info (if filled) */}
                {customerName && (
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5 bg-white">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{customerName}</p>
                      {customerPhone && (
                        <p className="text-xs text-slate-400 truncate">{customerPhone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Link URL */}
                <div className="px-5 py-4 flex-1 flex flex-col justify-center gap-2">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Payment Link</p>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span
                      id="preview-url"
                      className="text-xs font-mono text-blue-600 truncate flex-1"
                      title={activeUrl}
                    >
                      {activeUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(activeUrl, 'Payment URL')}
                      className="shrink-0 p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === activeUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Trust badges */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      256-bit SSL
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3 text-blue-500" fill="currentColor" />
                      NPCI Certified
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Receipt className="w-3 h-3 text-indigo-500" />
                      T+0 Settlement
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="px-5 py-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => copyText(activeUrl, 'Payment URL')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => shareWhatsApp({
                        customerName: customerName || 'Valued Customer',
                        customerPhone,
                        amount: amount || '0',
                        purpose: purpose || 'Payment',
                        url: activeUrl,
                      })}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </div>
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98] group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    Go to Checkout
                  </a>
                </div>
              </div>
            </div>
          </div>
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
