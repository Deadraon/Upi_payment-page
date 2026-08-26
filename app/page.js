'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import { 
  ArrowRight, CheckCircle2, ChevronRight, Menu, X, 
  ArrowUpRight, ShieldCheck, Zap, Layers, RefreshCw, 
  Key, Landmark, Code, Play, Star, Plus, Minus, Info, Lock
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
  const [activeProductTab, setActiveProductTab] = useState('accept');
  const [monthlyVolume, setMonthlyVolume] = useState(500000); // 5 Lakhs default
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPaymentsMenu, setShowPaymentsMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  // Dynamic Typewriter visual states
  const words = useMemo(() => ['founders', 'indie hackers', 'SaaS startups', 'creators', 'businesses'], []);
  const [typedText, setTypedText] = useState('founders');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(8);
  const [typingSpeed, setTypingSpeed] = useState(120);

  useEffect(() => {
    const handleType = () => {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        setTypedText(currentWord.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
        setTypingSpeed(60);
      } else {
        setTypedText(currentWord.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
        setTypingSpeed(120);
      }

      if (!isDeleting && charIndex === currentWord.length) {
        setTypingSpeed(1800); // Pause on typed word
        setIsDeleting(true);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setWordIndex(prev => (prev + 1) % words.length);
        setTypingSpeed(350); // Pause before starting next word
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, wordIndex, typingSpeed, words]);

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
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.04)] transition-all">
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
                href="#products-section"
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
              href="#products-section"
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
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 select-none">ACCEPT PAYMENTS ONLINE</h4>
                
                <div className="space-y-1">
                  <div 
                    onClick={() => {
                      setShowPaymentsMenu(false);
                      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">
                      <Landmark className="w-5 h-5 text-blue-650" />
                    </div>
                    <div>
                      <h5 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                        Payment Gateway
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">ACTIVE</span>
                      </h5>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">Highly responsive UPI check-out scan routes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">
                      <span className="font-extrabold text-base text-blue-650">🔗</span>
                    </div>
                    <div>
                      <h5 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Payment Links
                      </h5>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">Share dynamic custom invoice URLs instantly.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">
                      <span className="font-extrabold text-base text-blue-650">📄</span>
                    </div>
                    <div>
                      <h5 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Payment Pages
                      </h5>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">Centralized brand checkouts and custom colors.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">
                      <span className="font-extrabold text-base text-blue-650">📱</span>
                    </div>
                    <div>
                      <h5 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        UPI QR Codes
                      </h5>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">Clean visual scan widgets built with react-qr.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Easy Integration options (4 cols) */}
              <div className="md:col-span-4 space-y-5">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 select-none">EASY INTEGRATION OPTIONS</h4>
                
                <div className="space-y-1">
                  <div 
                    onClick={() => {
                      setShowPaymentsMenu(false);
                      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Instant Payment Links
                      </h5>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">Generate ready-to-share dynamic invoice URLs.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">
                      <span className="font-extrabold text-base text-blue-650">⚡</span>
                    </div>
                    <div>
                      <h5 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                        UPI QR & App Scan
                        <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">NEW</span>
                      </h5>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">Native scanning for GPay, PhonePe, and Paytm.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2.5 hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">
                      <span className="font-extrabold text-base text-blue-655">🔔</span>
                    </div>
                    <div>
                      <h5 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-700 transition-colors">
                        Automated Bank Match
                      </h5>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">Instant bank deposit notifications and auto-match.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Platform Metrics (3 cols) */}
              <div className="md:col-span-3 space-y-5">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 select-none">PLATFORM STATS</h4>
                
                <div className="space-y-4 select-none">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02),0_8px_20px_rgba(0,0,0,0.03)] space-y-1.5">
                    <span className="text-[9.5px] font-black text-blue-600 uppercase tracking-wider block">P2P SETTLEMENTS</span>
                    <p className="text-lg font-black text-slate-900 leading-none">0 SECONDS</p>
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">Direct-to-bank. No escrows or lockup margins.</p>
                  </div>

                  <div className="p-5 bg-emerald-50/40 border border-emerald-250/50 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02),0_8px_20px_rgba(0,0,0,0.03)] space-y-1.5">
                    <span className="text-[9.5px] font-black text-emerald-650 uppercase tracking-wider block">REVENUE CUTS</span>
                    <p className="text-lg font-black text-emerald-650 leading-none">0% FLAT RATE</p>
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">Retain 100% of earnings on your volumes.</p>
                  </div>
                </div>
              </div>

              {/* Footer row inside dropdown */}
              <div className="md:col-span-12 border-t border-slate-100 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 font-semibold select-none">
                <span>🚀 SaaS flat monthly subscription platform</span>
                <div className="flex gap-4">
                  <Link href="/login" className="text-blue-655 hover:text-blue-700 font-extrabold flex items-center gap-1 transition-colors">Go to Merchant Console →</Link>
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
        <div className="lg:hidden fixed inset-x-0 bottom-0 top-20 z-40 bg-white/98 backdrop-blur-md flex flex-col pt-8 px-6 pb-8 animate-fadeIn border-t border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col space-y-4">
            <button onClick={() => {
              setActiveProductTab('accept');
              setIsMobileMenuOpen(false);
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Accept Payments</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Subscription Pricing</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
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
      <section className="relative mt-20 pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden bg-transparent">
        
        {/* Glow Effects (Slow Mesh Rotations) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/25 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-mesh-rotate" />
        <div className="absolute top-[300px] -left-12 w-[350px] h-[350px] bg-indigo-150/15 rounded-full filter blur-[90px] pointer-events-none -z-10 animate-mesh-rotate" style={{ animationDelay: '-5s' }} />

        {/* Floating background particle shapes for premium parallax effect */}
        <div className="absolute top-[12%] left-[8%] w-3 h-3 bg-blue-500/20 rounded-full animate-float pointer-events-none -z-10" />
        <div className="absolute top-[48%] left-[45%] w-4 h-4 bg-indigo-400/25 rounded-full animate-float pointer-events-none -z-10" style={{ animationDelay: '-2.5s', animationDuration: '6s' }} />
        <div className="absolute top-[72%] right-[10%] w-5 h-5 bg-sky-300/15 rounded-full animate-float pointer-events-none -z-10" style={{ animationDelay: '-4.5s', animationDuration: '7s' }} />

        {/* Abstract animated geometric mesh / visual assets */}
        <div className="absolute top-[20%] right-[15%] w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-2xl border border-blue-500/10 backdrop-blur-xs animate-float pointer-events-none -z-10 rotate-12" style={{ animationDuration: '8s', animationDelay: '-1s' }} />
        <div className="absolute bottom-[15%] left-[12%] w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full border border-indigo-500/10 backdrop-blur-xs animate-float pointer-events-none -z-10" style={{ animationDuration: '10s', animationDelay: '-3s' }} />
        <div className="absolute top-[35%] left-[25%] opacity-20 pointer-events-none -z-10 animate-float" style={{ animationDuration: '7s', animationDelay: '-2s' }}>
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="absolute bottom-[30%] right-[22%] opacity-15 pointer-events-none -z-10 animate-float" style={{ animationDuration: '9s', animationDelay: '-4s' }}>
          <svg className="w-6 h-6 text-indigo-600 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>

        {/* Decorative Grid Line Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1D2D44_1px,transparent_1px),linear-gradient(to_bottom,#1D2D44_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 -z-20" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column Copywriting */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Direct P2P Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm text-xs font-bold text-slate-800 animate-fade-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Direct P2P Settlement Active</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] animate-fade-up delay-100">
              UPI payments <br/>
              <span className="text-blue-600 bg-clip-text relative inline-block">
                for {typedText}
                <span className="inline-block w-[3px] h-[36px] md:h-[48px] bg-blue-600 ml-1.5 align-middle animate-pulse" style={{ verticalAlign: 'baseline', marginTop: '-4px' }} />
              </span> <br className="hidden sm:inline" />
              defying all odds
            </h1>

            <p className="text-base sm:text-lg text-slate-550 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed animate-fade-up delay-150">
              Accept direct-to-bank UPI scans, sandbox payments, and instant automated bank matching on your SaaS with <strong>0% transaction fees</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-up delay-200">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-blue-500/25 active:scale-98 text-center"
              >
                Sign Up Now
              </Link>
              <Link 
                href="#products-section"
                className="w-full sm:w-auto px-8 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded-2xl transition-all text-center flex items-center justify-center gap-2"
              >
                Learn More <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Micro proof counts */}
            <div className="pt-4 grid grid-cols-3 gap-2 sm:gap-6 max-w-md mx-auto lg:mx-0 text-slate-400 font-bold tracking-wider text-[8px] sm:text-[10px] animate-fade-up delay-300">
              <div>
                <p className="text-slate-900 text-xl sm:text-2xl font-black tracking-tight">0%</p>
                <p className="mt-0.5 whitespace-nowrap">TRANSACTION FEES</p>
              </div>
              <div>
                <p className="text-slate-900 text-xl sm:text-2xl font-black tracking-tight">100%</p>
                <p className="mt-0.5 whitespace-nowrap">DIRECT BANK P2P</p>
              </div>
              <div>
                <p className="text-slate-900 text-xl sm:text-2xl font-black tracking-tight">&lt; 200ms</p>
                <p className="mt-0.5 whitespace-nowrap">WEBHOOK CALLBACK</p>
              </div>
            </div>

          </div>

          {/* Right Column Custom Render Mockup Graphic */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end animate-scale-up">
            
            {/* Premium Interactive Phone Glow Container */}
            <div className="phone-glow-container w-full max-w-[340px]">
              
              {/* Dynamic breathing glowing background backdrop */}
              <div className="phone-glow-backdrop animate-aurora-breathe" />

              {/* Premium Simulated Smartphone Frame displaying Actual MyMobPay checkout screen */}
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
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Direct Bank Checkout</p>
                  </div>

                  {/* Due amount card */}
                  <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                      <span>Total Due</span>
                      <span className="text-[#3395FF] font-extrabold bg-[#0B2447] px-2 py-0.5 rounded text-[8px] uppercase">P2P Bank Route</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-sm font-bold text-slate-450 mr-0.5">₹</span>
                      <span className="text-3xl font-black text-white tracking-tight leading-none">
                        {parseFloat(demoAmount || '500').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#1D2D44] flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Paying to:</span>
                      <span className="font-bold text-slate-200">Demo Store</span>
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

                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auto-Verify Active
                    </span>

                  </div>

                </div>

                {/* Footer Section */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  
                  {/* Apps row */}
                  <div className="space-y-2">
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest text-center">Scan with any UPI app</p>
                    <div className="flex justify-center gap-2">
                      <Image src="/logos/gpay.svg" width={32} height={32} className="w-8 h-8 object-contain bg-white-pure border border-slate-250/70 p-1.5 rounded-xl shadow-xs" alt="GPay" />
                      <Image src="/logos/phonepe.svg" width={32} height={32} className="w-8 h-8 object-contain bg-white-pure border border-slate-250/70 p-1.5 rounded-xl shadow-xs" alt="PhonePe" />
                      <Image src="/logos/paytm.svg" width={32} height={32} className="w-8 h-8 object-contain bg-white-pure border border-slate-250/70 p-1.5 rounded-xl shadow-xs" alt="Paytm" />
                      <Image src="/logos/bhim.svg" width={32} height={32} className="w-8 h-8 object-contain bg-white-pure border border-slate-250/70 p-1.5 rounded-xl shadow-xs" alt="BHIM" />
                    </div>
                  </div>

                  {/* Security copy */}
                  <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wide text-center">
                    <Lock className="w-3 h-3 text-slate-350" /> Secure B2B checkout by MyMobPay
                  </div>

                </div>

              </div>

            </div>

            </div> {/* closes phone-glow-container */}

            {/* Metric float chips */}
            <div className="absolute -left-6 top-1/4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1 -rotate-6 animate-float">
              <span className="text-[8px] font-black text-blue-600 uppercase tracking-wider leading-none">Platform Average</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Success Rate</span>
              <span className="text-xl font-black text-slate-900 leading-none mt-1">99.98%</span>
            </div>

            <div className="absolute -right-6 bottom-1/4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1 rotate-6 animate-float delay-500">
              <span className="text-[8px] font-black text-blue-600 uppercase tracking-wider leading-none">Real-Time Routing</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Settlement</span>
              <span className="text-xl font-black text-emerald-600 leading-none mt-1">0 SECONDS</span>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         INTERACTIVE SAVINGS SLIDER CALCULATOR
         ──────────────────────────────────────────────────────── */}
      <section id="pricing-section" className="relative z-10 py-24 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              SaaS Billing Cost Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Stop losing 2% on transaction volumes
            </h2>
            <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto">
              Slide to verify how much your company saves every year with MyMobPay flat pricing.
            </p>
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-8">
            
            {/* Slider Section - Solid Card matching panels below */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">

              {/* Slider header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Monthly Sales Volume</p>
                  <h3 className="text-3xl font-black text-slate-950 mt-1 flex items-baseline">
                    <span className="text-lg font-bold text-slate-400 mr-0.5">₹</span>
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
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Traditional Gateways (2%)</p>
                  <h4 className="text-2xl font-black text-red-600 mt-2">
                    ₹{savings.traditionalFee.toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-400">/ mo</span>
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Losing ₹{(savings.traditionalFee * 12).toLocaleString('en-IN')} annually in transaction cuts.</p>
              </div>

              {/* MyMobPay */}
              <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">MyMobPay Subscription</p>
                  <h4 className="text-2xl font-black text-blue-700 mt-2">
                    ₹{savings.mymobpayFee.toLocaleString('en-IN')} <span className="text-xs font-semibold text-blue-400">/ mo</span>
                  </h4>
                </div>
                <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Flat SaaS cost. No transaction cuts.
                </p>
              </div>

            </div>

            {/* Savings Callout Display */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Your Guaranteed Annual Savings</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Keep 100% of your transaction revenue directly inside your bank.</p>
              </div>
              <div className="text-center sm:text-right">
                <h4 className="text-3xl font-black text-emerald-600">
                  ₹{savings.annual.toLocaleString('en-IN')}
                </h4>
                <p className="text-[10px] text-emerald-500 font-bold uppercase mt-0.5">Retained net profit / yr</p>
              </div>
            </div>

            {/* Savings Formula Breakdown */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-550 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[9px] font-black text-blue-600 px-1.5 py-0.5">i</span>
                <span className="font-bold text-slate-700">Formula Breakdown:</span>
              </div>
              <div className="font-mono text-xs text-slate-600 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl text-center sm:text-left">
                (₹{monthlyVolume.toLocaleString('en-IN')} × 2% × 12) − (₹{subscriptionFee.toLocaleString('en-IN')} × 12) = <span className="font-bold text-emerald-600">₹{savings.annual.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         BOTTOM PRODUCT TAB SELECTOR (RAZORPAY STYLE)
         ──────────────────────────────────────────────────────── */}
      <section id="products-section" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              One unified P2P infrastructure
            </h2>
            <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto">
              Engineered to bypass intermediary payment escrows and process settlements in real time.
            </p>
          </div>

          {/* Interactive product segment tabs */}
          <div className="flex items-center justify-center overflow-x-auto pb-2 border-b border-slate-100 gap-2">
            {[
              { id: 'accept', label: 'Accept Payments', icon: Landmark },
              { id: 'payouts', label: 'Direct Payouts', icon: Zap },
              { id: 'sandbox', label: 'Developer Sandbox', icon: Key },
              { id: 'settlement', label: 'Zero Escrow Settlements', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveProductTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${activeProductTab === tab.id ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${activeProductTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Visual and Benefits Showcase */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[350px]">
            
            <div className="lg:col-span-6 space-y-6">
              
              {activeProductTab === 'accept' && (
                <>
                  <h3 className="text-2xl font-black text-slate-950">Accept customer direct transfers</h3>
                  <p className="text-sm text-slate-550 leading-relaxed font-medium">
                    Generate instant direct payment links or scan screens. Your clients scan via any UPI app (GPay, PhonePe, Paytm) and funds route directly to your merchant VPA.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Integrated client copy fields showing dynamic VPAs</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automatically verified matching via bank notification triggers</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fully custom theme matches to your business profile</li>
                  </ul>
                </>
              )}

              {activeProductTab === 'payouts' && (
                <>
                  <h3 className="text-2xl font-black text-slate-950">Automated Direct Payouts</h3>
                  <p className="text-sm text-slate-550 leading-relaxed font-medium">
                    Build seamless dispatches to your partner contractors or developers using high-speed programmatic outbound API triggers.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero intermediation or lock-up escrow layers</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified UTR callback dispatch in under 200 milliseconds</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure programmatic API key permissions and locks</li>
                  </ul>
                </>
              )}

              {activeProductTab === 'sandbox' && (
                <>
                  <h3 className="text-2xl font-black text-slate-950">Frictionless integration sandbox</h3>
                  <p className="text-sm text-slate-550 leading-relaxed font-medium">
                    Test your outbound callback hooks, test order redirection flows, and webhook endpoints with isolated test transactions—completely risk-free.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Accounts default to Sandbox Mode to assure safe setup</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Stripe-style `test_` vs `live_` key prefixes prevent mixing</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Simulation panels let you mock payments instantly</li>
                  </ul>
                </>
              )}

              {activeProductTab === 'settlement' && (
                <>
                  <h3 className="text-2xl font-black text-slate-950">Immediate bank route settlements</h3>
                  <p className="text-sm text-slate-550 leading-relaxed font-medium">
                    Traditional gateways withhold your earnings for 2-3 business days. MyMobPay operates on 0-second escrow parameters, directing funds to your bank in real time.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Absolute zero escrow holds on transaction revenue</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 0% direct gateway cuts on volume</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Safe, P2P encryption keys safeguard every transaction</li>
                  </ul>
                </>
              )}

            </div>

            {/* Right Column Product Card Mockup */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md w-full max-w-[420px] space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                      <Landmark className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <span className="text-xs font-black text-slate-900">Checkout Preview</span>
                  </div>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 rounded font-bold uppercase">
                    Sandbox mode
                  </span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Invoice</span>
                    <span className="text-base font-black text-slate-900">₹{parseFloat(demoAmount).toFixed(2)}</span>
                  </div>
                  <code className="block bg-white border border-slate-200/80 p-2.5 rounded-xl text-[10px] font-mono break-all text-slate-600 font-semibold leading-normal">
                    mymobpay.com/pay?api_key=test_apikey...
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button className="py-2.5 bg-slate-950 text-white rounded-xl text-[10px] font-bold shadow-md shadow-slate-950/10">
                    Simulate Success
                  </button>
                  <button className="py-2.5 border border-slate-200 text-slate-650 rounded-xl text-[10px] font-bold">
                    Simulate Failure
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>



      {/* ────────────────────────────────────────────────────────
         CORE TECHNICAL FEATURE GRID
         ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Direct infrastructure. Secure verifications.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-blue-300 transition-all hover:shadow-lg hover:-translate-y-1.5 duration-350 ease-out group animate-fade-up">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Direct Bank P2P Route</h3>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                Eliminate transaction holdings. Customer scans transfer directly into your private UPI bank accounts instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-blue-300 transition-all hover:shadow-lg hover:-translate-y-1.5 duration-350 ease-out group animate-fade-up delay-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">HMAC SHA-256 Webhooks</h3>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                Every outbound callback carrying transaction matches is signed with a merchant secret key using industry standards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-blue-300 transition-all hover:shadow-lg hover:-translate-y-1.5 duration-350 ease-out group animate-fade-up delay-150">
              <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-md shadow-violet-500/10 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Isolated Developer Sandbox</h3>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                Test checkout redirection flows, callback API dispatches, and logs securely using prefix-locked test credential sets.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-blue-300 transition-all hover:shadow-lg hover:-translate-y-1.5 duration-350 ease-out group animate-fade-up delay-200">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/10 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">0-Second Settlements</h3>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                Your company gains immediate liquidity. No escrow holds or intermediary bank delays on successful verified client payouts.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         PRICING SUBSCRIPTION CALLOUT
         ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        {/* Glow background filter */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/30 rounded-full filter blur-[130px] pointer-events-none -z-10 animate-mesh-rotate" />

        <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
          
          <div className="space-y-3">
            <span className="text-[9px] font-extrabold uppercase text-emerald-600 tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Subscription Plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Simple flat pricing for any scale
            </h2>
            <p className="text-sm text-slate-550 max-w-lg mx-auto leading-relaxed font-medium">
              Start integration testing for free, scale to live payments with our standard subscription, or inquire about custom high-volume deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch text-left">
            
            {/* Developer Sandbox Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Sandbox Environment</span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Developer Free</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5">Perfect for prototyping, testing API signatures, and staging your UI callback dispatches.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-slate-400 mr-0.5">₹</span>
                  <span className="text-4xl font-black text-slate-900">0</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-650 font-bold">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Isolated sandbox testing API key</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Simulated visual checkout screen</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Webhook trigger callback simulator</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Mock payment success / failure logs</p>
                </div>
              </div>
              <Link 
                href="/login" 
                className="mt-8 block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl transition-all active:scale-98 text-center text-xs"
              >
                Launch Sandbox Console
              </Link>
            </div>

            {/* Standard Plan (Highlighted) */}
            <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 flex flex-col justify-between shadow-md relative hover:shadow-lg transition-all scale-[1.02]">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black tracking-widest px-3 py-1 uppercase rounded-full shadow-sm">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-blue-600 tracking-wider">Unlimited Scale</span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Standard Plan</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5">For active SaaS founders and builders who want to stop giving away 2% on transaction cuts.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-slate-400 mr-0.5">₹</span>
                  <span className="text-4xl font-black text-slate-900">{subscriptionFee}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-650 font-bold">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% direct-to-bank UPI transfers</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 0% transaction gateway fees</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> HMAC SHA-256 signed webhooks</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto-matching notification engine</p>
                </div>
              </div>
              <Link 
                href="/login" 
                className="mt-8 block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/10 active:scale-98 text-center text-xs"
              >
                Get Started Now
              </Link>
            </div>

            {/* Pro/Enterprise Waitlist Card */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-300 transition-all opacity-85">
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Enterprise Scale</span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Enterprise Pro</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5">For high-throughput organizations needing custom webhook routing architectures.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-slate-400">Custom / Waitlist</span>
                </div>
                <div className="border-t border-slate-200/80 pt-6 space-y-3.5 text-xs text-slate-650 font-bold">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Dedicated secure matching worker instances</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Customized retry webhook schedules</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Sub-merchant console access controls</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> SLA support with high uptime assurances</p>
                </div>
              </div>
              <button 
                disabled
                className="mt-8 block w-full py-3 bg-slate-200 text-slate-500 font-extrabold rounded-2xl cursor-not-allowed text-center text-xs"
              >
                Pro Coming Soon
              </button>
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
            <p className="text-xs text-[#64748B] leading-relaxed font-medium max-w-xs">
              Instant Direct P2P UPI Payment gateway designed to eliminate intermediary transaction costs for modern builders.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-[10px] font-bold text-[#F8FAFC] uppercase tracking-wider">Product</p>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link 
                  href="#products-section" 
                  onClick={() => setActiveProductTab('accept')}
                  className="hover:text-white transition-colors"
                >
                  Accept Payments
                </Link>
              </li>
              <li>
                <Link 
                  href="#products-section" 
                  onClick={() => setActiveProductTab('payouts')}
                  className="hover:text-white transition-colors"
                >
                  Direct Payouts
                </Link>
              </li>
              <li>
                <Link 
                  href="#products-section" 
                  onClick={() => setActiveProductTab('sandbox')}
                  className="hover:text-white transition-colors"
                >
                  Test Sandbox
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-[10px] font-bold text-[#F8FAFC] uppercase tracking-wider">Resources</p>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link 
                  href="#developer-section"
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h4 className="text-xs font-black text-[#F8FAFC] uppercase tracking-wider">Direct Bank Settlement</h4>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed font-medium">
              Funds route instantly to your direct bank UPI VPA without escrows or lockups. Safeguarded by secure HMAC SHA-256 signatures.
            </p>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
              <ShieldCheck className="w-24 h-24 text-white" />
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#64748B]">
          <p>© 2026 MyMobPay · B2B Payments Gateway · Built for Builders.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
