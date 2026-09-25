'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';

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
  cryptoWallet,
  usdtAmt,
  curView,
  setCurView,
  okTime,
  orderMode,
  fmtInr,
  buildUpiLink,
}) {
  const [lang, setLang] = useState('en'); // 'en' | 'hi'
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [copiedField, setCopiedField] = useState(null); // 'upi' | 'acc' | 'ifsc' | 'crypto'
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Safeguarded values
  const safeBizName = bizName || 'Merchant Name';
  const safeActiveId = activeId ? String(activeId) : (paramRef ? String(paramRef) : 'APX-98214');
  const orderRefDisplay = safeActiveId.startsWith('#')
    ? safeActiveId.replace('#', '')
    : safeActiveId.length > 9
      ? safeActiveId.slice(-9).toUpperCase()
      : safeActiveId.toUpperCase();

  const sessionDisplay = safeActiveId.startsWith('MMP_')
    ? safeActiveId
    : `MMP_${orderRefDisplay}`;

  const numAmt = typeof displayAmt === 'number' && !isNaN(displayAmt)
    ? displayAmt
    : (parseFloat(displayAmt) || 1.0);

  const formattedAmount = numAmt.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const safeMm = mm != null ? String(mm).padStart(2, '0') : '07';
  const safeSs = ss != null ? String(ss).padStart(2, '0') : '35';

  // Bank transfer details
  const displayBankAcc = bankAcc || `MYMOB${orderRefDisplay}`;
  const displayBankIfsc = bankIfsc || 'YESB0CMSNOC';
  const displayBankName = bankName || safeBizName;

  // Crypto rates and addresses
  const cryptoRates = {
    USDT: {
      amount: `~ ${(numAmt / 87).toFixed(2)} USDT`,
      network: 'TRC20',
      address: cryptoWallet || 'TYsP8a3k8sLmQzK9vN2D6m4E9qB1wX2yZ7',
    },
    BTC: {
      amount: `~ ${(numAmt / 8000000).toFixed(6)} BTC`,
      network: 'Bitcoin network',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    ETH: {
      amount: `~ ${(numAmt / 280000).toFixed(4)} ETH`,
      network: 'Ethereum mainnet',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976',
    }
  };

  const announce = (msg) => {
    setLiveAnnouncement(msg);
    setTimeout(() => setLiveAnnouncement(''), 3000);
  };

  const handleCopyText = (text, fieldName) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        announce(`${fieldName} copied to clipboard.`);
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(() => {
        announce('Could not copy automatically.');
      });
    }
  };

  const handleAppClick = (appName, appId) => {
    announce(`Opening ${appName} to complete payment.`);
    if (typeof buildUpiLink === 'function') {
      const link = buildUpiLink(appId, numAmt, safeActiveId, merchant, false);
      if (typeof window !== 'undefined') {
        window.location.href = link;
      }
    }
  };

  /* ─────────────────────────────────────────────────────────────
     1. Success View (curView === 'vOk')
  ───────────────────────────────────────────────────────────── */
  if (curView === 'vOk') {
    return (
      <div className="w-full max-w-[560px] mx-auto my-12 bg-white rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-200 text-center animate-fade-in font-sans">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-emerald-200">
          <span className="material-symbols-outlined text-4xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Received!</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          ₹{formattedAmount} successfully paid to <strong>{safeBizName}</strong>
        </p>

        <div className="bg-[#f8faff] rounded-xl p-4 sm:p-5 text-left space-y-2.5 mb-6 border border-slate-200 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Order Reference</span>
            <span className="font-mono font-bold text-slate-900">#{orderRefDisplay}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Payment Method</span>
            <span className="font-semibold text-slate-800 uppercase">
              {activeOpt === 'bank' ? 'Bank Transfer' : activeOpt === 'crypto' ? 'Crypto' : 'UPI'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Platform Fee</span>
            <span className="font-bold text-[#009d6d]">₹0.00 Free</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 border-t border-slate-200 pt-2">
            <span>Settlement Time</span>
            <span className="font-semibold text-slate-800">{okTime || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReturn}
          className="focus-ring w-full py-3.5 bg-[#0045de] hover:bg-[#0038b7] text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Return to {safeBizName}</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. Expired View (curView === 'vExp')
  ───────────────────────────────────────────────────────────── */
  if (curView === 'vExp') {
    return (
      <div className="w-full max-w-[500px] mx-auto my-12 bg-white rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-200 text-center animate-fade-in font-sans">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 text-amber-600">
          <span className="material-symbols-outlined text-3xl">schedule</span>
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
          className="focus-ring w-full py-3 bg-[#000d21] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span>Start Again</span>
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     3. Active Checkout View: Exact 1:1 Match to MyMobPay Checkout.html
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Exact Material Symbols stylesheet */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        rel="stylesheet"
      />

      {/* Scoped CSS design tokens from MyMobPay Checkout.html */}
      <style jsx global>{`
        :root {
          --c-surface: #faf8ff;
          --c-surface-dim: #d2d9f4;
          --c-surface-container-lowest: #ffffff;
          --c-surface-container-low: #f2f3ff;
          --c-surface-container: #eaedff;
          --c-surface-container-high: #e2e7ff;
          --c-surface-container-highest: #dae2fd;
          --c-on-surface: #131b2e;
          --c-on-surface-variant: #44474d;
          --c-outline: #74777e;
          --c-outline-variant: #c4c6ce;
          --c-primary: #000d21;
          --c-primary-container: #0c2340;
          --c-on-primary: #ffffff;
          --c-primary-fixed: #d5e3ff;
          --c-primary-fixed-dim: #b3c7ec;
          --c-secondary: #0045de;
          --c-on-secondary: #ffffff;
          --c-secondary-container: #2c60ff;
          --c-secondary-hover: #0038b7;
          --c-tertiary-fixed: #6ffbbe;
          --c-on-tertiary-container: #009d6d;
          --c-on-tertiary-fixed-variant: #005236;
          --c-error: #ba1a1a;
          --c-on-error: #ffffff;
        }

        .focus-ring:focus-visible {
          outline: 2px solid var(--c-secondary);
          outline-offset: 2px;
          border-radius: 8px;
        }

        .bg-surface-container-lowest { background-color: var(--c-surface-container-lowest) !important; }
        .bg-surface-container-low { background-color: var(--c-surface-container-low) !important; }
        .bg-surface-container { background-color: var(--c-surface-container) !important; }
        .bg-surface-container-high { background-color: var(--c-surface-container-high) !important; }
        .bg-surface-container-highest { background-color: var(--c-surface-container-highest) !important; }
        .bg-primary-container { background-color: var(--c-primary-container) !important; }
        .bg-secondary-container { background-color: var(--c-secondary-container) !important; }
        .bg-tertiary-fixed { background-color: var(--c-tertiary-fixed) !important; }
        .bg-primary { background-color: var(--c-primary) !important; }

        .text-on-surface { color: var(--c-on-surface) !important; }
        .text-on-surface-variant { color: var(--c-on-surface-variant) !important; }
        .text-on-primary { color: var(--c-on-primary) !important; }
        .text-primary-fixed { color: var(--c-primary-fixed) !important; }
        .text-primary-fixed-dim { color: var(--c-primary-fixed-dim) !important; }
        .text-secondary { color: var(--c-secondary) !important; }
        .text-on-secondary { color: var(--c-on-secondary) !important; }
        .text-on-tertiary-container { color: var(--c-on-tertiary-container) !important; }
        .text-on-tertiary-fixed-variant { color: var(--c-on-tertiary-fixed-variant) !important; }
        .border-surface-container { border-color: var(--c-surface-container) !important; }

        .text-title-md { font-size: 16px !important; line-height: 24px !important; font-weight: 600 !important; }
        .text-body-md { font-size: 14px !important; line-height: 20px !important; font-weight: 400 !important; }
        .text-body-sm { font-size: 12px !important; line-height: 16px !important; font-weight: 400 !important; }
        .text-headline-sm { font-size: 18px !important; line-height: 26px !important; letter-spacing: -0.005em !important; font-weight: 600 !important; }
        .text-label-sm { font-size: 10px !important; line-height: 14px !important; letter-spacing: 0.02em !important; font-weight: 600 !important; }
        .text-label-md { font-size: 12px !important; line-height: 16px !important; letter-spacing: 0.01em !important; font-weight: 500 !important; }
        .text-label-lg { font-size: 14px !important; line-height: 20px !important; letter-spacing: 0.005em !important; font-weight: 500 !important; }
        .text-currency-display { font-size: 32px !important; line-height: 40px !important; letter-spacing: -0.02em !important; font-weight: 700 !important; }
      `}</style>

      {/* Screen Reader live region */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <main className="w-full flex-1 flex flex-col items-center p-4 sm:p-6 font-sans text-on-surface antialiased">
        <div className="flex flex-col w-full items-center py-6 px-3 sm:px-6">
          <div className="relative w-full max-w-[820px] flex flex-col items-center">

            {/* Test Mode Sandbox Banner */}
            {orderMode === 'test' && (
              <div className="w-full mb-3 bg-amber-50 border border-amber-300 rounded-xl p-2.5 px-4 text-xs font-bold text-amber-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Test mode &mdash; simulated sandbox transaction</span>
              </div>
            )}

            {/* 1. Floating Trust Pill on Top */}
            <div className="flex items-center gap-2 bg-surface-container-lowest shadow-sm rounded-full px-4 py-1.5 mb-4 border border-outline-variant/30">
              <span
                className="material-symbols-outlined text-secondary text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="text-label-md text-on-surface">
                Encrypted checkout · <strong>mymob.tech</strong>
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
              <span className="text-label-sm text-on-tertiary-container font-semibold">Live</span>
            </div>

            {/* 2. Main Hosted Modal Card */}
            <div className="w-full bg-surface-container-lowest shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-outline-variant/30">

              {/* Card Header (Navy Blue Dark) */}
              <div className="bg-primary-container text-on-primary p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shadow-md flex-shrink-0 text-on-primary">
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      storefront
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-headline-sm text-on-primary font-semibold">{safeBizName}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant gap-1 font-semibold">
                        <span
                          className="material-symbols-outlined text-[13px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                        Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-fixed-dim text-body-sm mt-0.5">
                      <span>Order #{orderRefDisplay}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t border-white/10 sm:border-0 pt-3 sm:pt-0 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      id="langToggle"
                      type="button"
                      onClick={() => setLang(l => (l === 'en' ? 'hi' : 'en'))}
                      className="focus-ring bg-white/10 hover:bg-white/20 text-primary-fixed rounded-lg px-2.5 py-1 text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">translate</span>
                      <span id="currentLangLabel">
                        {lang === 'en' ? 'English / हिन्दी' : 'हिन्दी / English'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReturn}
                      className="focus-ring text-primary-fixed-dim hover:text-on-primary p-1 rounded transition-colors cursor-pointer"
                      title="Cancel and return"
                      aria-label="Cancel and return to store"
                    >
                      <span className="material-symbols-outlined text-xl leading-none">close</span>
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-label-md text-primary-fixed-dim">
                      {lang === 'hi' ? 'देय राशि:' : 'Amount due:'}
                    </span>
                    <span className="text-currency-display text-on-primary tracking-tight font-bold">
                      ₹{formattedAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body (2 Columns: Left 5 cols, Right 7 cols) */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
                
                {/* ── LEFT COLUMN: Payment Methods ── */}
                <aside className="md:col-span-5 bg-surface-container-low p-3 sm:p-4 flex flex-col justify-between border-r border-surface-container">
                  <div className="space-y-1.5" role="tablist" aria-label="Payment method">
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider px-3 py-1 font-semibold">
                      {lang === 'hi' ? 'भुगतान विधियां' : 'Payment methods'}
                    </p>

                    {/* Method 1: UPI / QR code */}
                    <button
                      className={`payment-tab w-full text-left p-3.5 rounded-xl flex items-center justify-between gap-2 focus-ring cursor-pointer transition-all ${
                        activeOpt === 'upi'
                          ? 'bg-surface-container-lowest shadow-sm'
                          : 'hover:bg-surface-container-high/60'
                      }`}
                      id="tab-upi"
                      role="tab"
                      aria-selected={activeOpt === 'upi'}
                      aria-controls="pane-upi"
                      onClick={() => setActiveOpt('upi')}
                      type="button"
                    >
                      <span className="flex items-center gap-3.5 min-w-0">
                        <span className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary flex-shrink-0">
                          <span
                            className="material-symbols-outlined text-2xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            qr_code_scanner
                          </span>
                        </span>
                        <span className="flex flex-col text-left min-w-0 flex-1">
                          <span className="text-title-md text-on-surface text-[15px] truncate block font-semibold">
                            UPI / QR code
                          </span>
                          <span className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span className="text-body-sm text-on-surface-variant text-[12px]">
                              GPay, PhonePe, Paytm, BHIM
                            </span>
                            <span className="text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold flex items-center gap-0.5 flex-shrink-0">
                              <span
                                className="material-symbols-outlined text-[12px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                bolt
                              </span>
                              Fastest
                            </span>
                          </span>
                        </span>
                      </span>
                      <span
                        className={`material-symbols-outlined font-bold text-lg tab-chevron flex-shrink-0 ${
                          activeOpt === 'upi' ? 'text-secondary' : 'text-outline-variant'
                        }`}
                      >
                        chevron_right
                      </span>
                    </button>

                    {/* Method 2: Direct bank transfer */}
                    <button
                      className={`payment-tab w-full text-left p-3.5 rounded-xl flex items-center justify-between gap-2 focus-ring cursor-pointer transition-all ${
                        activeOpt === 'bank'
                          ? 'bg-surface-container-lowest shadow-sm'
                          : 'hover:bg-surface-container-high/60'
                      }`}
                      id="tab-bank"
                      role="tab"
                      aria-selected={activeOpt === 'bank'}
                      aria-controls="pane-bank"
                      onClick={() => setActiveOpt('bank')}
                      type="button"
                    >
                      <span className="flex items-center gap-3.5 min-w-0">
                        <span className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0">
                          <span className="material-symbols-outlined text-2xl">account_balance</span>
                        </span>
                        <span className="flex flex-col text-left min-w-0 flex-1">
                          <span className="text-title-md text-on-surface text-[15px] truncate block font-semibold">
                            {lang === 'hi' ? 'सीधा बैंक ट्रांसफर' : 'Direct bank transfer'}
                          </span>
                          <span className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span className="text-body-sm text-on-surface-variant text-[12px]">
                              Instant IMPS / NEFT / RTGS
                            </span>
                            <span className="text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary font-semibold flex-shrink-0">
                              Min ₹2,000
                            </span>
                          </span>
                        </span>
                      </span>
                      <span
                        className={`material-symbols-outlined font-bold text-lg tab-chevron flex-shrink-0 ${
                          activeOpt === 'bank' ? 'text-secondary' : 'text-outline-variant'
                        }`}
                      >
                        chevron_right
                      </span>
                    </button>

                    {/* Method 3: Crypto currency */}
                    <button
                      className={`payment-tab w-full text-left p-3.5 rounded-xl flex items-center justify-between gap-2 focus-ring cursor-pointer transition-all ${
                        activeOpt === 'crypto'
                          ? 'bg-surface-container-lowest shadow-sm'
                          : 'hover:bg-surface-container-high/60'
                      }`}
                      id="tab-crypto"
                      role="tab"
                      aria-selected={activeOpt === 'crypto'}
                      aria-controls="pane-crypto"
                      onClick={() => setActiveOpt('crypto')}
                      type="button"
                    >
                      <span className="flex items-center gap-3.5 min-w-0">
                        <span className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0">
                          <span className="material-symbols-outlined text-2xl">currency_bitcoin</span>
                        </span>
                        <span className="flex flex-col text-left min-w-0 flex-1">
                          <span className="text-title-md text-on-surface text-[15px] truncate block font-semibold">
                            {lang === 'hi' ? 'क्रिप्टो करेंसी' : 'Crypto currency'}
                          </span>
                          <span className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span className="text-body-sm text-on-surface-variant text-[12px]">
                              USDT, BTC, ETH settlement
                            </span>
                            <span className="text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold flex items-center gap-0.5 flex-shrink-0">
                              <span
                                className="material-symbols-outlined text-[12px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                link
                              </span>
                              Web3
                            </span>
                          </span>
                        </span>
                      </span>
                      <span
                        className={`material-symbols-outlined font-bold text-lg tab-chevron flex-shrink-0 ${
                          activeOpt === 'crypto' ? 'text-secondary' : 'text-outline-variant'
                        }`}
                      >
                        chevron_right
                      </span>
                    </button>
                  </div>

                  {/* Buyer Protection Footnote */}
                  <div className="mt-6 p-3 rounded-xl bg-surface-container-high/40 text-on-surface-variant text-center sm:text-left">
                    <div className="flex items-center gap-2 text-on-surface justify-center sm:justify-start">
                      <span className="material-symbols-outlined text-base text-secondary">security</span>
                      <span className="text-label-md font-semibold">MyMobPay Buyer Protection</span>
                    </div>
                    <p className="text-body-sm text-[11px] text-on-surface-variant mt-1 leading-normal">
                      100% money-back guarantee if your order isn&apos;t delivered or the item is counterfeit.
                    </p>
                  </div>
                </aside>

                {/* ── RIGHT COLUMN: Selected Method Detail Pane ── */}
                <section className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between bg-surface-container-lowest">
                  
                  {/* ═══════════════════════════════════════════════════
                      PANE 1: UPI / QR CODE
                  ═══════════════════════════════════════════════════ */}
                  {activeOpt === 'upi' && (
                    <div className="pane-content space-y-6 flex-1" id="pane-upi" role="tabpanel" aria-labelledby="tab-upi">
                      
                      {/* Top UPI App Intents */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h3 className="text-title-md text-on-surface flex items-center gap-1.5 text-[15px] font-semibold">
                            {lang === 'hi' ? 'अपने UPI ऐप से तुरंत भुगतान करें' : 'Pay instantly with your UPI app'}
                          </h3>
                          <span className="text-label-sm text-on-surface-variant font-medium">Tap to open</span>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                          {/* Google Pay */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('Google Pay', 'gpay')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with Google Pay"
                          >
                            <span className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-1.5 p-2">
                              <svg className="w-full h-full" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                              </svg>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">GPay</span>
                          </button>

                          {/* PhonePe */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('PhonePe', 'phonepe')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with PhonePe"
                          >
                            <span className="w-10 h-10 rounded-full bg-[#5f259f] shadow-sm flex items-center justify-center mb-1.5 p-2 text-white font-bold text-sm leading-none">
                              पे
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">PhonePe</span>
                          </button>

                          {/* Paytm */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('Paytm', 'paytm')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with Paytm"
                          >
                            <span className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-1.5 p-1.5 border border-outline-variant/30">
                              <span className="flex flex-col items-center justify-center leading-none">
                                <span className="text-[10px] font-bold text-[#002e6e]">Pay</span>
                                <span className="text-[9px] font-bold text-[#00b9f5]">tm</span>
                              </span>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">Paytm</span>
                          </button>

                          {/* CRED */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('CRED', 'cred')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with CRED"
                          >
                            <span className="w-10 h-10 rounded-full bg-[#000d21] text-white shadow-sm flex items-center justify-center mb-1.5 p-2">
                              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
                              </svg>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">CRED</span>
                          </button>

                          {/* BHIM UPI */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('BHIM UPI', 'bhim')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with BHIM UPI"
                          >
                            <span className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-1.5 p-2 border border-outline-variant/30">
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M4 3h10l6 9-6 9H4l6-9-6-9z" fill="#00a859"/>
                                <path d="M9 7h5l3.5 5-3.5 5H9l3.5-5L9 7z" fill="#ffffff"/>
                              </svg>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">BHIM</span>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic QR Code Box */}
                      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-32 h-32 bg-surface-container-lowest rounded-xl p-2 shadow-sm flex items-center justify-center flex-shrink-0 border border-outline-variant/30">
                          {upiQrValue ? (
                            <QRCode
                              value={upiQrValue}
                              size={110}
                              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                              viewBox="0 0 110 110"
                            />
                          ) : (
                            <div className="text-xs text-on-surface-variant">Loading QR…</div>
                          )}
                          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center p-0.5 border border-outline-variant/30 pointer-events-none">
                            <span className="text-secondary font-black tracking-tighter text-[11px] leading-none">
                              UPI
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                          <div className="inline-flex items-center gap-1.5 bg-surface-container-highest text-secondary px-2.5 py-0.5 rounded-full text-label-sm mb-1.5">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span className="font-mono font-semibold" id="qrTimer">
                              QR expires in {safeMm}:{safeSs}
                            </span>
                          </div>
                          <h4 className="text-title-md text-on-surface font-semibold text-[15px]">
                            Scan with any UPI app to pay ₹{formattedAmount}
                          </h4>
                          <p className="text-body-sm text-on-surface-variant text-[12px] mt-1 leading-relaxed">
                            Open Google Pay, PhonePe, Paytm, CRED or BHIM and point your camera at the code above.
                          </p>
                        </div>
                      </div>

                      {/* Pay directly to merchant VPA */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-title-md text-on-surface text-[14px] font-semibold flex items-center gap-1.5">
                            Pay directly to merchant VPA
                            <span
                              className="material-symbols-outlined text-secondary text-[16px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              verified
                            </span>
                          </span>
                          <span className="text-label-sm text-on-tertiary-container font-semibold px-2 py-0.5 rounded-full bg-surface-container-high/60">
                            Instant verification
                          </span>
                        </div>
                        
                        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-semibold">
                              Merchant UPI ID / VPA
                            </span>
                            <span
                              className="font-mono font-bold text-on-surface text-base tracking-wide select-all"
                              id="merchantVpaText"
                            >
                              {upiId}
                            </span>
                          </div>
                          
                          <button
                            className="focus-ring h-10 px-4 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/30 text-secondary text-label-md font-semibold flex items-center justify-center shadow-sm transition-all flex-shrink-0 gap-1.5 active:scale-95 cursor-pointer"
                            onClick={() => {
                              handleCopyUpi();
                              handleCopyText(upiId, 'upi');
                            }}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px] copy-icon">
                              {copiedField === 'upi' || copyFeedback ? 'check' : 'content_copy'}
                            </span>
                            <span className="copy-label">
                              {copiedField === 'upi' || copyFeedback ? 'Copied!' : 'Copy UPI ID'}
                            </span>
                          </button>
                        </div>

                        <p className="text-body-sm text-on-surface-variant text-[12px] leading-relaxed flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-secondary text-[15px] flex-shrink-0">info</span>
                          <span>
                            Copy this UPI ID into any UPI app to pay <strong className="text-on-surface">₹{formattedAmount}</strong>.
                          </span>
                        </p>
                      </div>

                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════
                      PANE 2: DIRECT BANK TRANSFER
                  ═══════════════════════════════════════════════════ */}
                  {activeOpt === 'bank' && (
                    <div className="pane-content space-y-4 flex-1 animate-fade-in" id="pane-bank" role="tabpanel" aria-labelledby="tab-bank">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-title-md text-on-surface text-[15px] font-semibold">Direct bank-to-bank transfer</h3>
                          <p className="text-body-sm text-on-surface-variant text-[12px]">Direct settlement into the merchant&apos;s account</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold">Zero fees</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-container-low space-y-3">
                        <div className="flex items-center justify-between border-b border-surface-container pb-2">
                          <span className="text-label-sm text-on-surface-variant">Beneficiary name</span>
                          <span className="text-body-md font-semibold text-on-surface">{displayBankName}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-surface-container pb-2">
                          <span className="text-label-sm text-on-surface-variant">Virtual account number</span>
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-on-surface text-sm">{displayBankAcc}</span>
                            <button
                              type="button"
                              className="focus-ring text-secondary cursor-pointer p-0.5 rounded"
                              aria-label="Copy virtual account number"
                              onClick={() => handleCopyText(displayBankAcc, 'acc')}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {copiedField === 'acc' ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-surface-container pb-2">
                          <span className="text-label-sm text-on-surface-variant">IFSC code</span>
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-on-surface text-sm">{displayBankIfsc}</span>
                            <button
                              type="button"
                              className="focus-ring text-secondary cursor-pointer p-0.5 rounded"
                              aria-label="Copy IFSC code"
                              onClick={() => handleCopyText(displayBankIfsc, 'ifsc')}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {copiedField === 'ifsc' ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-label-sm text-on-surface-variant">Transfer mode</span>
                          <span className="text-label-sm text-secondary font-semibold">IMPS / NEFT / RTGS (24x7)</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-surface-container text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-secondary">info</span>
                        <span className="text-body-sm text-[12px]">
                          We verify your transfer automatically once it&apos;s credited — usually within a couple of minutes.
                        </span>
                      </div>

                      <button
                        className="focus-ring w-full h-12 rounded-xl bg-secondary text-on-secondary text-title-md font-semibold shadow-sm hover:bg-[#0038b7] transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                        type="button"
                        onClick={triggerChecking}
                      >
                        <span>{isChecking ? 'Checking status…' : "I've made the transfer"}</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </button>

                      {checkMsg && (
                        <p className="text-center text-xs font-semibold text-on-surface-variant mt-1">
                          {checkMsg}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════
                      PANE 3: CRYPTO CURRENCY
                  ═══════════════════════════════════════════════════ */}
                  {activeOpt === 'crypto' && (
                    <div className="pane-content space-y-4 flex-1 animate-fade-in" id="pane-crypto" role="tabpanel" aria-labelledby="tab-crypto">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-title-md text-on-surface text-[15px] font-semibold">Crypto settlement</h3>
                          <p className="text-body-sm text-on-surface-variant text-[12px]">USDT, BTC, ETH — on-chain gateway</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-label-sm bg-surface-container-highest text-secondary font-bold">Web3 ready</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose a cryptocurrency">
                        <button
                          type="button"
                          onClick={() => setSelectedCrypto('USDT')}
                          className={`crypto-choice focus-ring p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            selectedCrypto === 'USDT'
                              ? 'bg-surface-container-lowest border-2 border-secondary shadow-sm'
                              : 'bg-surface-container border-2 border-transparent hover:bg-surface-container-high'
                          }`}
                          role="radio"
                          aria-checked={selectedCrypto === 'USDT'}
                        >
                          <span className="font-bold text-on-tertiary-container text-sm">USDT</span>
                          <span className="text-label-sm text-on-surface-variant mt-0.5 text-[11px]">TRC20 / ERC20</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedCrypto('BTC')}
                          className={`crypto-choice focus-ring p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            selectedCrypto === 'BTC'
                              ? 'bg-surface-container-lowest border-2 border-secondary shadow-sm'
                              : 'bg-surface-container border-2 border-transparent hover:bg-surface-container-high'
                          }`}
                          role="radio"
                          aria-checked={selectedCrypto === 'BTC'}
                        >
                          <span className="font-bold text-[#f7931a] text-sm">BTC</span>
                          <span className="text-label-sm text-on-surface-variant mt-0.5 text-[11px]">Bitcoin network</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedCrypto('ETH')}
                          className={`crypto-choice focus-ring p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            selectedCrypto === 'ETH'
                              ? 'bg-surface-container-lowest border-2 border-secondary shadow-sm'
                              : 'bg-surface-container border-2 border-transparent hover:bg-surface-container-high'
                          }`}
                          role="radio"
                          aria-checked={selectedCrypto === 'ETH'}
                        >
                          <span className="font-bold text-[#627eea] text-sm">ETH</span>
                          <span className="text-label-sm text-on-surface-variant mt-0.5 text-[11px]">Ethereum mainnet</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-label-sm text-on-surface-variant">Pay amount</span>
                          <span className="font-mono font-bold text-on-surface text-sm" id="cryptoAmount">
                            {cryptoRates[selectedCrypto].amount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-label-sm text-on-surface-variant">
                            Deposit address (<span id="cryptoNetwork">{cryptoRates[selectedCrypto].network}</span>)
                          </span>
                          <button
                            type="button"
                            className="focus-ring text-secondary cursor-pointer p-0.5 rounded"
                            aria-label="Copy deposit address"
                            onClick={() => handleCopyText(cryptoRates[selectedCrypto].address, 'crypto')}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {copiedField === 'crypto' ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest rounded-lg font-mono text-[11px] text-on-surface truncate border border-outline-variant/30 select-all" id="cryptoAddress">
                          {cryptoRates[selectedCrypto].address}
                        </div>
                      </div>

                      <button
                        className="focus-ring w-full h-12 rounded-xl bg-secondary text-on-secondary text-title-md font-semibold shadow-sm hover:bg-[#0038b7] transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                        type="button"
                        onClick={() => announce('Web3 wallet connection will open in supported browser.')}
                      >
                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                        <span>Connect Web3 wallet to pay</span>
                      </button>
                    </div>
                  )}

                  {/* Card Bottom Row (Secure Checkout / Powered by mymob.tech) */}
                  <div className="pt-5 mt-auto flex items-center justify-between text-on-surface-variant border-t border-surface-container-low">
                    <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                      <span
                        className="material-symbols-outlined text-[16px] text-on-tertiary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        lock
                      </span>
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                      <span>Powered by</span>
                      <span className="font-bold text-secondary text-[13px] tracking-tight">mymob.tech</span>
                    </div>
                  </div>

                </section>
              </div>

              {/* Card Footer Bar */}
              <footer className="bg-surface-container-high/60 py-3 px-6 flex flex-wrap items-center justify-between gap-3 text-on-surface-variant">
                <div className="flex items-center gap-2 text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                  <span>Protected by <strong>mymob.tech</strong> 256-bit encryption</span>
                </div>
                <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
                  <span className="font-bold text-on-surface">UPI</span><span>·</span>
                  <span className="font-bold text-on-surface">IMPS / NEFT</span><span>·</span>
                  <span className="font-bold text-on-surface">Web3 USDT</span>
                </div>
              </footer>
            </div>

            {/* Below Card Help & Session Bar */}
            <div className="w-full flex items-center justify-between mt-3 px-2 text-on-surface-variant">
              <button
                className="focus-ring text-label-sm hover:text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
                type="button"
                onClick={() => announce('Need help? Contact support@mymob.tech')}
              >
                <span className="material-symbols-outlined text-[15px]">help</span>
                <span>Need help with payment?</span>
              </button>
              <span className="text-label-sm font-mono text-[12px]">Session ID: {sessionDisplay}</span>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
