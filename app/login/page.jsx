'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Lock, Mail, ArrowRight, ShieldCheck, 
  CheckCircle2, Building2, QrCode, Phone, KeyRound, 
  RotateCcw, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
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

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
        setError('Please enter a valid UPI ID (e.g. name@okhdfcbank or merchant@upi).');
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
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              phone: phone.trim(),
              business_name: businessName.trim(),
              upi_id: upiId.trim(),
            },
          },
        });

        if (authError) throw authError;

        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please sign in instead.');
        }

        // If session is immediately returned (no email confirmation needed in Supabase)
        if (data?.session && data?.user) {
          await supabase
            .from('merchants')
            .upsert({
              id: data.user.id,
              business_name: businessName.trim() || 'My Business',
              upi_id: upiId.trim() || 'pending@upi',
              phone_number: phone.trim() || undefined,
            });
          
          setMessage('Account created! Logging you in...');
          setTimeout(() => router.push('/dashboard'), 1200);
        } else {
          // Switch to Email OTP verification screen
          setIsOtpStep(true);
          setResendCooldown(60);
          setMessage(`A 6-digit verification code has been sent to ${email.trim()}`);
        }

      } else if (action === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) throw authError;
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      let authUser = null;
      
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanOtp,
        type: 'signup',
      });

      if (verifyError) {
        // Fallback check for email verification type
        const { data: emailData, error: emailError } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: cleanOtp,
          type: 'email',
        });
        if (emailError) throw verifyError;
        authUser = emailData?.user;
      } else {
        authUser = data?.user;
      }

      // Upsert merchant record
      const activeUser = authUser || (await supabase.auth.getUser()).data?.user;
      if (activeUser) {
        await supabase
          .from('merchants')
          .upsert({
            id: activeUser.id,
            business_name: businessName.trim() || 'My Business',
            upi_id: upiId.trim() || 'pending@upi',
            phone_number: phone.trim() || undefined,
          });
      }

      setMessage('Email verified! Launching your merchant console...');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setMessage('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (resendError) throw resendError;
      setResendCooldown(60);
      setMessage(`Verification code resent to ${email.trim()}`);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      <InteractiveBackground />
      
      {/* ────────────────────────────────────────────────────────
         LEFT PANE: DYNAMIC PRODUCT HERO SHOWCASE (Desktop only)
         ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#0B0F19] relative z-10 flex-col justify-between p-12 overflow-hidden border-r border-slate-800/80">
        
        {/* Deep Tech Grid Line Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-25 pointer-events-none" />

        {/* Logo Wordmark header */}
        <Link href="/" className="inline-block relative z-10">
          <MyMobPayLogo className="w-40 h-auto" textColor="#FFFFFF" />
        </Link>

        {/* Core Value Copy and Vector Terminal Simulator alignment */}
        <div className="grid grid-cols-12 gap-8 items-center relative z-10 my-auto">
          
          <div className="col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/40 border border-blue-800 rounded-full text-[10px] font-extrabold text-blue-400 uppercase tracking-wider">
              🟢 Direct P2P Settlements
            </div>
            
            <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
              Built for founders defying all odds
            </h2>
            
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Join thousands of businesses managing billing programmatically with flat-rate subscriptions and 0% gateway cuts.
            </p>

            <div className="pt-2 space-y-3.5 font-semibold text-xs text-white/95">
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-100">Zero transaction cuts on monthly volumes</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-100">HMAC-SHA256 signed developer webhooks</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-100">Risk-free sandbox simulation active</span>
              </p>
            </div>
          </div>

          {/* Interactive Bezel Frame containing payment mockup */}
          <div className="col-span-5 flex justify-end">
            <div className="relative w-full max-w-[240px] bg-slate-900 border-4 border-slate-800 rounded-[30px] shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col scale-105 transition-transform duration-500 hover:scale-[1.07]">
              
              {/* Speaker camera notch */}
              <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-30">
                <div className="bg-slate-800 w-20 h-2.5 rounded-b-xl" />
              </div>

              {/* simulated checkout screen content */}
              <div className="flex-1 bg-[#0B192C] pt-6 px-3.5 pb-3.5 flex flex-col justify-between font-sans select-none text-white text-[10px]">
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[7px] font-bold text-slate-400 px-0.5">
                    <span>10:42 AM</span>
                    <span>LTE</span>
                  </div>

                  <div className="flex flex-col items-center pt-1">
                    <MyMobPayLogo className="w-24 h-auto" textColor="#FFFFFF" />
                    <p className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Direct Bank Checkout</p>
                  </div>

                  <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2.5 shadow-sm space-y-1.5">
                    <div className="flex justify-between items-center text-[7px] text-slate-400 font-bold uppercase">
                      <span>Total Due</span>
                      <span className="text-[#3395FF] font-extrabold bg-[#0B2447] px-1 py-0.2 rounded text-[5px] uppercase">P2P Route</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-[10px] font-bold text-slate-400 mr-0.2">₹</span>
                      <span className="text-xl font-black text-white tracking-tight leading-none">500.00</span>
                    </div>
                  </div>

                  {/* QR Vector preview with Animated Scanning Laser */}
                  <div className="bg-white-pure border border-slate-200 rounded-xl p-2.5 shadow-sm flex flex-col items-center justify-center space-y-2 relative overflow-hidden group">
                    
                    {/* Laser Scanner Beam */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#3395FF] to-transparent top-0 animate-laser" />

                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-slate-800" fill="currentColor">
                      {/* Corner marks */}
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
                    
                    <span className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> Auto-Verify Active
                    </span>
                  </div>

                </div>

                <div className="space-y-2 pt-2.5 border-t border-slate-200 text-center text-[6px] font-bold text-slate-400 uppercase tracking-wide">
                  Secure checkout by MyMobPay
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Footer info in left panel */}
        <p className="text-[10px] text-slate-300 font-semibold relative z-10">
          © 2026 MyMobPay · Secure B2B Gateway Infrastructures
        </p>

      </div>

      {/* ────────────────────────────────────────────────────────
         RIGHT PANE: BRAND MATCHED AUTHENTICATION CONSOLE
         ──────────────────────────────────────────────────────── */}
      <div className="col-span-1 lg:col-span-5 bg-slate-50/50 flex flex-col justify-center items-center px-6 py-12 lg:p-16 relative z-10">
        
        {/* Mobile Header Brand visibility logo */}
        <div className="lg:hidden mb-8 relative z-10">
          <Link href="/">
            <MyMobPayLogo className="w-40 h-auto" />
          </Link>
        </div>

        {/* Authentication Card */}
        <div className="w-full max-w-[460px] bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] animate-scale-up relative z-10">
          
          {/* Header Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isOtpStep 
                ? 'Verify Your Email' 
                : (mode === 'signin' ? 'Welcome back' : 'Create an account')}
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
              {isOtpStep 
                ? `Enter the 6-digit verification code sent to ${email}`
                : (mode === 'signin' ? 'Sign in to access your merchant console' : 'Start collecting instant UPI payments in minutes')}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs font-semibold mb-6 flex items-start gap-2.5">
              <div className="mt-0.5"><Lock className="w-4 h-4 text-red-500 shrink-0" /></div>
              <div className="flex-1 leading-normal">{error}</div>
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 2: OTP VERIFICATION VIEW
             ══════════════════════════════════════════════════════ */}
          {isOtpStep ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-center font-mono text-lg font-black tracking-[0.35em] text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="123456"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-98 text-xs cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Verify OTP & Launch Console'}
                  {!loading && <ArrowRight className="w-4 h-4 text-white" />}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-blue-600 hover:text-blue-700 font-bold disabled:text-slate-400 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsOtpStep(false); setError(''); setMessage(''); }}
                    className="text-slate-500 hover:text-slate-800 font-semibold transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Edit Info
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ══════════════════════════════════════════════════════
                STEP 1: CREDENTIALS & ONBOARDING FORM
               ══════════════════════════════════════════════════════ */
            <form onSubmit={(e) => { e.preventDefault(); handleAuth(mode); }} className="space-y-4">
              
              {/* Business / Brand Name (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Business / Brand Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                      placeholder="e.g. Acme Tech Studio"
                    />
                  </div>
                </div>
              )}

              {/* Receiving UPI ID (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Receiving UPI ID (VPA)</label>
                  <div className="relative">
                    <QrCode className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                      placeholder="e.g. merchant@okhdfcbank"
                    />
                  </div>
                </div>
              )}

              {/* Phone Number (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                  {mode === 'signup' ? 'Work Email Address' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                  {mode === 'signup' ? 'Create Password (min 6 chars)' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                
                {/* Primary Action CTA (Sign In / Create Account) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-98 text-xs cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (mode === 'signin' ? 'Sign In' : 'Create Account & Send OTP')}
                  {!loading && <ArrowRight className="w-4 h-4 text-white" />}
                </button>
                
                {/* Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMessage('');
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold py-3.5 px-4 rounded-xl transition-all text-xs cursor-pointer"
                >
                  {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign In'}
                </button>

                <div className="relative my-3 flex items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-[8px] font-extrabold uppercase tracking-widest">or continue with</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Google OAuth Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-55 flex items-center justify-center gap-2.5 shadow-sm text-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
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
          )}

        </div>

        <p className="lg:hidden mt-8 text-[10px] text-slate-400 font-semibold text-center">
          © 2026 MyMobPay · B2B Payments Gateway
        </p>

      </div>

    </div>
  );
}
