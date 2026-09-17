'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import { 
  ArrowRight, CheckCircle2, ChevronRight, Menu, X, 
  ArrowUpRight, ShieldCheck, Zap, Layers, RefreshCw, 
  Key, Landmark, Code, Play, Star, Plus, Minus, Info, Lock, Sparkles, QrCode,
  Copy, Check, Smartphone, Building2, Bell, Terminal, Globe
} from 'lucide-react';
import InteractiveBackground from '@/components/InteractiveBackground';

const MyMobPayLogo = ({ className = 'w-48 h-auto', textColor = 'var(--text-primary)' }) => (
  <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
    <text x="2" y="42" letterSpacing="0">
      {/* MyMob */}
      <tspan fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="36" fill={textColor}>MyMob</tspan>
      {/* Pay */}
      <tspan fontFamily="'Orbitron', sans-serif" fontWeight="900" fontStyle="italic" fontSize="36" fill="#3B82F6" dx="3">Pay</tspan>
    </text>
  </svg>
);

export default function HomePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [monthlyVolume, setMonthlyVolume] = useState(500000); // 5 Lakhs default
  const [productCategory, setProductCategory] = useState('accept');
  const [productSubFilter, setProductSubFilter] = useState('top');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPaymentsMenu, setShowPaymentsMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroTab, setHeroTab] = useState('checkout'); // 'checkout' | 'console'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Interactive Live Invoice demo states
  const [demoAmount, setDemoAmount] = useState('500');
  const [demoNote, setDemoNote] = useState('Payment_Note');

  const subscriptionFee = CONFIG.subscriptionFee || 499;

  // Pricing Savings Calculator
  const savings = useMemo(() => {
    const traditionalGatewayFee = monthlyVolume * 0.02; // 2% typical fee
    const traditionalAnnual = traditionalGatewayFee * 12;
    const mymobpayAnnual = subscriptionFee * 12;
    const monthlySavings = Math.max(0, traditionalGatewayFee - subscriptionFee);
    const annualSavings = Math.max(0, traditionalAnnual - mymobpayAnnual);

    return {
      traditionalFee: traditionalGatewayFee,
      mymobpayFee: subscriptionFee,
      monthly: monthlySavings,
      annual: annualSavings
    };
  }, [monthlyVolume, subscriptionFee]);

  const copyPaymentLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-blue-500/10 selection:text-blue-600 relative">
      <InteractiveBackground />
      
      {/* ────────────────────────────────────────────────────────
         ORIGINAL FULL-WIDTH STATIC HEADER WITH MULTI-LAYERED SHADOWS
         ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.04)] transition-all">
        {/* ── TOP ANNOUNCEMENT BANNER ── */}
        <div className="w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white text-[11px] sm:text-xs font-medium py-2 px-4 flex items-center justify-center gap-2.5 select-none border-b border-white/10 shadow-xs">
          <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-400/30 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <span className="text-slate-100 font-normal truncate">
            Direct bank transfer (IMPS / NEFT) with <strong className="text-white font-semibold">0% gateway fees</strong>.
          </span>
          <a href="#pricing-section" className="inline-flex items-center gap-1 text-sky-300 hover:text-white font-medium text-[11px] sm:text-xs transition-colors group ml-1 shrink-0">
            <span className="underline underline-offset-2">Compare savings</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        <div className="w-full px-6 md:px-10 h-20 flex items-center justify-between relative">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none group">
            <MyMobPayLogo className="w-48 h-auto" />
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            <div 
              onMouseEnter={() => setShowPaymentsMenu(true)}
              onMouseLeave={() => setShowPaymentsMenu(false)}
              className="relative py-4"
            >
              <Link 
                href="#products-showcase"
                className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                Payments
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showPaymentsMenu ? 'rotate-180 text-blue-650' : 'text-slate-450'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
            <Link 
              href="#pricing-section"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="#how-it-works"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </Link>
            <Link href="/terms" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Privacy
            </Link>
          </nav>

          {/* Mega Menu Dropdown */}
          {showPaymentsMenu && (
            <div 
              onMouseEnter={() => setShowPaymentsMenu(true)}
              onMouseLeave={() => setShowPaymentsMenu(false)}
              className="absolute top-[72px] left-6 right-6 bg-white border border-slate-200 rounded-[28px] shadow-[0_8px_16px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08),0_40px_80px_rgba(0,0,0,0.12)] p-9 grid grid-cols-1 md:grid-cols-12 gap-8 z-50 animate-scale-up"
            >
              {/* Column 1: Online Payments (5 cols) */}
              <div className="md:col-span-5 space-y-5">
                <h4 className="text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2.5 select-none">Accept payments online</h4>
                
                <div className="space-y-1">
                  <div 
                    onClick={() => {
                      setShowPaymentsMenu(false);
                      setProductCategory('accept');
                      document.getElementById('products-showcase')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-xs">
                      <Landmark className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                        Payment gateway
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">Active</span>
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Direct UPI checkout and scan routes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-xs">
                      <ArrowUpRight className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Payment links
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Share dynamic invoice links over SMS and messaging.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-xs">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Payment pages
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Centralized hosted checkout pages for your brand.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-xs">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        UPI QR codes
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Dynamic QR code widgets with auto-verification.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setShowPaymentsMenu(false);
                      setProductCategory('imps');
                      document.getElementById('products-showcase')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-start gap-4 p-2.5 hover:bg-emerald-50/50 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-emerald-200 transition-colors shadow-xs">
                      <Landmark className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-2 group-hover:text-emerald-700 transition-colors">
                        Bank transfer (IMPS)
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">0% MDR</span>
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Direct high-value transfers with bank email reconciliation.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Easy Integration options (4 cols) */}
              <div className="md:col-span-4 space-y-5">
                <h4 className="text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2.5 select-none">Easy integration options</h4>
                
                <div className="space-y-1">
                  <div 
                    onClick={() => {
                      setShowPaymentsMenu(false);
                      setProductCategory('accept');
                      document.getElementById('products-showcase')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-xs">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Instant payment links
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Generate ready-to-share dynamic invoice URLs.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-xs">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                        UPI QR and app scan
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">New</span>
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Native scanning across all standard UPI applications.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-xs">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Automated bank matching
                      </h5>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">Instant bank credit detection and automated webhook dispatch.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Platform Metrics (3 cols) */}
              <div className="md:col-span-3 space-y-5">
                <h4 className="text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2.5 select-none">Platform metrics</h4>
                
                <div className="space-y-4 select-none">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs font-medium text-blue-600 block">Direct settlements</span>
                    <p className="text-xl font-bold text-slate-900 leading-none">0 seconds</p>
                    <p className="text-xs text-slate-500 font-normal leading-relaxed">Direct-to-bank with zero escrow holds.</p>
                  </div>

                  <div className="p-5 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs font-medium text-emerald-700 block">Transaction fee</span>
                    <p className="text-xl font-bold text-emerald-700 leading-none">0% flat rate</p>
                    <p className="text-xs text-slate-500 font-normal leading-relaxed">Retain 100% of your sales volume.</p>
                  </div>
                </div>
              </div>

              {/* Footer row inside dropdown */}
              <div className="md:col-span-12 border-t border-slate-100 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 font-medium select-none">
                <span>Flat monthly subscription with zero gateway percentage fees</span>
                <div className="flex gap-4">
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors">Go to merchant console →</Link>
                </div>
              </div>

            </div>
          )}

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/60 border border-slate-200 transition-all shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
            >
              Login
            </Link>
            <Link 
              href="/login"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25),0_8px_24px_rgba(37,99,235,0.15)] active:scale-98"
            >
              Sign Up Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 top-20 z-40 bg-white flex flex-col pt-8 px-6 pb-8 animate-fadeIn border-t border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col space-y-4">
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>How It Works</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Subscription Pricing</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Platform Features</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <Link href="/terms" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Terms of Service</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link href="/privacy" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Privacy Policy</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          <div className="flex-1"></div>

          <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3.5 border border-slate-200 text-center font-bold text-slate-700 hover:text-slate-900 rounded-2xl transition-all text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
            >
              Sign In to Console
            </Link>
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-center font-bold rounded-2xl transition-all text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)]"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
         HERO SECTION WITH PREMIUM CUSTOM GRAPHICS
         ──────────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────
         FLAGSHIP HERO SECTION (Razorpay-Grade Clean Light Fintech)
         ──────────────────────────────────────────────────────── */}
      <section className="relative mt-20 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
        
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] opacity-50 -z-20" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Authoritative Fintech Headline & Reassuring Copy */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Direct P2P Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700 shadow-xs animate-fade-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Direct UPI & bank transfer rails active · 0% MDR</span>
            </div>

            {/* Authoritative Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold text-slate-900 tracking-tight leading-[1.12] animate-fade-up delay-100">
              Accept payments directly <br className="hidden sm:inline" />
              to your bank. <br />
              <span className="text-blue-600">Zero gateway fees.</span>
            </h1>

            {/* Calm, Reassuring Subhead */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed animate-fade-up delay-150">
              Collect direct UPI and IMPS bank transfers with automated real-time reconciliation, signed HMAC webhooks, and 0% intermediary deductions.
            </p>

            {/* Razorpay-Grade Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-up delay-200">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-98 text-center text-sm flex items-center justify-center gap-2 group"
              >
                <span>Sign up now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a 
                href="#how-it-works"
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-center flex items-center justify-center gap-2 text-sm shadow-xs hover:border-slate-300"
              >
                <span>Explore live checkout</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Proof Stats Row */}
            <div className="pt-4 grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto lg:mx-0 border-t border-slate-200/80 text-slate-500 font-medium text-xs animate-fade-up delay-300">
              <div>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">0%</p>
                <p className="mt-1 text-xs text-slate-500 font-normal">Transaction fees</p>
              </div>
              <div>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">T+0</p>
                <p className="mt-1 text-xs text-slate-500 font-normal">Instant bank credit</p>
              </div>
              <div>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">99.98%</p>
                <p className="mt-1 text-xs text-slate-500 font-normal">Success rate</p>
              </div>
            </div>

          </div>

          {/* Right Column Custom Render Mockup Graphic (Old Style Phone Scanner) */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end animate-scale-up">
            
            {/* Premium Interactive Phone Glow Container */}
            <div className="phone-glow-container w-full max-w-[340px]">

              {/* Premium Phone Frame displaying Actual MyMobPay checkout screen */}
              <div className="relative w-full bg-slate-900 border-8 border-slate-800 rounded-[44px] premium-phone-shadow overflow-hidden aspect-[9/18.5] flex flex-col">
              
              {/* Speaker / Camera Notch (Dynamic Island) */}
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-30">
                <div className="bg-slate-800 w-28 h-4 rounded-b-2xl" />
              </div>

              {/* Internal Screen Content */}
              <div className="flex-1 bg-[#0B192C] pt-8 px-5 pb-5 flex flex-col justify-between font-sans select-none text-white">
                
                {/* Header Info */}
                <div className="space-y-4">
                  
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                    <span>10:42 AM</span>
                    <div className="flex items-center gap-1">
                      <span>LTE</span>
                      <div className="w-4 h-2 border border-slate-350 rounded-sm p-0.5 flex items-center">
                        <div className="bg-slate-400 w-full h-full rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <MyMobPayLogo className="w-36 h-auto" textColor="#FFFFFF" />
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Direct bank checkout</p>
                  </div>

                  {/* Due amount card */}
                  <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                      <span>Total due</span>
                      <span className="text-[#3395FF] font-semibold bg-[#0B2447] px-2 py-0.5 rounded text-[9px]">Direct bank rail</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                      <span className="text-3xl font-bold text-white tracking-tight leading-none">
                        {parseFloat(demoAmount || '500').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#1D2D44] flex justify-between text-[10px] font-medium text-slate-400">
                      <span>Paying to:</span>
                      <span className="font-semibold text-slate-200">Demo Store</span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white-pure border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center space-y-3 relative overflow-hidden group">
                    
                    {/* Futuristic Scanning Laser line */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#3395FF] to-transparent top-0 animate-laser" />

                    {/* Highly stylized SVG vector QR Code */}
                    <svg viewBox="0 0 100 100" className="w-32 h-32 text-slate-800" fill="currentColor">
                      {/* Quiet Zone borders */}
                      <path d="M0,0 h28 v8 h-20 v20 h-8 z M72,0 h28 v28 h-8 v-20 h-20 z M0,72 h8 v20 h-20 v-28 h8 z M72,100 h28 v-28 h-8 v20 h-20 z" fill="#00529B" opacity="0.15" />
                      
                      {/* Dynamic Modules - Grid mock points */}
                      <rect x="10" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="17" width="6" height="6" fill="#3B82F6" />

                      <rect x="70" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="74" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="77" y="17" width="6" height="6" fill="#3B82F6" />

                      <rect x="10" y="70" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="74" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="77" width="6" height="6" fill="#3B82F6" />

                      {/* Random mock QR dots */}
                      <path d="M40,10 h6 v6 h-6 z M50,15 h8 v4 h-8 z M45,25 h10 v4 h-10 z M35,35 h8 v8 h-8 z M55,35 h12 v4 h-12 z M35,50 h12 v4 h-12 z M50,50 h6 v6 h-6 z M10,40 h8 v8 h-8 z M25,45 h10 v4 h-10 z M70,40 h8 v6 h-8 z M82,45 h8 v4 h-8 z M70,55 h12 v4 h-12 z M10,55 h6 v6 h-6 z M80,70 h10 v8 h-10 z M80,85 h8 v8 h-8 z M40,70 h6 v10 h-6 z M52,75 h8 v4 h-8 z M45,85 h12 v4 h-12 z" fill="#0F172A" />
                      
                      {/* Custom Center Logo */}
                      <rect x="40" y="40" width="20" height="20" fill="#3B82F6" rx="4" />
                      <text x="50" y="54" fontFamily="'Orbitron', sans-serif" fontWeight="950" fontSize="14" fill="#FFFFFF" textAnchor="middle">M</text>
                    </svg>

                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auto-verify active
                    </span>

                  </div>

                </div>

                {/* Footer Section */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  
                  {/* Universal UPI Indicators */}
                  <div className="space-y-2">
                    <p className="text-[9px] text-slate-400 font-medium text-center">Scan with any UPI app</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-blue-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">UPI QR</span>
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-emerald-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">Direct pay</span>
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-indigo-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">Instant rail</span>
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-sky-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">Auto-match</span>
                    </div>
                  </div>

                  {/* Security copy */}
                  <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium text-slate-400 text-center">
                    <Lock className="w-3 h-3 text-slate-400" /> Secure checkout by MyMobPay
                  </div>

                </div>

              </div>

            </div>

            </div> {/* closes phone-glow-container */}

            {/* Metric float chips */}
            <div className="absolute -left-6 top-1/4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1 -rotate-6 animate-float">
              <span className="text-[10px] font-semibold text-blue-600 leading-none">Platform average</span>
              <span className="text-[10px] font-medium text-slate-500 leading-none mt-0.5">Success rate</span>
              <span className="text-xl font-bold text-slate-900 leading-none mt-1">99.98%</span>
            </div>

            <div className="absolute -right-6 bottom-1/4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1 rotate-6 animate-float delay-500">
              <span className="text-[10px] font-semibold text-blue-600 leading-none">Real-time routing</span>
              <span className="text-[10px] font-medium text-slate-500 leading-none mt-0.5">Settlement</span>
              <span className="text-xl font-bold text-emerald-600 leading-none mt-1">0 seconds</span>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         TRUSTED BY FOUNDERS & STARTUPS TICKER (Razorpay-Style)
         ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-10 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-5">
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Powering 10,000+ modern founders, developers, and fast-growing businesses across India
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            {/* Startup Brand 1: KwickBill */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">K</div>
              <span>KwickBill</span>
            </div>
            {/* Startup Brand 2: ScaleLoop */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">S</div>
              <span>ScaleLoop</span>
            </div>
            {/* Startup Brand 3: DevStack */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">D</div>
              <span>DevStack</span>
            </div>
            {/* Startup Brand 4: NexaCart */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black">N</div>
              <span>NexaCart</span>
            </div>
            {/* Startup Brand 5: IndieFlow */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs font-black">I</div>
              <span>IndieFlow</span>
            </div>
            {/* Startup Brand 6: ZetaPay */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-black">Z</div>
              <span>ZetaPay</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         CODED DASHBOARD SHOWCASE (Clean Light Theme)
         ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 bg-transparent border-y border-slate-200/60 overflow-hidden">

        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Merchant console
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Full visibility into payments and settlements
            </h2>
            <p className="text-base text-slate-600 font-normal leading-relaxed max-w-lg mx-auto">
              Monitor real-time payments, webhook delivery logs, and bank reconciliations from a single console.
            </p>
          </div>

          {/* === CODED DASHBOARD MOCKUP (LIGHT THEME) === */}
          <div className="relative">

            {/* Browser frame */}
            <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.08)]">

              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/90 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-2">
                  <div className="bg-white border border-slate-200 rounded-md px-3 py-1 flex items-center gap-2 max-w-xs mx-auto shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-slate-600 font-mono">dashboard.mymobpay.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-700 font-semibold">Live</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="flex min-h-[480px]">

                {/* Sidebar */}
                <div className="hidden md:flex w-[180px] bg-slate-50/80 border-r border-slate-200 flex-col py-6 px-3 gap-1 flex-shrink-0">
                  <div className="px-3 pb-4">
                    <MyMobPayLogo className="w-28 h-auto" textColor="#0F172A" />
                  </div>
                  {[
                    { label: 'Dashboard', active: true, dot: 'bg-blue-500' },
                    { label: 'Orders', active: false, dot: null },
                    { label: 'Analytics', active: false, dot: null },
                    { label: 'Settlements', active: false, dot: null },
                    { label: 'Webhooks', active: false, dot: 'bg-amber-400' },
                    { label: 'API Keys', active: false, dot: null },
                    { label: 'Sandbox', active: false, dot: null },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      item.active
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}>
                      <span>{item.label}</span>
                      {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                    </div>
                  ))}
                </div>

                {/* Main panel */}
                <div className="flex-1 p-5 sm:p-6 space-y-5 bg-white overflow-hidden">

                  {/* Top stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Total revenue', value: '₹4,82,500', change: '+12.4%', color: 'text-emerald-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Transactions', value: '1,842', change: '+8.1%', color: 'text-blue-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Success rate', value: '99.98%', change: '+0.02%', color: 'text-emerald-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Avg. settlement', value: '0.0s', change: 'Real-time', color: 'text-indigo-700', bg: 'bg-slate-50 border-slate-200' },
                    ].map(stat => (
                      <div key={stat.label} className={`${stat.bg} border rounded-xl p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all`}>
                        <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                        <p className="text-base sm:text-lg font-bold text-slate-900">{stat.value}</p>
                        <p className={`text-[10px] font-medium ${stat.color}`}>{stat.change}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart + Recent Transactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Chart */}
                    <div className="lg:col-span-2 bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900">Revenue (last 30 days)</p>
                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-semibold">Live</span>
                      </div>
                      {/* SVG Sparkline chart */}
                      <svg viewBox="0 0 400 80" className="w-full h-20" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area fill */}
                        <path d="M0,65 C20,60 40,50 60,45 C80,40 100,55 120,48 C140,41 160,30 180,25 C200,20 220,35 240,28 C260,21 280,15 300,18 C320,21 340,10 360,8 C380,6 400,12 400,12 L400,80 L0,80 Z" fill="url(#chartGrad)" />
                        {/* Line */}
                        <path d="M0,65 C20,60 40,50 60,45 C80,40 100,55 120,48 C140,41 160,30 180,25 C200,20 220,35 240,28 C260,21 280,15 300,18 C320,21 340,10 360,8 C380,6 400,12 400,12" fill="none" stroke="#2563EB" strokeWidth="2.5" />
                        {/* Grid lines */}
                        {[20, 40, 60].map(y => (
                          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#E2E8F0" strokeWidth="0.75" strokeDasharray="4" />
                        ))}
                        {/* Dot on peak */}
                        <circle cx="360" cy="8" r="4" fill="#2563EB" />
                        <circle cx="360" cy="8" r="8" fill="#2563EB" opacity="0.25" />
                      </svg>
                      <div className="flex justify-between text-[8px] text-slate-400 font-medium">
                        {['Aug 1','Aug 7','Aug 14','Aug 21','Aug 26'].map(d => <span key={d}>{d}</span>)}
                      </div>
                    </div>

                    {/* Recent transactions */}
                    <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <p className="text-xs font-semibold text-slate-900">Recent payments</p>
                      <div className="space-y-2">
                        {[
                          { id: '#MP0891', upi: 'raj@okaxis', amt: '₹4,500', status: 'Success' },
                          { id: '#MP0890', upi: 'sara@ybl', amt: '₹1,200', status: 'Success' },
                          { id: '#MP0889', upi: 'dev@paytm', amt: '₹800', status: 'Pending' },
                          { id: '#MP0888', upi: 'mia@upi', amt: '₹12,000', status: 'Success' },
                        ].map(tx => (
                          <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-slate-200/60 last:border-0">
                            <div>
                              <p className="text-[10px] font-semibold text-blue-600">{tx.id}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{tx.upi}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-semibold text-slate-900">{tx.amt}</p>
                              <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${
                                tx.status === 'Success'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>{tx.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Bottom metric chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Uptime SLA', value: '99.99%', icon: <ShieldCheck className="w-4 h-4" />, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
              { label: 'Webhook latency', value: '<200ms', icon: <Zap className="w-4 h-4" />, iconBg: 'bg-blue-50 text-blue-600 border-blue-200' },
              { label: 'Avg. settlement', value: '0 sec', icon: <RefreshCw className="w-4 h-4" />, iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
            ].map(m => (
              <div key={m.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
                  {m.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-normal">{m.label}</p>
                  <p className="text-lg font-bold text-slate-900">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         HOW IT WORKS — CLEAN & MINIMAL 3-STEP FLOW
         ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24 bg-transparent border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Direct settlement flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              How direct bank payments work in three steps
            </h2>
            <p className="text-base text-slate-600 font-normal leading-relaxed">
              Eliminate gateway holding periods and 2% fees with direct account-to-account settlement.
            </p>
          </div>

          {/* 3 Clean & Minimal Cards with Real Images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* STEP 1: Scan or Transfer */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-5">
                {/* 3D Step Image */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                  <Image
                    src="/images/step_1_scan.jpg"
                    alt="Customer scans UPI QR code"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200/80">
                    01
                  </span>
                  <span className="text-xs font-semibold text-slate-700">Scan or transfer</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900">Customer scans and pays</h3>
                  <p className="text-sm text-slate-500 font-normal leading-relaxed">
                    Customer opens any installed UPI application to scan and pay, or transfers directly via IMPS / NEFT for zero-fee high-value orders.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Settlement time: Instant</span>
                <span className="text-blue-600 flex items-center gap-1">0% gateway fee <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /></span>
              </div>
            </div>

            {/* STEP 2: Direct Route */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-5">
                {/* 3D Step Image */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                  <Image
                    src="/images/step_2_route.jpg"
                    alt="Direct bank-to-bank transfer routing with zero middleman"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-200/80">
                    02
                  </span>
                  <span className="text-xs font-semibold text-slate-700">Direct routing</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900">Direct account-to-account routing</h3>
                  <p className="text-sm text-slate-500 font-normal leading-relaxed">
                    Transactions route directly through bank UPI rail parameters into your own merchant account with zero escrow holding accounts.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Intermediaries: Zero</span>
                <span className="text-indigo-600 flex items-center gap-1">Direct bank route <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /></span>
              </div>
            </div>

            {/* STEP 3: Instant Settlement */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-5">
                {/* 3D Step Image */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                  <Image
                    src="/images/step_3_settle.jpg"
                    alt="Instant bank credit and liquidity settlement"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center border border-emerald-200/80">
                    03
                  </span>
                  <span className="text-xs font-semibold text-slate-700">Instant settlement</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900">Instant settlement and webhook delivery</h3>
                  <p className="text-sm text-slate-500 font-normal leading-relaxed">
                    Funds land in your bank account immediately while HMAC-SHA256 signed webhooks notify your application in under 200ms.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Escrow hold: 0 days</span>
                <span className="text-emerald-600 flex items-center gap-1">Real-time credit <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         DISRUPTION & INNOVATION SHOWCASE (RAZORPAY STYLE)
         ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 bg-transparent border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
            Eliminate gateway intermediaries and retain your full revenue.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Card: Wide 8 cols */}
            <div className="lg:col-span-8 bg-slate-50/80 border border-slate-200/90 rounded-3xl p-8 sm:p-12 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-6">
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 tracking-tight">
                    Direct bank settlement rail
                  </span>
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 bg-white shadow-xs">
                    <Globe className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug tracking-tight my-4 sm:my-8">
                  <span className="text-blue-600">Route payments directly to your bank account,</span> saving on intermediary transaction fees with instant UPI and IMPS transfers.
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-normal text-slate-500 pt-4 border-t border-slate-200/60 leading-relaxed">
                Receive direct account transfers with zero escrow delays via automated bank email reconciliation.
              </p>
            </div>

            {/* Right Card: 4 cols */}
            <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200/90 rounded-3xl p-8 sm:p-10 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
                  <span className="text-blue-600">Experience instant settlements</span> with 99.98% reliability, zero escrow holding periods, and no percentage-based gateway deductions.
                </h3>
                <div className="my-8 sm:my-12 flex justify-end">
                  <Link 
                    href="/login"
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 group"
                  >
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-normal text-slate-500 pt-4 border-t border-slate-200/60 leading-relaxed">
                A dependable direct payment solution engineered for fast-moving Indian businesses.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         PRODUCT SUITE WITH TABS & 4-CARD GRID (RAZORPAY STYLE)
         ──────────────────────────────────────────────────────── */}
      <section id="products-showcase" className="relative z-10 py-20 bg-transparent border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          
          {/* Top Category Tabs with Underline Indicator */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-px overflow-x-auto gap-8">
            <div className="flex items-center gap-8 text-sm">
              {[
                { id: 'accept', label: 'Accept payments' },
                { id: 'imps', label: 'Direct bank transfer (IMPS)' },
                { id: 'developer', label: 'Developer suite' },
                { id: 'reconcile', label: 'Direct settlements' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setProductCategory(cat.id)}
                  className={`pb-4 whitespace-nowrap text-sm transition-all relative ${
                    productCategory === cat.id
                      ? 'text-slate-900 font-semibold border-b-2 border-emerald-500 -mb-px'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <Link 
              href="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shadow-blue-500/20 whitespace-nowrap mb-2"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Category Heading & Sub-Filter Pills */}
          <div className="space-y-5">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {productCategory === 'accept' && 'Accept payments'}
              {productCategory === 'imps' && 'Direct bank transfer (IMPS)'}
              {productCategory === 'developer' && 'Developer suite and webhooks'}
              {productCategory === 'reconcile' && 'Direct account settlements'}
            </h3>

            {/* Sub-tabs / filter row */}
            <div className="flex items-center gap-6 overflow-x-auto text-xs font-medium text-slate-500 border-b border-slate-100 pb-3">
              {[
                { id: 'top', label: 'Top products' },
                { id: 'web', label: 'Website and app' },
                { id: 'links', label: 'Payment links' },
                { id: 'highticket', label: 'High-ticket IMPS' },
                { id: 'pos', label: 'In-store QR' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProductSubFilter(tab.id)}
                  className={`pb-1 whitespace-nowrap transition-colors relative ${
                    productSubFilter === tab.id
                      ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                      : 'hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Modern Product Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Card 1: Payment Gateway */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300 group shadow-xs">
              <div>
                {/* Visual Area */}
                <div className="h-48 sm:h-52 bg-gradient-to-b from-slate-50 to-blue-50/20 p-4 flex flex-col justify-center border-b border-slate-100 relative overflow-hidden">
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 space-y-2 max-w-[210px] mx-auto w-full group-hover:scale-[1.02] transition-transform">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 pb-1.5 border-b border-slate-100">
                      <span>Pay using card</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1.5">UPI ID and apps</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-semibold">0% MDR</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 pt-0.5">
                      <span>Net banking / IMPS</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-0.5">
                      <span>Wallet and QR</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Payment gateway
                  </h4>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    Accept direct UPI and netbanking payments on your website or mobile application.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link 
                  href="/login"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Payment Button */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300 group shadow-xs">
              <div>
                {/* Visual Area */}
                <div className="h-48 sm:h-52 bg-gradient-to-b from-slate-50 to-emerald-50/30 p-4 flex flex-col justify-center items-center border-b border-slate-100 relative">
                  <span className="absolute top-3 right-3 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">
                    No-code
                  </span>
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 w-40 text-center space-y-2.5 group-hover:scale-[1.02] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-800">Pro plan license</p>
                      <p className="text-[10px] font-medium text-slate-400">₹499.00</p>
                    </div>
                    <button className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-semibold shadow-xs">
                      Pay with UPI
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Payment button
                  </h4>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    Add a direct UPI payment button to your website without writing complex backend code.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link 
                  href="/login"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Payment Links */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300 group shadow-xs">
              <div>
                {/* Visual Area */}
                <div className="h-48 sm:h-52 relative overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/payment_links_preview.jpg"
                    alt="Payment links on mobile"
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                    No-code
                  </span>
                  
                  {/* SMS / WhatsApp Notification Bubble Mockup */}
                  <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-2 shadow-sm space-y-0.5">
                    <p className="text-[9px] font-medium text-slate-500 flex items-center gap-1">
                      <Bell className="w-2.5 h-2.5 text-blue-500" /> WhatsApp / SMS link
                    </p>
                    <p className="text-[9px] font-medium text-slate-800 truncate font-mono">
                      Pay ₹1,499: <span className="text-blue-600 underline">mymob.tech/pay/inv_98</span>
                    </p>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Payment links
                  </h4>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    Create and share instant payment links over WhatsApp, SMS, and email.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between gap-2">
                <Link 
                  href="/login"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1"
                >
                  <span>Sign up now</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link 
                  href="/login"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Card 4: MyMobPay In-Store / QR Soundbox */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300 group shadow-xs">
              <div>
                {/* Visual Area */}
                <div className="h-48 sm:h-52 relative overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/pos_soundbox_preview.jpg"
                    alt="In-store QR soundbox terminal"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200 shadow-xs">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>In-store and counter</span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    MyMobPay soundbox and QR
                  </h4>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    Accept physical in-store payments with instant audio confirmation and zero transaction deductions.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link 
                  href="/login"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         INTERACTIVE SAVINGS SLIDER CALCULATOR
         ──────────────────────────────────────────────────────── */}
      <section id="pricing-section" className="relative z-10 py-24 bg-transparent border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Cost comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Stop losing 2% on transaction volumes
            </h2>
            <p className="text-base text-slate-600 font-normal leading-relaxed max-w-md mx-auto">
              Calculate how much your business saves each year with flat subscription pricing.
            </p>
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            {/* Slider Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">

              {/* Slider header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Monthly sales volume</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1 flex items-baseline">
                    <span className="text-lg font-semibold text-slate-400 mr-0.5">₹</span>
                    {monthlyVolume.toLocaleString('en-IN')}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMonthlyVolume(prev => Math.max(10000, prev - 100000))}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                    title="Decrease volume"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMonthlyVolume(prev => Math.min(5000000, prev + 100000))}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                    title="Increase volume"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Range Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="10000"
                  max="5000000"
                  step="50000"
                  value={monthlyVolume}
                  onChange={e => setMonthlyVolume(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>₹10K</span>
                  <span>₹25L</span>
                  <span>₹50L</span>
                </div>
              </div>

            </div>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Traditional Gateway */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Traditional gateways (2%)</p>
                  <h4 className="text-2xl font-bold text-red-600 mt-2">
                    ₹{savings.traditionalFee.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ mo</span>
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-normal">Losing ₹{(savings.traditionalFee * 12).toLocaleString('en-IN')} annually in transaction cuts.</p>
              </div>

              {/* MyMobPay */}
              <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
                <div>
                  <p className="text-xs font-semibold text-blue-600">MyMobPay subscription</p>
                  <h4 className="text-2xl font-bold text-blue-700 mt-2">
                    ₹{savings.mymobpayFee.toLocaleString('en-IN')} <span className="text-xs font-normal text-blue-400">/ mo</span>
                  </h4>
                </div>
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Flat SaaS subscription with zero transaction cuts.
                </p>
              </div>

            </div>

            {/* Savings Callout Display */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-emerald-800">Guaranteed annual savings</p>
                <p className="text-xs text-emerald-600 font-normal">Keep 100% of your transaction revenue directly inside your bank.</p>
              </div>
              <div className="text-center sm:text-right">
                <h4 className="text-3xl font-bold text-emerald-600">
                  ₹{savings.annual.toLocaleString('en-IN')}
                </h4>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Retained net profit per year</p>
              </div>
            </div>

            {/* Savings Formula Breakdown */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] font-semibold text-blue-600">i</span>
                <span className="font-semibold text-slate-700">Formula breakdown:</span>
              </div>
              <div className="font-mono text-xs text-slate-600 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl text-center sm:text-left">
                (₹{monthlyVolume.toLocaleString('en-IN')} × 2% × 12) − (₹{subscriptionFee.toLocaleString('en-IN')} × 12) = <span className="font-bold text-emerald-600">₹{savings.annual.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Direct Settlement MDR Protection Banner */}
            <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-emerald-50 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Direct settlement 0% MDR guarantee
                  </h4>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300/60">
                    0% MDR guaranteed
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  While traditional payment gateways take <strong>2% to 2.36%</strong> on every transaction, MyMobPay keeps your profits intact. 
                  All UPI payments under ₹2,000 remain at <strong>0% MDR</strong>, and higher order values route directly through automated <strong>Direct Bank Transfer (IMPS / NEFT)</strong> with zero transaction fees.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         SEE MYMOBPAY IN ACTION — HUMAN & MERCHANT SHOWCASE
         ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-transparent border-b border-slate-200/60 overflow-hidden relative">

        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Merchant stories
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              See MyMobPay in action
            </h2>
            <p className="text-base text-slate-600 font-normal max-w-xl mx-auto leading-relaxed">
              Trusted by SaaS founders, indie developers, and growing businesses across India.
            </p>
          </div>

          {/* 3 Visual In-Action Showcase Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Scanning MyMobPay QR */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/using_mymobpay_scan.jpg" 
                    alt="Customer scanning MyMobPay QR code on tablet" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Instant QR checkout</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Seamless scan and pay</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Customers scan dynamic QR codes using any UPI application with immediate payment confirmation.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Payment rail: UPI</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  Instant verification <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 2: Merchant using Dashboard */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/using_mymobpay_merchant.jpg" 
                    alt="Founder using MyMobPay merchant dashboard on laptop" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Merchant console</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Real-time revenue analytics</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Track incoming transfers, inspect webhook dispatches, and audit reconciliations in real time.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Escrow hold: 0 days</span>
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  Direct account route <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 3: In-Person Customer Success */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/merchant_customer.jpg" 
                    alt="Happy customer and business owner completing payment" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Customer experience</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Frictionless checkout</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Deliver high checkout conversion rates with direct bank-to-bank settlement reliability.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Universal UPI support</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  99.98% success rate <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         CORE TECHNICAL FEATURE GRID
         ──────────────────────────────────────────────────────── */}
      <section id="features-section" className="py-24 bg-transparent border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Platform features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Direct infrastructure and secure verifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Direct bank routing</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Customer payments transfer directly to your designated bank account without escrow holding.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">HMAC SHA-256 webhooks</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Every transaction event callback is cryptographically signed using standard HMAC SHA-256.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Isolated developer sandbox</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Test checkout redirection flows and webhook dispatches in an isolated sandbox environment.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Instant settlements</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Maintain working capital liquidity with real-time settlement directly to your account.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         PRICING SUBSCRIPTION CALLOUT
         ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-transparent relative overflow-hidden">

        <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
          
          <div className="space-y-3">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full inline-block">
              Subscription plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Simple, flat pricing for any scale
            </h2>
            <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed font-normal">
              Start integration testing for free, scale to live payments with our standard subscription, or inquire about custom high-volume deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch text-left">
            
            {/* Developer Sandbox Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Sandbox environment</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Developer free</h3>
                  <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">Perfect for prototyping, testing API signatures, and staging your UI callback dispatches.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-semibold text-slate-400 mr-0.5">₹</span>
                  <span className="text-4xl font-bold text-slate-900">0</span>
                  <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Isolated sandbox testing API key</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Interactive dynamic checkout screen</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Automated webhook event delivery stream</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Live order status verification logs</p>
                </div>
              </div>
              <Link 
                href="/login" 
                className="mt-8 block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all text-center text-xs"
              >
                Launch sandbox console
              </Link>
            </div>

            {/* Standard Plan (Highlighted) */}
            <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 flex flex-col justify-between shadow-md relative hover:shadow-lg transition-all scale-[1.02]">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-semibold tracking-wider px-3 py-1 rounded-full shadow-xs">
                Most popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Standard plan</h3>
                  <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">For active SaaS founders and builders who want to stop giving away 2% on transaction cuts.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-semibold text-slate-400 mr-0.5">₹</span>
                  <span className="text-4xl font-bold text-slate-900">{subscriptionFee}</span>
                  <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 100% direct-to-bank UPI transfers</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 0% transaction gateway fees</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> HMAC SHA-256 signed webhooks</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Automated bank email reconciliation</p>
                </div>
              </div>
              <Link 
                href="/login" 
                className="mt-8 block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-sm shadow-blue-500/20 text-center text-xs"
              >
                Get started now
              </Link>
            </div>

            {/* Pro/Enterprise Card */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Enterprise scale</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Enterprise pro</h3>
                  <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">For high-throughput organizations needing custom webhook routing architectures.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-slate-900">Custom volume</span>
                </div>
                <div className="border-t border-slate-200/80 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Dedicated secure matching worker instances</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Customized retry webhook schedules</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Sub-merchant console access controls</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Dedicated SLA support with uptime assurances</p>
                </div>
              </div>
              <Link
                href="/login"
                className="mt-8 block w-full py-3 bg-slate-200/80 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all text-center text-xs"
              >
                Contact for enterprise
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         PREMIUM SYSTEM FOOTER
         ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#0B192C] text-[#94A3B8] py-16 border-t border-[#1D2D44]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-[#1D2D44]">
          
          <div className="md:col-span-4 space-y-4">
            <MyMobPayLogo className="w-32 h-auto" textColor="#FFFFFF" />
            <p className="text-xs text-[#64748B] leading-relaxed font-normal max-w-xs">
              Direct UPI and IMPS payment gateway designed to eliminate intermediary transaction fees for modern businesses.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-semibold text-[#F8FAFC]">Product</p>
            <ul className="space-y-2 text-xs font-normal text-[#94A3B8]">
              <li>
                <Link 
                  href="#how-it-works" 
                  className="hover:text-white transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link 
                  href="#pricing-section" 
                  className="hover:text-white transition-colors"
                >
                  Pricing plans
                </Link>
              </li>
              <li>
                <Link 
                  href="#features-section" 
                  className="hover:text-white transition-colors"
                >
                  Platform features
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-semibold text-[#F8FAFC]">Resources</p>
            <ul className="space-y-2 text-xs font-normal text-[#94A3B8]">
              <li>
                <Link 
                  href="#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h4 className="text-xs font-semibold text-[#F8FAFC]">Direct bank settlement</h4>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-normal">
              Funds route instantly to your direct bank UPI account without escrows or lockups, safeguarded by secure HMAC SHA-256 signatures.
            </p>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
              <ShieldCheck className="w-24 h-24 text-white" />
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal text-[#64748B]">
          <p>© 2026 MyMobPay. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
