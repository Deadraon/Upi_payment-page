'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Lock, Mail, ArrowRight, ShieldCheck, 
  CheckCircle2, Building2, QrCode, Phone, Smartphone,
  Zap, Eye, EyeOff, AlertCircle, X, RefreshCw, MessageCircle
} from 'lucide-react';
import QRCode from 'react-qr-code';
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

// ── 6-digit OTP box input component ────────────────────────────────
function OtpBoxInput({ value, onChange, disabled }) {
  const digits = (value || '').padEnd(6, '').split('').slice(0, 6);
  const inputRefs = useRef([]);

  const handleKey = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.slice(0, index) + value.slice(index + 1);
      onChange(next);
      if (index > 0) inputRefs.current[index - 1]?.focus();
    }
  };

  const handleInput = (index, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const arr = (value || '').split('');
    arr[index] = char;
    const next = arr.join('').slice(0, 6);
    onChange(next);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); inputRefs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onClick={e => e.target.select()}
          className={`w-10 h-12 text-center text-xl font-bold rounded-lg border-2 transition-all focus:outline-none font-mono
            ${ d
              ? 'bg-[#eaedff] border-[#2c60ff] text-[#131b2e]'
              : 'bg-[#f2f3ff] border-[#dae2fd] text-[#131b2e]'}
            focus:border-[#2c60ff] focus:bg-white focus:shadow-md focus:shadow-blue-100
            disabled:opacity-50`}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [authTab, setAuthTab] = useState('email'); // 'email' (Email OTP & Magic Link) | 'phone' (WhatsApp OTP) | 'password'

  // Email OTP & Magic Link
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailTimer, setEmailTimer] = useState(45);

  // Phone / WhatsApp OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMethod, setOtpMethod] = useState('whatsapp');
  const [otpTimer, setOtpTimer] = useState(45);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Fields (Signup only)
  const [businessName, setBusinessName] = useState('');
  const [upiId, setUpiId] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // QR Express Login Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTimer, setQrTimer] = useState(45);
  const [qrChallenge, setQrChallenge] = useState('mymob-auth-session');

  // Supabase Auth State Change Listener (for Magic Link redirects & existing session)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setMessage('Authenticated successfully! Launching merchant dashboard...');
        router.replace('/dashboard');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace('/dashboard');
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  // Email OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (emailOtpSent && emailTimer > 0) {
      interval = setInterval(() => setEmailTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [emailOtpSent, emailTimer]);

  // WhatsApp OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // QR refresh timer
  useEffect(() => {
    let interval = null;
    if (showQrModal) {
      interval = setInterval(() => {
        setQrTimer(prev => {
          if (prev <= 1) {
            setQrChallenge('mymob-auth-' + Math.random().toString(36).substring(2, 9));
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setQrTimer(45);
    }
    return () => clearInterval(interval);
  }, [showQrModal]);

  // Phone / OTP Handlers — wired to real API
  const triggerOtpFlow = useCallback(async (method = otpMethod) => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    setOtpMethod(method);

    try {
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Handle resend cooldown — server returns secondsLeft
        if (res.status === 429 && data.secondsLeft) {
          setOtpTimer(data.secondsLeft);
          setOtpSent(true); // show OTP input but with timer active
        }
        setError(data.error || 'Failed to send OTP.');
        return;
      }

      setOtpSent(true);
      setOtp('');
      setOtpTimer(45);
      setMessage(data.message || `OTP sent to +91 ${cleanPhone} via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`);
    } catch (err) {
      setError(err?.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [phone, otpMethod]);

  // Email OTP & Magic Link Handlers
  const handleSendEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid merchant email address.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`,
          shouldCreateUser: mode === 'signup',
        },
      });

      if (otpErr) {
        if (otpErr.message?.toLowerCase().includes('signups not allowed')) {
          setError('No merchant account registered with this email. Please sign up below.');
          return;
        }
        throw otpErr;
      }

      setEmailOtpSent(true);
      setEmailOtp('');
      setEmailTimer(45);
      setMessage(`Login code & Magic Link dispatched to ${cleanEmail}. Check your inbox!`);
    } catch (err) {
      console.error('Email OTP send error:', err);
      setError(err?.message || 'Could not send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: emailOtp.trim(),
        type: 'email',
      });

      if (verifyErr) {
        setError(verifyErr.message || 'Invalid or expired code. Please try again.');
        setEmailOtp('');
        return;
      }

      setMessage('Email verified! Opening your merchant dashboard...');
      setTimeout(() => router.push('/dashboard'), 600);
    } catch (err) {
      console.error('Email OTP verify error:', err);
      setError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp, purpose: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'OTP verification failed.');
        // Clear OTP boxes on wrong attempt
        if (data.remaining !== undefined) setOtp('');
        return;
      }

      if (!data.accountExists) {
        // Phone verified but no account — prompt signup
        setError('');
        setMessage('Phone verified! No merchant account found. Please sign up below.');
        setOtpSent(false);
        setOtp('');
        setMode('signup');
        return;
      }

      setMessage('WhatsApp OTP verified! Signing you in...');
      // Use session token to sign in via Supabase email magic-link or direct
      // For now, redirect — dashboard middleware will check session
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err) {
      setError(err?.message || 'Network error during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  // Legacy alias kept for button onClick compatibility
  const handleWhatsAppOtp = () => triggerOtpFlow('whatsapp');

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your merchant email address in the field above to receive a reset link.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?mode=reset`,
      });
      if (resetErr) throw resetErr;
      setMessage('Password reset link dispatched! Please check your email inbox.');
    } catch (err) {
      setError(err.message || 'Could not send password reset email.');
    } finally {
      setLoading(false);
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

        let data = {};
        try {
          data = await res.json();
        } catch (jsonErr) {
          throw new Error(`Server returned status ${res.status} (${res.statusText || 'No status text'})`);
        }

        if (!res.ok || data.error) {
          throw new Error(data.error || `Registration failed (HTTP ${res.status})`);
        }

        // Automatically sign in client session
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (signInError) {
          setMessage('Account created! Please sign in with your credentials.');
          setMode('signin');
        } else {
          setMessage('Account created! Launching your merchant console...');
          setTimeout(() => router.push('/dashboard'), 800);
        }

      } else if (action === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Invalid email or password. If you are new, click "Sign Up" below.');
          }
          throw new Error(authError.message || 'Invalid login credentials.');
        }

        setMessage('Welcome back! Launching your merchant dashboard...');
        setTimeout(() => router.push('/dashboard'), 600);
      }
    } catch (err) {
      console.error('Auth handler error:', err);
      const exactMessage = err?.message || err?.toString() || 'An error occurred during authentication.';
      setError(exactMessage);
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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans text-slate-900 relative">
      <InteractiveBackground />
      
      {/* ────────────────────────────────────────────────────────
         LEFT PANE: DYNAMIC PRODUCT HERO SHOWCASE (Desktop only)
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
          
          <div className="col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/40 border border-blue-800 rounded-full text-[10px] font-extrabold text-blue-400 uppercase tracking-wider">
              🟢 Direct P2P Settlements
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Built for founders defying all odds
            </h2>
            
            <p className="text-xs xl:text-sm text-slate-200 leading-relaxed font-medium">
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
            <div className="relative w-full max-w-[220px] xl:max-w-[240px] bg-slate-900 border-4 border-slate-800 rounded-[30px] shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col transition-transform duration-500 hover:scale-[1.04]">
              
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
                    <MyMobPayLogo className="w-22 h-auto" textColor="#FFFFFF" />
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

                    <svg viewBox="0 0 100 100" className="w-18 h-18 text-slate-800" fill="currentColor">
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
        <p className="text-[10px] text-slate-300 font-semibold relative z-10 shrink-0">
          © 2026 MyMobPay · Secure B2B Gateway Infrastructures
        </p>

      </div>

      {/* ────────────────────────────────────────────────────────
         RIGHT PANE: BRAND MATCHED AUTHENTICATION CONSOLE
         ──────────────────────────────────────────────────────── */}
      <div className="col-span-1 lg:col-span-5 bg-[#f2f3ff] h-auto lg:h-screen lg:overflow-y-auto relative z-10 font-sans">
        
        <div className="min-h-full w-full flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-10">
          
          <div className="w-full flex flex-col items-center max-w-md">

            {/* Top Branding & Institutional Mark */}
            <div className="flex flex-col items-center mb-5 text-center">
              <div className="flex items-center justify-center mb-2.5">
                <Link href="/" className="inline-block hover:opacity-95 transition-opacity">
                  <MyMobPayLogo className="h-9 sm:h-10 w-auto" textColor="#0f1b2d" />
                </Link>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2e7ff] text-[#44474d] text-[11px] font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#009d6d] animate-pulse"></span>
                <span>mymob.tech • Unified Fintech Gateway &amp; Settlement Suite</span>
              </div>
            </div>

            {/* Centered Auth Card Container */}
            <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/80">
              
              {/* Card Header */}
              <div className="p-6 sm:p-8 bg-white">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#131b2e] tracking-tight mb-1">
                    {mode === 'signin' ? 'Log in to Dashboard' : 'Create Merchant Account'}
                  </h1>
                  <p className="text-xs text-[#44474d] leading-relaxed">
                    {mode === 'signin' 
                      ? 'Manage payments, instant settlements, and customer refunds' 
                      : 'Start collecting instant 0% direct UPI payments in minutes'}
                  </p>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-normal">{error}</span>
                  </div>
                )}

                {message && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                {/* In Sign In Mode: Segmented Tab Switcher */}
                {mode === 'signin' && (
                  <div className="mt-6 p-1 bg-[#eaedff] rounded-lg grid grid-cols-3 gap-1">
                    <button 
                      type="button" 
                      onClick={() => { setAuthTab('email'); setError(''); setMessage(''); }}
                      className={`py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        authTab === 'email' 
                          ? 'bg-white text-[#0045de] shadow-sm' 
                          : 'text-[#44474d] hover:text-[#131b2e]'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email OTP</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setAuthTab('phone'); setError(''); setMessage(''); }}
                      className={`py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        authTab === 'phone' 
                          ? 'bg-white text-[#0045de] shadow-sm' 
                          : 'text-[#44474d] hover:text-[#131b2e]'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setAuthTab('password'); setError(''); setMessage(''); }}
                      className={`py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        authTab === 'password' 
                          ? 'bg-white text-[#0045de] shadow-sm' 
                          : 'text-[#44474d] hover:text-[#131b2e]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Password</span>
                    </button>
                  </div>
                )}

                {/* ── Sign In: Email OTP & Magic Link View ── */}
                {mode === 'signin' && authTab === 'email' && (
                  <div className="mt-6 flex flex-col space-y-4">
                    {!emailOtpSent ? (
                      <>
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-xs font-medium text-[#44474d] flex items-center justify-between">
                            <span>Merchant Email Address</span>
                            <span className="text-[#0045de] font-semibold flex items-center gap-1 text-[11px]">
                              <Zap className="w-3.5 h-3.5" /> Magic Link &amp; OTP
                            </span>
                          </label>
                          <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                            <Mail className="w-4 h-4 text-[#74777e] mr-2 shrink-0" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && handleSendEmailOtp()}
                              placeholder="merchant@company.com"
                              className="w-full bg-transparent py-2.5 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                            />
                          </div>
                          <p className="text-[11px] text-[#74777e] leading-relaxed">
                            We will send a 6-digit verification code and a one-click Magic Link to your inbox.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={loading || !email.trim() || !email.includes('@')}
                          className="w-full h-12 bg-[#2c60ff] hover:bg-[#0045de] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Send Magic Link &amp; OTP</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#eaedff]/60 border border-[#dae2fd]">
                          <div className="flex items-center gap-2 text-xs text-[#131b2e] font-medium">
                            <Mail className="w-4 h-4 text-[#0045de] shrink-0" />
                            <span>Code &amp; Link sent to <strong className="text-[#0045de]">{email}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setError(''); setMessage(''); }}
                            className="text-[11px] text-[#0045de] font-semibold hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[#44474d] text-center block">
                            Enter 6-digit Email Verification Code
                          </label>
                          <OtpBoxInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          disabled={loading || emailOtp.length !== 6}
                          className="w-full h-12 bg-[#2c60ff] hover:bg-[#0045de] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Verify Code &amp; Enter Dashboard</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Magic link callout */}
                        <div className="p-3 bg-[#f8f9ff] rounded-lg border border-[#dae2fd]/70 text-center">
                          <p className="text-[11px] text-[#44474d] leading-relaxed">
                            ✨ <strong>Tip:</strong> You can also simply click the <strong>Magic Sign-In Link</strong> inside your email to sign in instantly without typing the code.
                          </p>
                        </div>

                        {/* Resend button */}
                        <div className="text-center pt-1">
                          {emailTimer > 0 ? (
                            <span className="text-xs text-[#74777e]">
                              Resend code in <strong className="text-[#131b2e]">{emailTimer}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={loading}
                              className="text-xs font-semibold text-[#0045de] hover:underline cursor-pointer"
                            >
                              Didn&apos;t receive email? Resend code
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Sign In: Phone / WhatsApp OTP View ── */}
                {mode === 'signin' && authTab === 'phone' && (
                  <div className="mt-6 flex flex-col space-y-4">
                    {!otpSent ? (
                      <>
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-xs font-medium text-[#44474d] flex items-center justify-between">
                            <span>Mobile Phone Number</span>
                            <span className="text-[#009d6d] font-semibold flex items-center gap-1 text-[11px]">
                              <Zap className="w-3.5 h-3.5" /> Instant OTP
                            </span>
                          </label>
                          <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                            <div className="flex items-center gap-1.5 pr-3 py-2 text-[#131b2e] text-xs font-bold border-r border-[#dae2fd]">
                              <span className="text-base leading-none">🇮🇳</span>
                              <span>+91</span>
                            </div>
                            <input
                              type="tel"
                              maxLength={10}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                              onKeyDown={e => e.key === 'Enter' && phone.length === 10 && handleWhatsAppOtp()}
                              placeholder="Enter 10-digit mobile number"
                              className="w-full bg-transparent py-2.5 pl-3 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium tracking-wide"
                            />
                          </div>
                        </div>

                        {/* WhatsApp OTP — primary CTA */}
                        <button
                          type="button"
                          onClick={handleWhatsAppOtp}
                          disabled={loading}
                          className="w-full h-12 rounded-lg text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: '#fff' }}
                        >
                          {loading && otpMethod === 'whatsapp' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              {/* WhatsApp logo */}
                              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <span>Get OTP on WhatsApp</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Alternative: Use Email OTP & Magic Link */}
                        <button
                          type="button"
                          onClick={() => { setAuthTab('email'); setError(''); setMessage(''); }}
                          disabled={loading}
                          className="w-full h-10 bg-[#eaedff] hover:bg-[#e2e7ff] text-[#44474d] hover:text-[#131b2e] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#0045de]" />
                          <span>Use Email OTP &amp; Magic Link instead</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* OTP channel badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                            style={otpMethod === 'whatsapp'
                              ? { background: '#e7fde8', color: '#128C7E', border: '1px solid #b7f0bc' }
                              : { background: '#eaedff', color: '#0045de', border: '1px solid #dae2fd' }}>
                            {otpMethod === 'whatsapp' ? (
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            ) : (
                              <Phone className="w-3.5 h-3.5" />
                            )}
                            OTP sent to +91 {phone} via {otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtp(''); setError(''); setMessage(''); }}
                            className="text-[11px] text-[#0045de] font-semibold hover:underline"
                          >Change</button>
                        </div>

                        {/* 6-box OTP input */}
                        <div className="flex flex-col space-y-2">
                          <label className="text-xs font-medium text-[#44474d] text-center">
                            Enter the 6-digit OTP
                          </label>
                          <OtpBoxInput value={otp} onChange={setOtp} disabled={loading} />
                          <div className="flex items-center justify-between text-[11px] text-[#44474d] pt-1">
                            <span className="text-[#74777e]">
                              {otpTimer > 0 ? `Expires in ${otpTimer}s` : 'OTP expired'}
                            </span>
                            {otpTimer > 0 ? (
                              <span className="text-slate-400">Resend in {otpTimer}s</span>
                            ) : (
                              <div className="flex gap-3">
                                <button type="button" onClick={() => triggerOtpFlow('whatsapp')}
                                  className="text-[#25D366] font-bold hover:underline flex items-center gap-1">
                                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                  WhatsApp
                                </button>
                                <button type="button" onClick={() => triggerOtpFlow('sms')}
                                  className="text-[#0045de] font-bold hover:underline">SMS</button>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={loading || otp.length !== 6}
                          className="w-full h-12 bg-[#2c60ff] hover:bg-[#0045de] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Verify &amp; Log In</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ── Sign In: Email & Password View ── */}
                {mode === 'signin' && authTab === 'password' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleAuth('signin'); }} className="mt-6 flex flex-col space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-medium text-[#44474d]">Merchant Email Address</label>
                      <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                        <Mail className="w-4 h-4 text-[#74777e] mr-2 shrink-0" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full bg-transparent py-2.5 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[#44474d]">Password</label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] font-semibold text-[#0045de] hover:underline"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                        <Lock className="w-4 h-4 text-[#74777e] mr-2 shrink-0" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-transparent py-2.5 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="text-[#74777e] hover:text-[#131b2e] p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#2c60ff] hover:bg-[#0045de] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Log In to Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ── Mode: Sign Up View ── */}
                {mode === 'signup' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleAuth('signup'); }} className="mt-6 flex flex-col space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#131b2e] mb-1">Business / Brand Name</label>
                      <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                        <Building2 className="w-4 h-4 text-[#74777e] mr-2 shrink-0" />
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Acme Tech Studio"
                          className="w-full bg-transparent py-2.5 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#131b2e] mb-1">Receiving UPI ID (VPA)</label>
                      <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                        <QrCode className="w-4 h-4 text-[#74777e] mr-2 shrink-0" />
                        <input
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. merchant@okhdfcbank"
                          className="w-full bg-transparent py-2.5 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#131b2e] mb-1">Mobile Phone Number</label>
                      <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                        <div className="flex items-center gap-1.5 pr-2.5 py-1.5 text-[#131b2e] text-xs font-bold border-r border-[#dae2fd]">
                          <span className="text-base leading-none">🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit mobile number"
                          className="w-full bg-transparent py-2 pl-3 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#131b2e] mb-1">Work Email Address</label>
                      <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                        <Mail className="w-4 h-4 text-[#74777e] mr-2 shrink-0" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full bg-transparent py-2.5 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#131b2e] mb-1">Create Password (min 6 chars)</label>
                      <div className="flex items-center rounded-lg bg-[#f2f3ff] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all border border-transparent focus-within:border-blue-400">
                        <Lock className="w-4 h-4 text-[#74777e] mr-2 shrink-0" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-transparent py-2.5 text-xs text-[#131b2e] placeholder-[#74777e] focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="text-[#74777e] hover:text-[#131b2e] p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#2c60ff] hover:bg-[#0045de] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Create Account &amp; Get API Keys</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Soft Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="w-full h-px bg-[#e2e7ff]"></div>
                  <span className="absolute px-3 bg-white text-[#44474d] text-[10px] font-bold uppercase tracking-wider">
                    OR CONTINUE WITH
                  </span>
                </div>

                {/* Google Workspace Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-11 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] rounded-lg text-xs font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50 border border-slate-200/60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" fill="#4285F4"></path>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z" fill="#34A853"></path>
                    <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" fill="#FBBC05"></path>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335"></path>
                  </svg>
                  <span>Continue with Google Workspace</span>
                </button>
                {/* QR Code Express Login Bar (in Signin mode) */}
                {mode === 'signin' && (
                  <div className="mt-4 p-3.5 rounded-lg bg-[#eaedff] flex items-center justify-between gap-3 border border-[#dae2fd]/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-[#000d21] shadow-xs">
                        <QrCode className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-[#131b2e]">QR Express Login</span>
                        <span className="text-[11px] text-[#44474d] leading-tight">Scan with mymobpay Merchant Mobile App</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-[#f2f3ff] text-[#0045de] text-xs font-bold transition-colors cursor-pointer shadow-xs border border-slate-200/80"
                    >
                      Show QR
                    </button>
                  </div>
                )}

              </div>

              {/* Card Promotional Footer: Registration / Signin Incentive */}
              <div className="px-6 py-4 bg-[#eaedff] text-center border-t border-[#dae2fd]/70">
                {mode === 'signin' ? (
                  <p className="text-xs text-[#44474d]">
                    New to mymobpay?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                      className="font-bold text-[#0045de] hover:underline cursor-pointer ml-1"
                    >
                      Sign Up (Get ₹50,000 free processing credits)
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-[#44474d]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                      className="font-bold text-[#0045de] hover:underline cursor-pointer ml-1"
                    >
                      Log In to Dashboard
                    </button>
                  </p>
                )}
              </div>

            </div>

            {/* Security & Institutional Compliance Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[#44474d] text-[11px] font-semibold">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#009d6d]" />
                <span>256-Bit SSL Encryption</span>
              </div>
              <span className="hidden sm:inline text-[#c4c6ce]">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0045de]" />
                <span>RBI PA-Framework Compliant</span>
              </div>
              <span className="hidden sm:inline text-[#c4c6ce]">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#009d6d]" />
                <span>PCI-DSS Level 1</span>
              </div>
            </div>

            {/* Merchant Helpline & Support Strip */}
            <div className="mt-3.5 text-center">
              <p className="text-xs text-[#44474d]">
                Need assistance? Call merchant support:{' '}
                <a className="font-bold text-[#131b2e] hover:text-[#0045de]" href="tel:180012369662">
                  1800-123-MYMOB
                </a>
                <span className="mx-2 text-[#c4c6ce]">|</span>
                <a className="font-semibold text-[#009d6d] hover:underline" href="https://wa.me/919410181307" target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </a>
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ── Interactive QR Code Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-[#000d21]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-scale-up relative border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-[#131b2e]">Scan to Log in</span>
              <button 
                type="button" 
                onClick={() => setShowQrModal(false)}
                className="text-[#74777e] hover:text-[#131b2e] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-[#44474d] mb-4 leading-relaxed">
              Open the mymobpay Merchant App, tap on <strong>Profile &gt; Scan Web QR</strong> to instantly sign in.
            </p>

            {/* Dynamic QR Code */}
            <div className="mx-auto w-48 h-48 bg-[#f2f3ff] p-3.5 rounded-xl flex items-center justify-center relative border border-[#dae2fd]">
              <QRCode 
                value={`mymobpay://web-login?challenge=${qrChallenge}`} 
                size={160} 
                level="M" 
                style={{ width: '100%', height: 'auto' }}
              />
              <div className="absolute w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#0045de]" />
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold text-[#74777e] flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#009d6d] animate-spin" style={{ animationDuration: '4s' }} />
              <span>QR refreshes in {qrTimer}s</span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
