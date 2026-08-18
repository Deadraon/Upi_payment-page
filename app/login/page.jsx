'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Lock, Mail, ArrowRight, ShieldCheck, 
  CheckCircle2, Building2, QrCode, Phone, KeyRound, 
  Check, LogIn, Sparkles, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import InteractiveBackground from '@/components/InteractiveBackground';

const MyMobPayLogo = ({ className = 'w-44 h-auto', textColor = '#FFFFFF' }) => (
  <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
    <text x="2" y="42" letterSpacing="0">
      {/* MyMob */}
      <tspan fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="36" fill={textColor}>MyMob</tspan>
      {/* Pay */}
      <tspan fontFamily="'Orbitron', sans-serif" fontWeight="900" fontStyle="italic" fontSize="36" fill="#3B82F6" dx="3">Pay</tspan>
    </text>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  
  // Registration Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');

  // Inline OTP states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset OTP state if email changes
  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
    if (isEmailVerified) {
      setIsEmailVerified(false);
      setOtpSent(false);
      setOtp('');
    }
  };

  // Send OTP handler
  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    setOtpSending(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send OTP code.');
      }

      setOtpSent(true);
      setResendCooldown(45);
      setMessage(data.message || `OTP sent! Please check your inbox at ${email.trim()}`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP handler
  const handleVerifyInlineOtp = async () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setOtpVerifying(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: email.trim(), otp: cleanOtp }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid or expired OTP code.');
      }

      setIsEmailVerified(true);
      setMessage('Email verified successfully! ✓');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Main Form Submit Handler
  const handleAuth = async (action) => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (action === 'signup') {
      if (!businessName.trim()) {
        setError('Please enter your Business or Brand name.');
        return;
      }
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid Receiving UPI ID (e.g. name@okhdfcbank or merchant@upi).');
        return;
      }
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile phone number.');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (action === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
            businessName: businessName.trim(),
            upiId: upiId.trim(),
            phone: phone.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to create account.');
        }

        // Seamlessly sign in client session
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        setMessage('Account created! Launching your merchant console...');
        setTimeout(() => router.push('/dashboard'), 800);

      } else if (action === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Invalid email or password. If you are new, click "Create Account".');
          }
          throw authError;
        }

        setMessage('Welcome back! Launching your merchant dashboard...');
        setTimeout(() => router.push('/dashboard'), 600);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || 'An error occurred during Google authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFC] font-sans text-slate-900 relative">
      <InteractiveBackground />
      
      {/* ────────────────────────────────────────────────────────
         LEFT PANE: STATIC HERO PRODUCT SHOWCASE (Desktop only)
         ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#0B0F19] relative z-10 flex-col justify-between p-8 xl:p-12 h-screen overflow-hidden border-r border-slate-800/80 shrink-0">
        
        {/* Deep Tech Grid Line Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-25 pointer-events-none" />

        {/* Logo Wordmark header */}
        <Link href="/" className="inline-block relative z-10 shrink-0">
          <MyMobPayLogo className="w-40 xl:w-44 h-auto" textColor="#FFFFFF" />
        </Link>

        {/* Core Value Copy and Vector Terminal Simulator alignment */}
        <div className="grid grid-cols-12 gap-6 xl:gap-8 items-center relative z-10 my-auto">
          
          <div className="col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/50 border border-blue-700/70 rounded-full text-[11px] font-extrabold text-blue-300 uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Direct P2P Settlements
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
              Built for founders defying all odds
            </h2>
            
            <p className="text-xs xl:text-sm text-slate-300 leading-relaxed font-medium">
              Join thousands of businesses managing billing programmatically with flat-rate subscriptions and 0% gateway cuts.
            </p>

            <div className="pt-1 space-y-3 font-semibold text-xs text-white">
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-100 text-xs xl:text-sm font-medium">Zero transaction cuts on monthly volumes</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-100 text-xs xl:text-sm font-medium">HMAC-SHA256 signed developer webhooks</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-100 text-xs xl:text-sm font-medium">Risk-free sandbox simulation active</span>
              </p>
            </div>
          </div>

          {/* Interactive Bezel Frame containing payment mockup */}
          <div className="col-span-5 flex justify-end">
            <div className="relative w-full max-w-[210px] xl:max-w-[230px] bg-slate-900 border-4 border-slate-800 rounded-[28px] shadow-2xl overflow-hidden aspect-[9/18] flex flex-col transition-transform duration-500 hover:scale-[1.03]">
              
              {/* Speaker camera notch */}
              <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-30">
                <div className="bg-slate-800 w-20 h-2.5 rounded-b-xl" />
              </div>

              {/* simulated checkout screen content */}
              <div className="flex-1 bg-[#0B192C] pt-5 px-3 pb-3 flex flex-col justify-between font-sans select-none text-white text-[10px]">
                
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[7px] font-bold text-slate-400 px-0.5">
                    <span>10:42 AM</span>
                    <span>LTE</span>
                  </div>

                  <div className="flex flex-col items-center pt-0.5">
                    <MyMobPayLogo className="w-20 h-auto" textColor="#FFFFFF" />
                    <p className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Direct Bank Checkout</p>
                  </div>

                  <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2 shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-[6.5px] text-slate-400 font-bold uppercase">
                      <span>Total Due</span>
                      <span className="text-[#3395FF] font-extrabold bg-[#0B2447] px-1 py-0.2 rounded text-[5px] uppercase">P2P Route</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-[9px] font-bold text-slate-400 mr-0.2">₹</span>
                      <span className="text-lg font-black text-white tracking-tight leading-none">500.00</span>
                    </div>
                  </div>

                  {/* QR Vector preview */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center space-y-1.5 relative overflow-hidden group">
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#3395FF] to-transparent top-0 animate-laser" />

                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-slate-800" fill="currentColor">
                      <path d="M0,0 h24 v6 h-18 v18 h-6 z M76,0 h24 v24 h-6 v-18 h-18 z M0,76 h6 v18 h18 v6 h-24 z M76,100 h24 v-24 h-6 v18 h-18 z" fill="#00529B" opacity="0.15" />
                      <rect x="10" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="17" width="6" height="6" fill="#3B82F6" />
                      <rect x="70" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="74" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="77" y="17" width="6" height="6" fill="#3B82F6" />
                      <rect x="10" y="70" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="74" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="77" width="6" height="6" fill="#3B82F6" />
                      <path d="M40,10 h6 v6 h-6 z M50,15 h8 v4 h-8 z M45,25 h10 v4 h-10 z M35,35 h8 v8 h-8 z M55,35 h12 v4 h-12 z M35,50 h12 v4 h-12 z M50,50 h6 v6 h-6 z M10,40 h8 v8 h-8 z M25,45 h10 v4 h-10 z M70,40 h8 v6 h-8 z M82,45 h8 v4 h-8 z M70,55 h12 v4 h-12 z M10,55 h6 v6 h-6 z M80,70 h10 v8 h-10 z M80,85 h8 v8 h-8 z" fill="#0F172A" />
                      <rect x="40" y="40" width="20" height="20" fill="#3B82F6" rx="3" />
                      <text x="50" y="54" fontFamily="'Orbitron', sans-serif" fontWeight="950" fontSize="13" fill="#FFFFFF" textAnchor="middle">M</text>
                    </svg>
                    
                    <span className="text-[5.5px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> Auto-Verify Active
                    </span>
                  </div>

                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-700/50 text-center text-[6px] font-bold text-slate-400 uppercase tracking-wide">
                  Secure checkout by MyMobPay
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Footer info in left panel */}
        <p className="text-xs text-slate-400 font-semibold relative z-10 shrink-0">
          © 2026 MyMobPay · Secure B2B Gateway Infrastructures
        </p>

      </div>

      {/* ────────────────────────────────────────────────────────
         RIGHT PANE: UNIFIED COMPACT AUTHENTICATION CARD
         ──────────────────────────────────────────────────────── */}
      <div className="col-span-1 lg:col-span-5 bg-gradient-to-b from-[#F8FAFC] to-[#EDF2F7] flex flex-col justify-start lg:justify-center items-center px-4 sm:px-6 py-6 lg:py-6 relative z-10 h-auto lg:h-screen overflow-y-auto">
        
        {/* Mobile Header Brand visibility logo */}
        <div className="lg:hidden mb-4 relative z-10 mt-2">
          <Link href="/">
            <MyMobPayLogo className="w-36 h-auto" textColor="#0F172A" />
          </Link>
        </div>

        {/* Single Unified Card for Both Sign In and Create Account */}
        <div className="w-full max-w-[420px] bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.06)] relative z-10 my-auto transition-all">
          
          {/* COMPACT DUAL-TAB SELECTOR */}
          <div className="bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] flex gap-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
                setMode('signin');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#2563EB] shadow-xs border border-[#CBD5E1]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/50'
              }`}
            >
              <LogIn className={`w-3.5 h-3.5 ${mode === 'signin' ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
                setMode('signup');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/50'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${mode === 'signup' ? 'text-white' : 'text-[#2563EB]'}`} />
              <span>Create Account</span>
            </button>
          </div>

          {/* Header Title */}
          <div className="text-left mb-3.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
              {mode === 'signin' ? 'Sign in to Console' : 'Create Merchant Account'}
            </h1>
            <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
              {mode === 'signin' 
                ? 'Enter your credentials to access your merchant dashboard' 
                : 'Start accepting 0% fee direct UPI payments'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-[11px] font-bold mb-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal">{error}</div>
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl text-[11px] font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleAuth(mode); }} className="space-y-2.5">
            
            {/* Business / Brand Name (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-wider mb-1">
                  Business / Brand Name <span className="text-[#2563EB]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#64748B]" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full !bg-white border border-[#CBD5E1] rounded-lg py-2 pl-9 pr-3 text-xs font-medium !text-[#0F172A] placeholder:text-[#94A3B8] focus:!bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-xs"
                    placeholder="e.g. Acme Tech Studio"
                  />
                </div>
              </div>
            )}

            {/* Receiving UPI ID (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-wider mb-1">
                  Receiving UPI ID (VPA) <span className="text-[#2563EB]">*</span>
                </label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#64748B]" />
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full !bg-white border border-[#CBD5E1] rounded-lg py-2 pl-9 pr-3 text-xs font-medium !text-[#0F172A] placeholder:text-[#94A3B8] focus:!bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-xs"
                    placeholder="e.g. merchant@okhdfcbank"
                  />
                </div>
              </div>
            )}

            {/* Phone Number (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-wider mb-1">
                  Mobile Phone Number <span className="text-[#2563EB]">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#64748B]" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full !bg-white border border-[#CBD5E1] rounded-lg py-2 pl-9 pr-3 text-xs font-medium !text-[#0F172A] placeholder:text-[#94A3B8] focus:!bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-xs"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  {mode === 'signup' ? 'Work Email Address' : 'Email Address'} <span className="text-[#2563EB]">*</span>
                </label>
                {mode === 'signup' && isEmailVerified && (
                  <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3 text-emerald-700 stroke-[3]" /> Verified
                  </span>
                )}
              </div>
              
              <div className="relative flex items-center">
                <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#64748B]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                  className={`w-full !bg-white border border-[#CBD5E1] rounded-lg py-2 pl-9 ${mode === 'signup' ? 'pr-24' : 'pr-3'} text-xs font-medium !text-[#0F172A] placeholder:text-[#94A3B8] focus:!bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-xs`}
                  placeholder="name@company.com"
                />

                {/* Send OTP button in Signup */}
                {mode === 'signup' && !isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={otpSending || resendCooldown > 0 || !email.includes('@')}
                    className="absolute right-1 px-2 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-bold text-[10px] rounded-md transition-all shadow-xs cursor-pointer flex items-center gap-1 select-none"
                  >
                    {otpSending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : resendCooldown > 0 ? (
                      `${resendCooldown}s`
                    ) : otpSent ? (
                      'Resend'
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                )}
              </div>

              {/* Inline OTP input box appearing directly under Email section */}
              {mode === 'signup' && otpSent && !isEmailVerified && (
                <div className="mt-2 p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl space-y-1.5 animate-scale-up shadow-xs">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#1E293B]">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[#2563EB]" /> Enter 6-digit OTP
                    </span>
                    {resendCooldown > 0 && (
                      <span className="text-[#2563EB] font-mono text-[9px] font-bold">Resend in {resendCooldown}s</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="flex-1 !bg-white border border-[#CBD5E1] rounded-lg py-1.5 px-2.5 text-xs font-mono font-bold tracking-widest !text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyInlineOtp}
                      disabled={otpVerifying || otp.length < 4}
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#CBD5E1] disabled:text-[#64748B] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {otpVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-wider mb-1">
                {mode === 'signup' ? 'Create Password (min 6 chars)' : 'Password'} <span className="text-[#2563EB]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#64748B]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                  className="w-full !bg-white border border-[#CBD5E1] rounded-lg py-2 pl-9 pr-3 text-xs font-medium !text-[#0F172A] placeholder:text-[#94A3B8] focus:!bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-xs"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-1.5 flex flex-col gap-2">
              
              {/* Primary Action CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] text-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to Console' : 'Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </>
                )}
              </button>
              
              {/* Quick Switch */}
              <div className="text-center">
                <p className="text-[11px] text-[#64748B] font-medium">
                  {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMessage('');
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                    }}
                    className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-bold cursor-pointer"
                  >
                    {mode === 'signin' ? 'Create one' : 'Sign in'}
                  </button>
                </p>
              </div>

              <div className="relative my-0.5 flex items-center">
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
                <span className="flex-shrink mx-2 text-[#94A3B8] text-[9px] font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
              </div>

              {/* Google OAuth Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] font-bold py-2 px-3 rounded-xl transition-all disabled:opacity-55 flex items-center justify-center gap-2 shadow-xs text-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.57h3.32c1.94,-1.78 3.05,-4.4 3.05,-7.47c0,-0.3 -0.03,-0.6 -0.08,-0.9Z" fill="#4285F4" />
                    <path d="M12,20.7c2.35,0 4.32,-0.78 5.76,-2.13l-3.32,-2.57c-0.92,0.62 -2.1,0.98 -3.44,0.98c-2.28,0 -4.21,-1.54 -4.9,-3.61H2.68v2.66c1.47,2.92 4.5,4.67 7.92,4.67Z" fill="#34A853" />
                    <path d="M7.1,13.38c-0.18,-0.52 -0.28,-1.09 -0.28,-1.68c0,-0.59 0.1,-1.16 0.28,-1.68V7.36H2.68C2.06,8.6 1.7,10.01 1.7,11.7c0,1.69 0.36,3.1 0.98,4.34l3.74,-2.91c-0.18,-0.52 -0.18,-0.75 -0.32,-1.75Z" fill="#FBBC05" />
                    <path d="M12,5.68c1.28,0 2.43,0.44 3.34,1.3l2.5,-2.5C16.31,3.07 14.34,2.7 12,2.7c-3.42,0 -6.45,1.75 -7.92,4.67l4.4,3.38C9.17,7.22 10.1,5.68 12,5.68Z" fill="#EA4335" />
                  </g>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>

          </form>

        </div>

        <p className="lg:hidden mt-3 text-[10px] text-[#94A3B8] font-medium text-center">
          © 2026 MyMobPay · B2B Payments Gateway
        </p>

      </div>

    </div>
  );
}
