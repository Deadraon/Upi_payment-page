'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { 
  ShieldCheck, CheckCircle2, Building2, Lock, Copy, Check, 
  Languages, X, Clock, ArrowRight, ExternalLink, HelpCircle, 
  RefreshCw, ChevronRight, Zap, Coins, Store, QrCode as QrIcon,
  Info, AlertCircle, Sparkles, Tag, ArrowLeft
} from 'lucide-react';
import { CONFIG } from '@/lib/config';

export default function DesktopCheckoutView({
  merchant,
  orderId,
  paramRef,
  paramCallback,
  activeId,
  displayAmt,
  amtWhole,
  amtFrac,
  bizName,
  bizInitial,
  upiId,
  upiQrValue,
  orderDate,
  timeLeft,
  mm,
  ss,
  activeOpt,
  setActiveOpt,
  copyFeedback,
  handleCopyUpi,
  isChecking,
  triggerChecking,
  checkMsg,
  handleReturn,
  bankName,
  bankAcc,
  bankIfsc,
  bankBranch,
  copiedAcc,
  copiedIfsc,
  handleCopyAcc,
  handleCopyIfsc,
  cryptoWallet,
  usdtAmt,
  txHash,
  setTxHash,
  submitTx,
  txBusy,
  txMsg,
  copyUsdtDone,
  handleCopyUsdt,
  showUtr,
  setShowUtr,
  utr,
  setUtr,
  submitUtr,
  utrBusy,
  utrMsg,
  showPromo,
  setShowPromo,
  promoCode,
  setPromoCode,
  submitPromo,
  promoLoading,
  promoMsg,
  promoApplied,
  curView,
  setCurView,
  okTime,
  orderMode,
  fmtInr,
  buildUpiLink,
}) {
  const [lang, setLang] = useState('en'); // 'en' | 'hi'
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [copiedCryptoAddr, setCopiedCryptoAddr] = useState(false);

  // Safe guarded values
  const safeBizName = bizName || 'Merchant';
  const safeBizInitial = bizInitial || safeBizName.charAt(0).toUpperCase();
  const safeActiveId = activeId ? String(activeId) : (paramRef ? String(paramRef) : 'APX-98214');
  const orderRefDisplay = safeActiveId.startsWith('#')
    ? safeActiveId.replace('#', '')
    : safeActiveId.length > 8
      ? safeActiveId.slice(-8).toUpperCase()
      : safeActiveId.toUpperCase();

  const numAmt = typeof displayAmt === 'number' && !isNaN(displayAmt)
    ? displayAmt
    : (parseFloat(displayAmt) || 1.0);

  const formattedAmount = numAmt.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const safeMm = mm != null ? String(mm) : '05';
  const safeSs = ss != null ? String(ss) : '00';

  // Crypto conversion calculations
  const cryptoRates = {
    USDT: {
      amount: `~ ${(numAmt / 87).toFixed(2)} USDT`,
      network: 'TRC20',
      address: cryptoWallet || 'TYsP8a3k8sLmQzK9vN2D6m4E9qB1wX2yZ7',
      color: '#009d6d'
    },
    BTC: {
      amount: `~ ${(numAmt / 8000000).toFixed(6)} BTC`,
      network: 'Bitcoin network',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      color: '#f7931a'
    },
    ETH: {
      amount: `~ ${(numAmt / 280000).toFixed(4)} ETH`,
      network: 'Ethereum mainnet',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976',
      color: '#627eea'
    }
  };

  const handleCopyCrypto = () => {
    const addr = cryptoRates[selectedCrypto]?.address;
    if (addr && navigator?.clipboard) {
      navigator.clipboard.writeText(addr);
      setCopiedCryptoAddr(true);
      setTimeout(() => setCopiedCryptoAddr(false), 2000);
    }
  };

  const handleAppClick = (appId) => {
    if (typeof buildUpiLink === 'function') {
      const link = buildUpiLink(appId, numAmt, safeActiveId, merchant, false);
      if (typeof window !== 'undefined') {
        window.location.href = link;
      }
    }
  };

  // Virtual bank account info fallback
  const displayBankAcc = bankAcc || `MYMOB${orderRefDisplay}`;
  const displayBankIfsc = bankIfsc || 'YESB0CMSNOC';
  const displayBankName = bankName || safeBizName;

  /* ─────────────────────────────────────────────────────────────
     1. Success View (curView === 'vOk')
  ───────────────────────────────────────────────────────────── */
  if (curView === 'vOk') {
    return (
      <div className="w-full max-w-[560px] mx-auto my-12 bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/80 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-emerald-200">
          <CheckCircle2 className="w-11 h-11 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Received!</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          ₹{formattedAmount} successfully paid to <strong>{bizName}</strong>
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 text-left space-y-2.5 mb-6 border border-slate-200/60 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Order Reference</span>
            <span className="font-mono font-bold text-slate-900">#{activeId ? activeId.slice(-8).toUpperCase() : 'DEMO'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Payment Method</span>
            <span className="font-semibold text-slate-800 uppercase">{activeOpt === 'bank' ? 'Bank Transfer' : activeOpt === 'crypto' ? 'Crypto' : 'UPI'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Platform Fee</span>
            <span className="font-bold text-emerald-600">₹0.00 Free</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 border-t border-slate-200 pt-2">
            <span>Settlement Time</span>
            <span className="font-semibold text-slate-800">{okTime || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReturn}
          className="w-full py-3.5 bg-[#0045de] hover:bg-[#0038b7] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Return to {bizName}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. Expired View (curView === 'vExp')
  ───────────────────────────────────────────────────────────── */
  if (curView === 'vExp') {
    return (
      <div className="w-full max-w-[500px] mx-auto my-12 bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/80 text-center animate-fade-in">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 text-amber-600">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Session Expired</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6 leading-relaxed">
          This payment session has timed out. Please start again to generate a fresh QR code and session.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Start Again</span>
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     3. Active Main Custom Checkout View
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="w-full flex flex-col items-center select-text">
      
      {/* Test mode banner if applicable */}
      {orderMode === 'test' && (
        <div className="w-full max-w-[820px] mb-3 bg-amber-50 border border-amber-300 rounded-xl p-2.5 px-4 text-xs font-bold text-amber-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Test mode &mdash; simulated sandbox transaction</span>
        </div>
      )}

      {/* Floating Trust Pill on Top */}
      <div className="flex items-center gap-2 bg-white shadow-sm rounded-full px-4 py-1.5 mb-4 border border-slate-200/70">
        <ShieldCheck className="w-4.5 h-4.5 text-[#0045de]" />
        <span className="text-xs font-semibold text-slate-700">
          Encrypted checkout · <strong>mymob.tech</strong>
        </span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ba9d]"></span>
        <span className="text-[10px] text-[#00ba9d] uppercase tracking-wider font-bold">Live</span>
      </div>

      {/* Main Hosted Checkout Panel */}
      <div className="w-full max-w-[820px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-slate-200/90">
        
        {/* Navy Dark Branded Header */}
        <div className="bg-[#0c2340] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Merchant Identity */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2c60ff] flex items-center justify-center shadow-md flex-shrink-0 text-white font-black text-xl">
              <span>{safeBizInitial}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight">{safeBizName}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#6ffbbe] text-[#005236] gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-2 text-sky-200 text-xs mt-0.5 font-medium">
                <span>Order #{orderRefDisplay}</span>
              </div>
            </div>
          </div>

          {/* Amount Due & Controls */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t border-slate-700/60 sm:border-0 pt-3 sm:pt-0 gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLang(l => (l === 'en' ? 'hi' : 'en'))}
                className="bg-white/10 hover:bg-white/20 text-sky-100 rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-sky-300" />
                <span>{lang === 'en' ? 'English / हिन्दी' : 'हिन्दी / English'}</span>
              </button>

              {paramCallback && (
                <button
                  type="button"
                  onClick={handleReturn}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                  title="Cancel and return to store"
                  aria-label="Cancel and return to store"
                >
                  <X className="w-5 h-5 leading-none" />
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-300 font-medium">
                {lang === 'hi' ? 'देय राशि:' : 'Amount due:'}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ₹{formattedAmount}
              </span>
            </div>
          </div>

        </div>

        {/* Main Split-Rail Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          
          {/* Left Panel: Payment Method Tabs (5 cols) */}
          <aside className="md:col-span-5 bg-[#f8faff] p-3 sm:p-4 flex flex-col justify-between border-r border-slate-100">
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider px-3 py-1 font-bold">
                {lang === 'hi' ? 'भुगतान विधियां' : 'Payment methods'}
              </p>

              {/* Tab 1: UPI / QR code */}
              <button
                type="button"
                onClick={() => setActiveOpt('upi')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  activeOpt === 'upi'
                    ? 'bg-white border-2 border-[#0045de] shadow-sm'
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="tab-upi"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0045de] flex-shrink-0">
                    <QrIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-[15px] font-bold text-slate-900 truncate block">UPI / QR code</span>
                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500">GPay, PhonePe, Paytm, BHIM</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6ffbbe] text-[#005236] font-extrabold flex items-center gap-0.5 flex-shrink-0">
                        <Zap className="w-3 h-3 fill-current" />
                        Fastest
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-colors ${activeOpt === 'upi' ? 'text-[#0045de]' : 'text-slate-300'}`} />
              </button>

              {/* Tab 2: Direct bank transfer */}
              <button
                type="button"
                onClick={() => setActiveOpt('bank')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  activeOpt === 'bank'
                    ? 'bg-white border-2 border-[#0045de] shadow-sm'
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="tab-bank"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-[15px] font-bold text-slate-900 truncate block">
                      {lang === 'hi' ? 'सीधा बैंक ट्रांसफर' : 'Direct bank transfer'}
                    </span>
                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500">Instant IMPS / NEFT / RTGS</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold flex-shrink-0">
                        Zero fee
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-colors ${activeOpt === 'bank' ? 'text-[#0045de]' : 'text-slate-300'}`} />
              </button>

              {/* Tab 3: Crypto currency */}
              <button
                type="button"
                onClick={() => setActiveOpt('crypto')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  activeOpt === 'crypto'
                    ? 'bg-white border-2 border-[#0045de] shadow-sm'
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="tab-crypto"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-[15px] font-bold text-slate-900 truncate block">
                      {lang === 'hi' ? 'क्रिप्टो करेंसी' : 'Crypto currency'}
                    </span>
                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500">USDT, BTC, ETH settlement</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6ffbbe] text-[#005236] font-bold flex items-center gap-0.5 flex-shrink-0">
                        Web3
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-colors ${activeOpt === 'crypto' ? 'text-[#0045de]' : 'text-slate-300'}`} />
              </button>
            </div>

            {/* MyMobPay Buyer Protection Footnote */}
            <div className="mt-6 p-3 rounded-xl bg-slate-100/80 text-slate-600 text-left border border-slate-200/50">
              <div className="flex items-center gap-2 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#0045de]" />
                <span className="text-xs font-bold">MyMobPay Buyer Protection</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                100% money-back guarantee if your order isn&apos;t delivered or the item is counterfeit.
              </p>
            </div>
          </aside>

          {/* Right Panel: Active Option Pane (7 cols) */}
          <section className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between bg-white">
            
            {/* ═══════════════════════════════════════════════════════
                PANE 1: UPI / QR CODE
            ═══════════════════════════════════════════════════════ */}
            {activeOpt === 'upi' && (
              <div className="space-y-5 flex-1 animate-fade-in" id="pane-upi">
                
                {/* Subsection: Supported UPI Apps */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{lang === 'hi' ? 'अपने UPI ऐप से तुरंत भुगतान करें' : 'Pay instantly with your UPI app'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0045de] inline-block"></span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {lang === 'hi' ? 'सभी ऐप्स पर स्वीकृत' : 'Tap to open'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                    {/* Google Pay */}
                    <button
                      type="button"
                      onClick={() => handleAppClick('gpay')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-slate-100 hover:border-[#0045de] transition-all cursor-pointer"
                      title="Pay with Google Pay"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                        <img src="/logos/gpay.svg" alt="Google Pay" className="h-5.5 w-auto object-contain" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 truncate w-full">Google Pay</span>
                    </button>

                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => handleAppClick('phonepe')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-slate-100 hover:border-[#0045de] transition-all cursor-pointer"
                      title="Pay with PhonePe"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                        <img src="/logos/phonepe.svg" alt="PhonePe" className="h-5 w-auto object-contain" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 truncate w-full">PhonePe</span>
                    </button>

                    {/* Paytm */}
                    <button
                      type="button"
                      onClick={() => handleAppClick('paytm')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-slate-100 hover:border-[#0045de] transition-all cursor-pointer"
                      title="Pay with Paytm"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                        <img src="/logos/paytm.svg" alt="Paytm" className="h-4 w-auto object-contain" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 truncate w-full">Paytm</span>
                    </button>

                    {/* CRED */}
                    <button
                      type="button"
                      onClick={() => handleAppClick('bhim')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-slate-100 hover:border-[#0045de] transition-all cursor-pointer"
                      title="Pay with CRED"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                        <img src="/logos/cred.svg" alt="CRED" className="h-4.5 w-auto object-contain" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 truncate w-full">CRED</span>
                    </button>

                    {/* BHIM UPI */}
                    <button
                      type="button"
                      onClick={() => handleAppClick('bhim')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-slate-100 hover:border-[#0045de] transition-all cursor-pointer"
                      title="Pay with BHIM UPI"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                        <img src="/logos/bhim.svg" alt="BHIM UPI" className="h-4 w-auto object-contain" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 truncate w-full">BHIM UPI</span>
                    </button>
                  </div>
                </div>

                {/* Subsection: Dynamic QR Code Box */}
                <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-slate-200/70">
                  <div className="relative w-32 h-32 bg-white rounded-xl p-2 shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-200">
                    {upiQrValue ? (
                      <QRCode
                        value={upiQrValue}
                        size={110}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 110 110`}
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Loading QR…</div>
                    )}
                    <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center p-0.5 border border-slate-200 pointer-events-none">
                      <span className="text-[#0045de] font-black tracking-tighter text-[10px] leading-none">UPI</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 bg-blue-100 text-[#0045de] px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">QR expires in {safeMm}:{safeSs}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      Scan with any UPI app to pay ₹{formattedAmount}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Open Google Pay, PhonePe, Paytm, CRED or BHIM and point your camera at the code above.
                    </p>
                  </div>
                </div>

                {/* Subsection: Pay directly to merchant VPA */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Pay directly to merchant VPA
                      <CheckCircle2 className="w-4 h-4 text-[#0045de]" />
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                      Instant verification
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Merchant UPI ID / VPA
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm tracking-wide select-all mt-0.5">
                        {upiId}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="h-9 px-4 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-[#0045de] text-xs font-semibold flex items-center justify-center shadow-xs transition-all flex-shrink-0 gap-1.5 cursor-pointer"
                    >
                      {copyFeedback ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* UTR reference expander */}
                {showUtr && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Submit 12-Digit Bank UTR / Reference No.</span>
                      <button type="button" onClick={() => setShowUtr(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        placeholder="12-digit UTR (e.g. 425619283741)"
                        value={utr}
                        onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-[#0045de]"
                      />
                      <button
                        type="button"
                        disabled={utr.length !== 12 || utrBusy}
                        onClick={submitUtr}
                        className="px-4 py-2 bg-[#0045de] disabled:opacity-50 hover:bg-[#0038b7] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        {utrBusy ? 'Verifying…' : 'Verify UTR'}
                      </button>
                    </div>
                    {utrMsg && (
                      <p className={`text-xs font-semibold ${utrMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {utrMsg}
                      </p>
                    )}
                  </div>
                )}

                {/* Promo Code expander */}
                {showPromo && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Apply Discount / Promo Code</span>
                      <button type="button" onClick={() => setShowPromo(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Promo Code"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-[#0045de]"
                      />
                      <button
                        type="button"
                        disabled={promoLoading || !promoCode.trim()}
                        onClick={submitPromo}
                        className="px-4 py-2 bg-[#0045de] disabled:opacity-50 hover:bg-[#0038b7] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        {promoLoading ? 'Applying…' : 'Apply'}
                      </button>
                    </div>
                    {promoMsg && (
                      <p className={`text-xs font-semibold ${promoMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {promoMsg}
                      </p>
                    )}
                  </div>
                )}

                {/* Primary CTA Button: "I've paid, check status" */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={triggerChecking}
                    disabled={isChecking}
                    className="w-full h-12 rounded-xl bg-[#0045de] hover:bg-[#0038b7] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 active:scale-99"
                  >
                    {isChecking ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking status…</span>
                      </>
                    ) : (
                      <>
                        <span>I&apos;ve paid, check status</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {checkMsg && (
                    <div className="text-center text-xs font-semibold text-slate-600 animate-fade-in">
                      {checkMsg}
                    </div>
                  )}

                  {/* Secondary Action Links */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => setShowUtr(!showUtr)}
                      className="text-[#0045de] hover:underline font-semibold cursor-pointer"
                    >
                      {showUtr ? 'Hide UTR box' : 'Already paid? Enter UTR'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPromo(!showPromo)}
                      className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      {promoApplied ? `Promo applied: ${promoApplied.code} ✓` : 'Have a promo code?'}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                PANE 2: DIRECT BANK TRANSFER
            ═══════════════════════════════════════════════════════ */}
            {activeOpt === 'bank' && (
              <div className="space-y-4 flex-1 animate-fade-in" id="pane-bank">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900">Direct bank-to-bank transfer</h3>
                    <p className="text-xs text-slate-500">Direct settlement into merchant&apos;s verified account</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-[#6ffbbe] text-[#005236] font-extrabold">
                    Zero fees
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-medium">Beneficiary name</span>
                    <span className="font-bold text-slate-900">{displayBankName}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-medium">Virtual account number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{displayBankAcc}</span>
                      <button
                        type="button"
                        onClick={handleCopyAcc}
                        className="text-[#0045de] hover:text-[#0038b7] p-1 cursor-pointer"
                        title="Copy account number"
                      >
                        {copiedAcc ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-medium">IFSC code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{displayBankIfsc}</span>
                      <button
                        type="button"
                        onClick={handleCopyIfsc}
                        className="text-[#0045de] hover:text-[#0038b7] p-1 cursor-pointer"
                        title="Copy IFSC code"
                      >
                        {copiedIfsc ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {bankBranch && (
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-500 font-medium">Bank</span>
                      <span className="font-semibold text-slate-900">{bankBranch}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 font-medium">Amount to transfer</span>
                    <span className="font-mono font-extrabold text-[#0045de] text-sm">₹{formattedAmount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-900 flex items-center gap-2 text-xs">
                  <Info className="w-4 h-4 text-[#0045de] flex-shrink-0" />
                  <span>We verify your transfer automatically once it is credited — usually within 2-3 minutes.</span>
                </div>

                <button
                  type="button"
                  onClick={triggerChecking}
                  disabled={isChecking}
                  className="w-full h-12 rounded-xl bg-[#0045de] hover:bg-[#0038b7] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  <span>{isChecking ? 'Checking status…' : "I've made the transfer"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                PANE 3: CRYPTO CURRENCY
            ═══════════════════════════════════════════════════════ */}
            {activeOpt === 'crypto' && (
              <div className="space-y-4 flex-1 animate-fade-in" id="pane-crypto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900">Crypto settlement</h3>
                    <p className="text-xs text-slate-500">USDT, BTC, ETH — on-chain gateway</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-blue-100 text-[#0045de] font-bold">
                    Web3 ready
                  </span>
                </div>

                {/* Cryptocurrency Selection Chips */}
                <div className="grid grid-cols-3 gap-2" role="radiogroup">
                  {['USDT', 'BTC', 'ETH'].map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setSelectedCrypto(sym)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        selectedCrypto === sym
                          ? 'bg-white border-[#0045de] shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                      }`}
                    >
                      <span className="font-bold text-sm" style={{ color: cryptoRates[sym].color }}>
                        {sym}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{cryptoRates[sym].network}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Pay amount</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {cryptoRates[selectedCrypto].amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Deposit address ({cryptoRates[selectedCrypto].network})</span>
                    <button
                      type="button"
                      onClick={handleCopyCrypto}
                      className="text-[#0045de] hover:text-[#0038b7] flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedCryptoAddr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCryptoAddr ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg font-mono text-[11px] text-slate-800 truncate border border-slate-200 select-all">
                    {cryptoRates[selectedCrypto].address}
                  </div>
                </div>

                {/* Transaction Hash Submission */}
                <form onSubmit={submitTx} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Transaction hash (TxID)…"
                      value={txHash}
                      onChange={e => setTxHash(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0045de]"
                    />
                    <button
                      type="submit"
                      disabled={txBusy || !txHash.trim()}
                      className="px-4 py-2 bg-[#0045de] disabled:opacity-50 hover:bg-[#0038b7] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {txBusy ? '…' : 'Verify'}
                    </button>
                  </div>
                  {txMsg && (
                    <p className={`text-xs font-semibold ${txMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {txMsg}
                    </p>
                  )}
                </form>

                <p className="text-[11px] text-slate-500">
                  Send only {selectedCrypto} on the specified network. Transferred funds credit upon 3 on-chain confirmations.
                </p>
              </div>
            )}

            {/* Pane Footer Security Reassurance */}
            <div className="pt-4 mt-4 flex items-center justify-between text-slate-500 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Secure checkout</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Powered by</span>
                <span className="font-bold text-[#0045de] tracking-tight">mymob.tech</span>
              </div>
            </div>

          </section>

        </div>

        {/* Bottom Trust Badges Bar */}
        <footer className="bg-slate-100/80 py-3 px-6 flex flex-wrap items-center justify-between gap-3 text-slate-600 text-xs border-t border-slate-200">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#0045de]" />
            <span>Protected by <strong>mymob.tech</strong> 256-bit encryption</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span className="font-bold text-slate-800">UPI</span>
            <span>·</span>
            <span className="font-bold text-slate-800">IMPS / NEFT</span>
            <span>·</span>
            <span className="font-bold text-slate-800">Web3 USDT</span>
          </div>
        </footer>

      </div>

      {/* Sub-modal Quick Help & Session ID Bar */}
      <div className="w-full max-w-[820px] flex items-center justify-between mt-3 px-2 text-slate-500 text-xs">
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need help with payment?</span>
        </button>
        <span className="font-mono text-[12px]">
          Session ID: MMP_{orderRefDisplay}
        </span>
      </div>

      {/* Quick Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0045de]" />
                Payment Assistance
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scan the QR code with any UPI application (GPay, PhonePe, Paytm, CRED or BHIM). Once completed, click <strong>&quot;I&apos;ve paid, check status&quot;</strong> or enter your 12-digit UTR reference number for instant verification.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p><strong>Merchant:</strong> {bizName}</p>
              <p><strong>Merchant UPI:</strong> {upiId}</p>
              <p><strong>Gateway Support:</strong> support@mymob.tech</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
