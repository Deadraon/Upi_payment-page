'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, Zap, Calendar, Rocket, 
  Building2, Shield, Lock, Clock, Copy, Download, 
  HelpCircle, Languages, X, ExternalLink, RefreshCw, 
  LogOut, ArrowRight, Check, CheckCircle, ChevronRight
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';

export default function ConsoleActivationPaywall({
  profile,
  user,
  fetchProfile,
  fetchSubscriptionHistory,
  historyOrders = [],
  historyLoading = false,
  handleSignOut,
}) {
  const [selectedPlan, setSelectedPlan] = useState('trial'); // 'trial' | '1m' | '3m' | 'custom'
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [statusChecking, setStatusChecking] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  // Countdown timer for QR
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const merchantVpa = CONFIG.upiId || '9410181307@okbizaxis';
  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : 'https://www.mymob.tech/dashboard';
  const merchantId = profile?.id ? `MID-${profile.id.slice(0, 8).toUpperCase()}` : 'MID-884920';

  // Plans config
  const plans = {
    trial: {
      id: 'trial',
      title: language === 'hi' ? '3-दिन निःशुल्क ट्रायल' : '3-Day Free Trial',
      badge: language === 'hi' ? 'अनुशंसित' : 'Recommended',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      priceText: '₹1.00',
      priceSub: language === 'hi' ? '₹1.00 सेटअप शुल्क' : '₹1.00 Setup Fee',
      desc: language === 'hi' ? 'कोई ऑटो-डेबिट नहीं, रिफंडेबल चेक' : 'No auto-debits, refundable check',
      amount: 1,
      note: 'Trial_Setup_3Day',
      icon: Zap,
      iconColor: 'bg-emerald-50 text-emerald-600',
    },
    '1m': {
      id: '1m',
      title: language === 'hi' ? '1 महीना स्टार्टर' : '1 Month Starter',
      badge: '₹499',
      badgeColor: 'bg-sky-100 text-sky-800',
      priceText: '₹499.00',
      priceSub: '₹499 / mo',
      desc: language === 'hi' ? 'पूर्ण डैशबोर्ड और लाइव वेबहुक एक्सेस' : 'Full dashboard & live webhook access',
      amount: 499,
      note: 'Subscription_1Month',
      icon: Calendar,
      iconColor: 'bg-sky-50 text-sky-600',
    },
    '3m': {
      id: '3m',
      title: language === 'hi' ? '3 महीने ग्रोथ' : '3 Months Growth',
      badge: language === 'hi' ? '5% छूट' : 'Save 5%',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      priceText: '₹1,497.00',
      priceSub: '₹1,497 (₹499/mo)',
      desc: language === 'hi' ? '3 महीने का संपूर्ण फिनटेक सूट' : 'Complete 3-month fintech suite',
      amount: 1497,
      note: 'Subscription_3Month',
      icon: Rocket,
      iconColor: 'bg-slate-100 text-slate-700',
    },
    custom: {
      id: 'custom',
      title: language === 'hi' ? 'कस्टम एंटरप्राइज' : 'Custom Enterprise',
      badge: language === 'hi' ? 'संपर्क करें' : 'Contact',
      badgeColor: 'bg-slate-200 text-slate-800',
      priceText: 'Contact',
      priceSub: 'Custom SLA',
      desc: language === 'hi' ? 'वॉल्यूम मूल्य निर्धारण और समर्पित सहायता' : 'Volume pricing & dedicated SLA',
      amount: 0,
      note: 'Custom_Enterprise',
      icon: Building2,
      iconColor: 'bg-slate-100 text-slate-600',
    }
  };

  const currentPlan = plans[selectedPlan] || plans.trial;
  const payUrl = currentPlan.amount > 0 
    ? `/pay?api_key=${CONFIG.platformApiKey}&amount=${currentPlan.amount}&ref=${profile?.id || ''}&note=${currentPlan.note}&callback=${encodeURIComponent(callbackUrl)}`
    : '#';

  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(CONFIG.businessName || 'MyMobPay')}&am=${currentPlan.amount > 0 ? currentPlan.amount.toFixed(2) : '1.00'}&cu=INR&tn=${encodeURIComponent(`${currentPlan.note}_${profile?.id ? profile.id.slice(0, 8) : 'SUB'}`)}`;

  const handleCopyVpa = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(merchantVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    }
  };

  const handleRefreshStatus = async () => {
    setStatusChecking(true);
    try {
      if (user?.id) {
        await fetchProfile(user.id);
        if (fetchSubscriptionHistory) {
          await fetchSubscriptionHistory(user.id);
        }
      }
    } catch (err) {
      console.error('Status sync error:', err);
    } finally {
      setStatusChecking(false);
    }
  };

  const latestPastOrder = historyOrders && historyOrders.length > 0 ? historyOrders[0] : null;

  return (
    <div className="bg-slate-100 font-sans text-slate-800 antialiased min-h-screen flex flex-col justify-center items-center py-6 px-3 sm:px-6">
      
      {/* Floating Trust Pill on Top */}
      <div className="flex items-center space-x-2 bg-white shadow-sm rounded-full px-4 py-1.5 mb-4 border border-slate-200/60">
        <ShieldCheck className="w-4.5 h-4.5 text-[#0284c7]" />
        <span className="text-xs font-semibold text-slate-700">
          Official 256-Bit Encrypted Gateway • <strong>mymob.tech</strong>
        </span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ba9d]"></span>
        <span className="text-[10px] text-[#00ba9d] uppercase tracking-wider font-bold">Live</span>
      </div>

      {/* Main Hosted Checkout Container */}
      <div className="w-full max-w-[840px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-slate-200/80">
        
        {/* Checkout Header */}
        <div className="bg-[#0c2340] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Merchant & Order Identity */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[#0284c7] flex items-center justify-center shadow-md shrink-0 text-white font-black text-xl">
              <span>M</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white tracking-tight">MyMobPay Technologies</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Verified
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 text-xs mt-0.5">
                <span>{merchantId}</span>
                <span>•</span>
                <span className="text-sky-300 font-medium">Merchant Activation &amp; Console Unlock</span>
              </div>
            </div>
          </div>

          {/* Total Price & Controls */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-slate-700/60 sm:border-0 pt-3 sm:pt-0 gap-2">
            <div className="flex items-center space-x-2 mb-1">
              {/* Language Switcher */}
              <button 
                onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
                className="bg-slate-800/80 hover:bg-slate-700 text-sky-200 rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer" 
                type="button"
              >
                <Languages className="w-3.5 h-3.5 text-sky-300" />
                <span>{language === 'en' ? 'English / हिन्दी' : 'हिन्दी / English'}</span>
              </button>
              
              {/* Sign Out Icon */}
              <button 
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center cursor-pointer rounded" 
                title="Sign Out" 
                type="button"
              >
                <X className="w-5 h-5 leading-none" />
              </button>
            </div>
            
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xs text-slate-300 font-medium">
                {language === 'hi' ? 'देय राशि:' : 'Amount Due:'}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" id="headerAmountDue">
                {currentPlan.priceText}
              </span>
            </div>
          </div>

        </div>

        {/* Main Body: Split Rail Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          
          {/* Left Vertical Plans Rail (5 cols) */}
          <aside className="md:col-span-5 bg-slate-50/70 p-3 sm:p-4 flex flex-col justify-between border-r border-slate-100">
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider px-3 py-1 font-bold">
                {language === 'hi' ? 'सक्रियण योजना चुनें' : 'Select Activation Plan'}
              </p>

              {/* Option 1: 3-Day Free Trial (Active Default) */}
              <div 
                onClick={() => setSelectedPlan('trial')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  selectedPlan === 'trial' 
                    ? 'bg-white border-2 border-emerald-500 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="plan-trial"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Zap className="w-6 h-6 fill-emerald-600 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-900">{plans.trial.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                        {plans.trial.badge}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">{plans.trial.priceSub}</p>
                    <p className="text-[11px] text-slate-500">{plans.trial.desc}</p>
                  </div>
                </div>
                {selectedPlan === 'trial' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 font-bold" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-300 font-bold" />
                )}
              </div>

              {/* Option 2: 1 Month Starter */}
              <div 
                onClick={() => setSelectedPlan('1m')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  selectedPlan === '1m' 
                    ? 'bg-white border-2 border-sky-500 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="plan-1m"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                    <Calendar className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-900">{plans['1m'].title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                        {plans['1m'].badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{plans['1m'].desc}</p>
                  </div>
                </div>
                {selectedPlan === '1m' ? (
                  <CheckCircle2 className="w-5 h-5 text-sky-600 font-bold" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-300 font-bold" />
                )}
              </div>

              {/* Option 3: 3 Months Growth */}
              <div 
                onClick={() => setSelectedPlan('3m')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  selectedPlan === '3m' 
                    ? 'bg-white border-2 border-emerald-500 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="plan-3m"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Rocket className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-900">{plans['3m'].title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        {plans['3m'].badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-900 font-semibold mt-0.5">
                      ₹1,497 <span className="text-slate-400 font-normal text-[11px]">(₹499/mo)</span>
                    </p>
                  </div>
                </div>
                {selectedPlan === '3m' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 font-bold" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-300 font-bold" />
                )}
              </div>

              {/* Option 4: Custom Enterprise */}
              <div 
                onClick={() => { setSelectedPlan('custom'); setShowEnterpriseModal(true); }}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  selectedPlan === 'custom'
                    ? 'bg-white border-2 border-slate-700 shadow-sm'
                    : 'bg-white/60 hover:bg-white border border-dashed border-slate-300'
                }`}
                id="plan-custom"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800">{plans.custom.title}</span>
                    <p className="text-[11px] text-slate-500">{plans.custom.desc}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-sky-600 hover:underline">
                  {plans.custom.badge}
                </span>
              </div>
            </div>

            {/* Merchant Safeguard Footnote / Guarantee */}
            <div className="mt-4 p-3 rounded-xl bg-slate-100/80 text-slate-600 text-left">
              <div className="flex items-center space-x-2 text-slate-800">
                <Shield className="w-4 h-4 text-[#0284c7]" />
                <span className="text-xs font-bold">MyMobPay Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Direct-to-bank settlement, live webhooks, zero intermediary retention, 100% money back guarantee.
              </p>
            </div>
          </aside>

          {/* Right Active Content Pane (7 cols) */}
          <section className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between bg-white">
            <div className="space-y-5 flex-1">
              
              {/* Subsection 1: Supported UPI Apps Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Supported UPI Apps</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] inline-block"></span>
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Accepted across all apps</span>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                  {/* GPay */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center mb-1.5 p-2">
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-slate-800 truncate w-full">Google Pay</span>
                  </div>

                  {/* PhonePe */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-[#5f259f] shadow-xs flex items-center justify-center mb-1.5 p-2 text-white">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 8.36 4 5.33 6.59 4.64 10.04 2.5 10.53 1 12.56 1 14.9 1 17.72 3.28 20 6.1 20H18c2.76 0 5-2.24 5-5 0-2.45-1.76-4.47-4.04-4.88z" opacity="0.2"></path>
                        <text fill="white" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" textAnchor="middle" x="12" y="16.5">पे</text>
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-slate-800 truncate w-full">PhonePe</span>
                  </div>

                  {/* Paytm */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center mb-1.5 p-1.5 border border-slate-200">
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-[10px] font-bold text-[#002e6e] tracking-tight">Pay</span>
                        <span className="text-[9px] font-bold text-[#00b9f5] tracking-tight">tm</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-800 truncate w-full">Paytm</span>
                  </div>

                  {/* CRED */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white shadow-xs flex items-center justify-center mb-1.5 p-2">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 3.2c1.78 0 3.2 1.42 3.2 3.2 0 1.25-.71 2.33-1.74 2.86l2.14 3.74h-2.3l-1.3-2.3h-.5v2.3h-1.9V5.2h2.4zm-.5 1.7h-.5v2.1h.5c.58 0 1.05-.47 1.05-1.05s-.47-1.05-1.05-1.05z"></path>
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-slate-800 truncate w-full">CRED</span>
                  </div>

                  {/* BHIM */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center mb-1.5 p-2 border border-slate-200">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M4 3h10l6 9-6 9H4l6-9-6-9z" fill="#00a859"></path>
                        <path d="M9 7h5l3.5 5-3.5 5H9l3.5-5L9 7z" fill="#ffffff"></path>
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-slate-800 truncate w-full">BHIM UPI</span>
                  </div>
                </div>
              </div>

              {/* Subsection 2: Scan UPI QR Code Banner */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-slate-200/60">
                {/* Live Dynamic QR Container */}
                <div className="relative w-32 h-32 bg-white rounded-xl p-2 shadow-sm flex items-center justify-center shrink-0 border border-slate-200">
                  <QRCode
                    value={upiIntentUri}
                    size={110}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 110 110`}
                  />
                  <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center p-0.5 border border-slate-200 pointer-events-none">
                    <span className="text-[#0284c7] font-black tracking-tighter text-[10px] leading-none">UPI</span>
                  </div>
                </div>

                {/* QR Instructions and Live Ticker */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center space-x-1.5 bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono">QR expires in {formatTime(timeLeft)}</span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-900">
                    Scan with any UPI app to pay {currentPlan.priceText}
                  </h4>
                  
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Open Google Pay, PhonePe, Paytm, CRED or BHIM on your phone and point camera to complete activation.
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <a
                      href={payUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      <span>Pay {currentPlan.priceText} via UPI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>

                    <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant API unlock</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subsection 3: Enter UPI ID / VPA */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Pay directly to Merchant VPA
                    <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    Instant Verification
                  </span>
                </div>
                
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Merchant UPI ID / VPA
                    </span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 text-sm tracking-wide select-all">
                        {merchantVpa}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleCopyVpa}
                    className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-sky-700 text-xs font-semibold flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 gap-1.5" 
                    type="button"
                  >
                    {copiedVpa ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
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

              {/* Past Payment Reference Note & Status Sync */}
              <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">
                  {latestPastOrder ? (
                    <>
                      Past Subscription: <strong className="text-slate-700 font-semibold">₹{latestPastOrder.amount} {latestPastOrder.status}</strong> (Ref: {latestPastOrder.id?.slice(0, 8)})
                    </>
                  ) : (
                    <>
                      Account Status: <strong className="text-amber-600 font-semibold">Activation Required</strong>
                    </>
                  )}
                </span>
                
                <button
                  onClick={handleRefreshStatus}
                  disabled={statusChecking}
                  className="inline-flex items-center text-sky-600 hover:text-sky-800 font-semibold gap-1 text-[11px] cursor-pointer disabled:opacity-50"
                  type="button"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statusChecking ? 'animate-spin' : ''}`} />
                  <span>{statusChecking ? 'Checking status...' : 'Check Payment & Unlock'}</span>
                </button>
              </div>

            </div>

            {/* Active Pane Security Reassurance Footnote */}
            <div className="pt-4 mt-4 flex items-center justify-between text-slate-500 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium">100% Safe &amp; Secure Activation</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
                <span>Powered by</span>
                <span className="font-bold text-[#0284c7] tracking-tight">mymob.tech</span>
              </div>
            </div>

          </section>

        </div>

        {/* Trust Badges Bottom Banner */}
        <footer className="bg-slate-100 py-3 px-6 flex flex-wrap items-center justify-between gap-3 text-slate-600 text-xs border-t border-slate-200">
          <div className="flex items-center space-x-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
            <span>Protected by <strong>mymob.tech</strong> military-grade 256-bit encryption</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500">
            <span className="font-bold text-slate-800">UPI</span>
            <span>•</span>
            <span className="font-bold text-slate-800">IMPS / NEFT</span>
            <span>•</span>
            <span className="font-bold text-slate-800">Web3 USDT</span>
            <span>•</span>
            <span className="inline-flex items-center bg-white px-2 py-0.5 rounded shadow-xs font-semibold text-[11px] text-slate-800 border border-slate-200">
              Instant Bank Settlement
            </span>
          </div>
        </footer>

      </div>

      {/* Sub-modal Quick Help and Dismiss Controls */}
      <div className="w-full max-w-[840px] flex items-center justify-between mt-3 px-2 text-slate-500 text-xs">
        <button 
          onClick={() => setShowHelpModal(true)}
          className="hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer" 
          type="button"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need help with activation?</span>
        </button>
        <span className="font-mono text-[12px]">Session ID: MMP_{profile?.id ? profile.id.slice(0, 8).toUpperCase() : 'M982_6301A'}</span>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-600" />
                Activation Assistance
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once you pay the ₹1.00 setup fee or subscription fee using any UPI app (GPay, PhonePe, Paytm), your merchant console automatically activates within 5 seconds.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p><strong>Merchant Support:</strong> support@mymob.tech</p>
              <p><strong>WhatsApp Support:</strong> +91 9410181307</p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom Enterprise Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0284c7]" />
                Custom Enterprise Activation
              </h3>
              <button onClick={() => setShowEnterpriseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Processing high volumes? Get custom negotiated flat-rate pricing, dedicated account managers, 99.99% SLA, and custom bank routing.
            </p>
            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs space-y-1.5 text-slate-800">
              <p><strong>Email:</strong> enterprise@mymob.tech</p>
              <p><strong>Direct Desk:</strong> +91 9410181307</p>
              <p className="text-[11px] text-sky-700">Response within 2 hours guaranteed.</p>
            </div>
            <div className="flex gap-2">
              <a
                href="mailto:enterprise@mymob.tech?subject=Enterprise%20Plan%20Inquiry"
                className="flex-1 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-center rounded-xl text-xs font-bold transition-all"
              >
                Send Email
              </a>
              <button
                onClick={() => setShowEnterpriseModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
