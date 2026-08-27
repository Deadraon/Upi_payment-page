'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import { 
  ArrowRight, CheckCircle2, ChevronRight, Menu, X, 
  ArrowUpRight, ShieldCheck, Zap, Layers, RefreshCw, 
  Key, Landmark, Code, Play, Star, Plus, Minus, Info, Lock, Sparkles
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
  const [simulatedPaid, setSimulatedPaid] = useState(false);

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
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.04)] transition-all">
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
        <div className="lg:hidden fixed inset-x-0 bottom-0 top-20 z-40 bg-white flex flex-col pt-8 px-6 pb-8 animate-fadeIn border-t border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.12)]">
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
         CODED DASHBOARD SHOWCASE (Clean Light Theme)
         ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 bg-transparent border-y border-slate-200/60 overflow-hidden">
        {/* Ambient soft glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-blue-200/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Merchant Console
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Full visibility. Real-time insights.
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
              Monitor every transaction, webhook, and settlement from your live MyMobPay console.
            </p>
          </div>

          {/* === CODED DASHBOARD MOCKUP (LIGHT THEME) === */}
          <div className="relative">
            {/* Glow */}
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/15 rounded-2xl blur-md" />

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
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Live</span>
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
                    <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
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
                      { label: 'Total Revenue', value: '₹4,82,500', change: '+12.4%', color: 'text-emerald-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Transactions', value: '1,842', change: '+8.1%', color: 'text-blue-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Success Rate', value: '99.98%', change: '+0.02%', color: 'text-emerald-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Avg. Settlement', value: '0.0s', change: 'Real-time', color: 'text-indigo-700', bg: 'bg-slate-50 border-slate-200' },
                    ].map(stat => (
                      <div key={stat.label} className={`${stat.bg} border rounded-xl p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all`}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-base sm:text-lg font-black text-slate-900">{stat.value}</p>
                        <p className={`text-[10px] font-bold ${stat.color}`}>{stat.change}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart + Recent Transactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Chart */}
                    <div className="lg:col-span-2 bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-900">Revenue (Last 30 Days)</p>
                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-bold">LIVE</span>
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
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                        {['Aug 1','Aug 7','Aug 14','Aug 21','Aug 26'].map(d => <span key={d}>{d}</span>)}
                      </div>
                    </div>

                    {/* Recent transactions */}
                    <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <p className="text-xs font-black text-slate-900">Recent Payments</p>
                      <div className="space-y-2">
                        {[
                          { id: '#MP0891', upi: 'raj@okaxis', amt: '₹4,500', status: 'SUCCESS' },
                          { id: '#MP0890', upi: 'sara@ybl', amt: '₹1,200', status: 'SUCCESS' },
                          { id: '#MP0889', upi: 'dev@paytm', amt: '₹800', status: 'PENDING' },
                          { id: '#MP0888', upi: 'mia@upi', amt: '₹12,000', status: 'SUCCESS' },
                        ].map(tx => (
                          <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-slate-200/60 last:border-0">
                            <div>
                              <p className="text-[10px] font-black text-blue-600">{tx.id}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{tx.upi}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-900">{tx.amt}</p>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                tx.status === 'SUCCESS'
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Uptime SLA', value: '99.99%', icon: <ShieldCheck className="w-4 h-4" />, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
              { label: 'Webhook Latency', value: '<200ms', icon: <Zap className="w-4 h-4" />, iconBg: 'bg-blue-50 text-blue-600 border-blue-200' },
              { label: 'Avg. Settlement', value: '0 sec', icon: <RefreshCw className="w-4 h-4" />, iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
            ].map(m => (
              <div key={m.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
                  {m.icon}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</p>
                  <p className="text-lg font-black text-slate-900">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         HOW IT WORKS — PREMIUM FINTECH ARCHITECTURE FLOW
         ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 bg-transparent border-b border-slate-200/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Direct P2P Architecture</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              3 steps. Zero middlemen. Real-time bank credit.
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
              Eliminate payment gateway holding periods and 2% transaction taxes. Customer scans, funds route directly to your bank, webhooks fire instantly.
            </p>
          </div>

          {/* Visual 3-Step Premium Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">

            {/* STEP 1: Universal 1-Click Scan */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_50px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-6">
                {/* Step Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full">
                    Step 01 · Scan
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">Universal UPI</span>
                </div>

                {/* Sleek Light Mobile Checkout Visual */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-700">Checkout · ₹500</span>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Live QR</span>
                  </div>

                  {/* QR Box with animated scanning laser line */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group/qr shadow-xs">
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-0 animate-laser" />
                    
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-800" fill="currentColor">
                      <rect x="5" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                      <rect x="9" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                      <rect x="13" y="13" width="10" height="10" fill="#3B82F6" rx="1.5" />

                      <rect x="69" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                      <rect x="73" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                      <rect x="77" y="13" width="10" height="10" fill="#3B82F6" rx="1.5" />

                      <rect x="5" y="69" width="26" height="26" fill="#0F172A" rx="4" />
                      <rect x="9" y="73" width="18" height="18" fill="#FFFFFF" rx="2" />
                      <rect x="13" y="77" width="10" height="10" fill="#3B82F6" rx="1.5" />

                      <circle cx="45" cy="20" r="3" fill="#0F172A" />
                      <circle cx="55" cy="20" r="3" fill="#0F172A" />
                      <circle cx="50" cy="35" r="3.5" fill="#0F172A" />
                      <circle cx="35" cy="50" r="3" fill="#0F172A" />
                      <circle cx="65" cy="50" r="3" fill="#0F172A" />
                      <circle cx="50" cy="65" r="3" fill="#0F172A" />
                      <circle cx="40" cy="80" r="3" fill="#0F172A" />
                      <circle cx="60" cy="80" r="3" fill="#0F172A" />
                      <rect x="42" y="42" width="16" height="16" fill="#3B82F6" rx="3" />
                      <text x="50" y="53" fontFamily="'Orbitron', sans-serif" fontWeight="950" fontSize="10" fill="#FFFFFF" textAnchor="middle">M</text>
                    </svg>

                    <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 mt-2">Scan with any UPI app</p>
                  </div>

                  {/* UPI Apps Row */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { name: 'GPay', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                      { name: 'PhonePe', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                      { name: 'Paytm', color: 'text-sky-600 bg-sky-50 border-sky-200' },
                      { name: 'BHIM', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                    ].map(app => (
                      <div key={app.name} className={`${app.color} border rounded-lg py-1 text-center font-black text-[9px]`}>
                        {app.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">Customer Scans Any UPI App</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Customer opens Google Pay, PhonePe, Paytm, or CRED and scans the payment QR code or clicks your direct payment link.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Speed: Instant</span>
                <span className="text-blue-600 flex items-center gap-1">100% App Coverage <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /></span>
              </div>
            </div>

            {/* STEP 2: P2P Direct Banking Pipeline */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.12)] hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-6">
                {/* Step Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-full">
                    Step 02 · Route
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">0% Intermediary Fee</span>
                </div>

                {/* Fintech Network Pipeline Visual */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 relative">
                  <div className="flex items-center justify-between relative">
                    {/* Buyer Bank Node */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white border-2 border-blue-500 shadow-sm flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-[9px] font-black text-slate-800">Buyer Bank</span>
                      <span className="text-[8px] font-bold text-slate-400">HDFC / ICICI</span>
                    </div>

                    {/* Animated Connecting Track */}
                    <div className="flex-1 mx-2 relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full animate-progress" />
                    </div>

                    {/* Central Protocol Shield */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-300" />
                      </div>
                      <span className="text-[9px] font-black text-indigo-700">MyMobPay</span>
                      <span className="text-[8px] font-bold text-slate-400">P2P Engine</span>
                    </div>

                    {/* Animated Connecting Track */}
                    <div className="flex-1 mx-2 relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-indigo-500 via-emerald-400 to-emerald-500 rounded-full animate-progress" />
                    </div>

                    {/* Merchant Bank Node */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white border-2 border-emerald-500 shadow-sm flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-[9px] font-black text-slate-800">Your Bank</span>
                      <span className="text-[8px] font-bold text-emerald-600">0% Escrow</span>
                    </div>
                  </div>

                  {/* Feature Chip below pipeline */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between text-[10px] font-bold text-slate-600 shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      NPCI Protocol Route
                    </span>
                    <span className="text-indigo-600 font-black">Direct VPA Deposit</span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">Direct Account-to-Account Route</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Transactions route directly through bank UPI rail parameters into your own merchant account. Zero escrow holding accounts.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Intermediaries: Zero</span>
                <span className="text-indigo-600 flex items-center gap-1">Encrypted Rail <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /></span>
              </div>
            </div>

            {/* STEP 3: Real-Time Verified Settlement & Webhook */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)] hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-6">
                {/* Step Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Step 03 · Settle
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">Instant Liquidity</span>
                </div>

                {/* Light Instant Settlement Confirmation Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Settlement Alert</span>
                      <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ✓ Confirmed
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-slate-400">₹</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tight">500.00</span>
                      <span className="text-[10px] font-bold text-emerald-600 ml-1">in your bank</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-500">
                      <div>UTR: <span className="font-mono text-slate-900 font-bold">4291084920</span></div>
                      <div className="text-right">Speed: <span className="text-emerald-600 font-bold">0.0s (Live)</span></div>
                    </div>
                  </div>

                  {/* Webhook Response Badge */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-mono font-bold text-emerald-900">POST /webhook 200 OK</span>
                    </div>
                    <span className="font-bold text-emerald-700">138ms</span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">0-Second Settlement & Webhook</h3>
                  <p className="text-xs text-slate-550 font-medium leading-relaxed">
                    Funds hit your private bank account instantly. An HMAC SHA-256 cryptographically signed webhook notifies your servers in under 200ms.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Hold Time: 0 Days</span>
                <span className="text-emerald-600 flex items-center gap-1">Auto-Matched <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></span>
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
         BOTTOM PRODUCT TAB SELECTOR (PREMIUM FINTECH SHOWCASE)
         ──────────────────────────────────────────────────────── */}
      <section id="products-section" className="py-24 bg-transparent border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>FinTech Infrastructure Suite</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              One unified P2P infrastructure
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
              Engineered to bypass intermediary payment escrows, eliminate transaction fees, and settle funds in real time.
            </p>
          </div>

          {/* Interactive product segment tabs */}
          <div className="flex justify-center">
            <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1.5 overflow-x-auto max-w-full">
              {[
                { id: 'accept', label: 'Accept Payments', icon: Landmark },
                { id: 'payouts', label: 'Direct Payouts', icon: Zap },
                { id: 'sandbox', label: 'Developer Sandbox', icon: Key },
                { id: 'settlement', label: 'Zero Escrow Settlements', icon: Layers }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeProductTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveProductTab(tab.id);
                      setSimulatedPaid(false);
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Tab Visual and Benefits Showcase Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.06)] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Feature Storytelling & Live Controls */}
            <div className="lg:col-span-6 space-y-6">
              
              {activeProductTab === 'accept' && (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                      Universal UPI Checkout
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      Accept customer direct transfers
                    </h3>
                    <p className="text-sm text-slate-550 leading-relaxed font-medium">
                      Generate instant direct payment links or scan screens. Your clients scan via any UPI app (GPay, PhonePe, Paytm, CRED) and funds route directly to your merchant bank account.
                    </p>
                  </div>

                  {/* Interactive Amount Pill Selector */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Interactive Demo Amount:</p>
                    <div className="flex flex-wrap gap-2">
                      {['250', '500', '1499', '4999'].map(amt => (
                        <button
                          key={amt}
                          onClick={() => {
                            setDemoAmount(amt);
                            setSimulatedPaid(false);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                            demoAmount === amt 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          ₹{parseInt(amt).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bullet Benefits */}
                  <ul className="space-y-3 text-xs text-slate-650 font-semibold">
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Integrated dynamic VPA fields with 1-click clipboard copy</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Automated transaction matching via bank SMS & notification engine</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Full brand theme customization to match your app interface</span>
                    </li>
                  </ul>
                </>
              )}

              {activeProductTab === 'payouts' && (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                      Instant Disbursements
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      Automated Direct Payouts
                    </h3>
                    <p className="text-sm text-slate-550 leading-relaxed font-medium">
                      Disburse automated payouts to contractors, vendors, and affiliates using programmatic high-speed API dispatches with immediate UTR confirmation.
                    </p>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-650 font-semibold">
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Zero escrow or lock-up intermediary holding layers</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Verified bank UTR callback dispatch in under 200 milliseconds</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Granular API key permissions with IP whitelisting safeguards</span>
                    </li>
                  </ul>
                </>
              )}

              {activeProductTab === 'sandbox' && (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                      Developer Environment
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      Frictionless API sandbox
                    </h3>
                    <p className="text-sm text-slate-550 leading-relaxed font-medium">
                      Test your checkout redirection flows, webhook callback dispatches, and signature verifications with isolated test transactions—completely risk-free.
                    </p>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-650 font-semibold">
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Isolated accounts default to Sandbox Mode for zero-risk testing</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Stripe-style <code className="font-mono text-blue-600 font-bold">test_</code> vs <code className="font-mono text-emerald-600 font-bold">live_</code> key prefixes prevent mistakes</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Real-time webhook simulator triggers delivery in one click</span>
                    </li>
                  </ul>
                </>
              )}

              {activeProductTab === 'settlement' && (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                      0-Second Settlement
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      Immediate bank route settlements
                    </h3>
                    <p className="text-sm text-slate-550 leading-relaxed font-medium">
                      Traditional gateways withhold your hard-earned revenue for 2–3 business days. MyMobPay directs funds to your bank in real time with 0-second escrow.
                    </p>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-650 font-semibold">
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Zero escrow holds on your company revenue</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>0% direct gateway cuts on your transaction volumes</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>HMAC SHA-256 cryptographic signatures safeguard every verification</span>
                    </li>
                  </ul>
                </>
              )}

            </div>

            {/* Right Column: Premium Light-Theme Interactive Product Visuals */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <div className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden">

                {/* ACCEPT PAYMENTS TAB: Premium Checkout Mockup */}
                {activeProductTab === 'accept' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-md">
                    {/* Top checkout header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                          <Landmark className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">MyMobPay Secure Checkout</p>
                          <p className="text-[9px] text-slate-400 font-bold">Store: MyMob Merchant</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live UPI
                      </span>
                    </div>

                    {/* Order summary bar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amount Due</p>
                        <p className="text-xl font-black text-slate-950">₹{parseInt(demoAmount).toLocaleString('en-IN')}.00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Order ID</p>
                        <p className="text-xs font-mono font-bold text-blue-600">ORD-2891-XYZ</p>
                      </div>
                    </div>

                    {/* Dynamic QR Box with Laser Scan Animation */}
                    <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-0 animate-laser" />
                      
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                        <svg viewBox="0 0 100 100" className="w-28 h-28 text-slate-800" fill="currentColor">
                          <rect x="5" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                          <rect x="9" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                          <rect x="13" y="13" width="10" height="10" fill="#3B82F6" rx="1.5" />

                          <rect x="69" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                          <rect x="73" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                          <rect x="77" y="13" width="10" height="10" fill="#3B82F6" rx="1.5" />

                          <rect x="5" y="69" width="26" height="26" fill="#0F172A" rx="4" />
                          <rect x="9" y="73" width="18" height="18" fill="#FFFFFF" rx="2" />
                          <rect x="13" y="77" width="10" height="10" fill="#3B82F6" rx="1.5" />

                          <circle cx="45" cy="20" r="3" fill="#0F172A" />
                          <circle cx="55" cy="20" r="3" fill="#0F172A" />
                          <circle cx="50" cy="35" r="3.5" fill="#0F172A" />
                          <circle cx="35" cy="50" r="3" fill="#0F172A" />
                          <circle cx="65" cy="50" r="3" fill="#0F172A" />
                          <circle cx="50" cy="65" r="3" fill="#0F172A" />
                          <circle cx="40" cy="80" r="3" fill="#0F172A" />
                          <circle cx="60" cy="80" r="3" fill="#0F172A" />
                          <rect x="42" y="42" width="16" height="16" fill="#3B82F6" rx="3" />
                          <text x="50" y="53" fontFamily="'Orbitron', sans-serif" fontWeight="950" fontSize="10" fill="#FFFFFF" textAnchor="middle">M</text>
                        </svg>
                      </div>

                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">
                        Scan to Pay with Any UPI App
                      </p>

                      {/* Branded UPI Apps Bar */}
                      <div className="flex gap-2 mt-2">
                        {[
                          { name: 'GPay', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                          { name: 'PhonePe', color: 'bg-purple-50 text-purple-600 border-purple-200' },
                          { name: 'Paytm', color: 'bg-sky-50 text-sky-600 border-sky-200' },
                          { name: 'BHIM', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                        ].map(app => (
                          <span key={app.name} className={`${app.color} border px-2 py-0.5 rounded-md text-[9px] font-black`}>
                            {app.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Simulate Button */}
                    <div>
                      {!simulatedPaid ? (
                        <button
                          onClick={() => setSimulatedPaid(true)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Simulate Customer Payment (Test)</span>
                        </button>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-emerald-900">Payment Verified Instantly!</p>
                              <p className="text-[9px] text-emerald-700 font-mono font-bold">UTR: 4291084920 · Deposited to Bank</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSimulatedPaid(false)}
                            className="text-[9px] text-emerald-700 hover:underline font-bold"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DIRECT PAYOUTS TAB */}
                {activeProductTab === 'payouts' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Bulk Payout Dispatcher</p>
                          <p className="text-[9px] text-slate-400 font-bold">Batch #4902 · Live API</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-black uppercase">
                        v2 Connected
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        { to: 'vendor@ybl', amount: '₹25,000', status: 'SENT', time: '0.1s' },
                        { to: 'dev@okaxis', amount: '₹12,500', status: 'SENT', time: '0.0s' },
                        { to: 'raj@paytm', amount: '₹8,000', status: 'QUEUED', time: '—' },
                        { to: 'mia@upi', amount: '₹45,000', status: 'SENT', time: '0.2s' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                              <Landmark className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{row.to}</p>
                              <p className="text-[9px] text-slate-400 font-medium">Settlement: {row.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900">{row.amount}</p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                              row.status === 'SENT' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>{row.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Disbursed Today</span>
                      <span className="text-base font-black text-emerald-600">₹90,500.00</span>
                    </div>
                  </div>
                )}

                {/* DEVELOPER SANDBOX TAB */}
                {activeProductTab === 'sandbox' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md font-mono">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                          <Code className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Developer Sandbox</p>
                          <p className="text-[9px] text-slate-400 font-bold">API v1 · Isolated Mock</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-black uppercase">
                        test_ mode
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                        <p className="text-[9px] font-black text-blue-600 uppercase">POST /orders/create</p>
                        <pre className="text-[9px] text-slate-700 leading-relaxed font-mono">{`{
  "amount": 500.00,
  "upi_id": "test@upi",
  "order_id": "ORD-001"
}`}</pre>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                        <p className="text-[9px] font-black text-emerald-700 uppercase">200 OK · 0.12s</p>
                        <pre className="text-[9px] text-slate-700 leading-relaxed font-mono">{`{
  "status": "SUCCESS",
  "tx_id": "PAY_8921",
  "utr": "123456789"
}`}</pre>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Webhook Event Stream</p>
                      {[
                        '[10:30:16] payment.created → ORD-001 | RECEIVED',
                        '[10:30:17] payment.success → PAY_8921 | DELIVERED',
                        '[10:30:17] utr.matched → 123456789 | VERIFIED ✓',
                      ].map((log, i) => (
                        <p key={i} className="text-[9px] text-emerald-600 font-bold">{log}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* ZERO ESCROW SETTLEMENTS TAB */}
                {activeProductTab === 'settlement' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Direct Bank Settlement Ledger</p>
                          <p className="text-[9px] text-slate-400 font-bold">Real-time Deposited Funds</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-black uppercase">
                        0s Escrow
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { label: 'Gateway Fee', val: '₹0.00', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                        { label: 'Escrow Hold', val: '0 days', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                        { label: 'Settlement', val: '0.0s', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                      ].map(s => (
                        <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">{s.label}</p>
                          <p className={`text-base sm:text-lg font-black ${s.color} mt-0.5`}>{s.val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {[
                        { date: 'Today · 10:45 AM', txns: 42, total: '₹2,14,000', status: 'Deposited' },
                        { date: 'Yesterday', txns: 38, total: '₹1,89,500', status: 'Deposited' },
                        { date: '25 Aug 2026', txns: 55, total: '₹2,75,000', status: 'Deposited' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="text-xs font-black text-slate-900">{row.date}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{row.txns} transactions</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900">{row.total}</p>
                            <span className="text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">{row.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>



      {/* ────────────────────────────────────────────────────────
         CORE TECHNICAL FEATURE GRID
         ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-transparent border-b border-slate-200/60">
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
      <section className="py-24 bg-transparent relative overflow-hidden">
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
