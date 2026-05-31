'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const MyMobPayLogo = ({ className = '', textColor = 'var(--text-primary)', iconSize = 32 }) => (
  <div className={`flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02] ${className}`}>
    <Image
      src="/logos/black.png"
      alt="MyMobPay"
      width={iconSize}
      height={iconSize}
      className="object-contain flex-shrink-0"
      style={{ width: iconSize, height: iconSize }}
    />
    <span style={{ fontFamily: "'Outfit', 'Inter', sans-serif", color: textColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
      <span style={{ fontWeight: 500 }}>mymob</span><span style={{ fontWeight: 800 }}>pay</span>
    </span>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (action) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (action === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please sign in instead.');
        }

        // Create default merchant profile
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('merchants')
            .insert({
              id: data.user.id,
              business_name: 'Business',
              upi_id: 'pending@upi',
            });
          
          if (profileError && profileError.code !== '23505') {
            console.error('Profile creation error:', profileError);
          }
        }

        setMessage('Account created! Logging you in...');
        setTimeout(() => router.push('/dashboard'), 1500);

      } else if (action === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans text-slate-900 overflow-hidden">
      
      {/* ────────────────────────────────────────────────────────
         LEFT PANE: DYNAMIC PRODUCT HERO SHOWCASE (Desktop only)
         ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#0B0F19] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-900">
        
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/10 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-indigo-500/10 rounded-full filter blur-[90px] pointer-events-none" />

        {/* Decorative Grid Line Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-45 -z-10" />

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
            
            <h2 className="text-4xl font-black text-white-pure leading-tight tracking-tight">
              Built for founders defying all odds
            </h2>
            
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Join thousands of businesses managing billing programmatically with flat-rate subscriptions and 0% gateway cuts.
            </p>

            <div className="pt-2 space-y-3 font-semibold text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                <span>Zero transaction cuts on monthly volumes</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                <span>HMAC-SHA256 signed developer webhooks</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                <span>Risk-free sandbox simulation active</span>
              </p>
            </div>
          </div>

          {/* Interactive Bezel Frame containing payment mockup */}
          <div className="col-span-5 flex justify-end">
            <div className="relative w-full max-w-[240px] bg-slate-900 border-4 border-slate-800 rounded-[30px] shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col scale-105">
              
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

                  {/* QR Vector preview */}
                  <div className="bg-white-pure border border-slate-200 rounded-xl p-2.5 shadow-sm flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-slate-800" fill="currentColor">
                      <rect x="10" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="17" width="6" height="6" fill="#3B82F6" />
                      <rect x="70" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="74" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="77" y="17" width="6" height="6" fill="#3B82F6" />
                      <rect x="10" y="70" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="74" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="77" width="6" height="6" fill="#3B82F6" />
                      <path d="M40,10 h6 v6 h-6 z M50,15 h8 v4 h-8 z M45,25 h10 v4 h-10 z M35,35 h8 v8 h-8 z M55,35 h12 v4 h-12 z M35,50 h12 v4 h-12 z M50,50 h6 v6 h-6 z M10,40 h8 v8 h-8 z M70,40 h8 v6 h-8 z M70,55 h12 v4 h-12 z M10,55 h6 v6 h-6 z M80,70 h10 v8 h-10 z M80,85 h8 v8 h-8 z" fill="#0F172A" />
                      <rect x="40" y="40" width="20" height="20" fill="#3B82F6" rx="3" />
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
        <p className="text-[10px] text-slate-500 font-bold relative z-10">
          © 2026 MyMobPay · Secure B2B Gateway Infrastructures
        </p>

      </div>

      {/* ────────────────────────────────────────────────────────
         RIGHT PANE: BRAND MATCHED AUTHENTICATION CONSOLE
         ──────────────────────────────────────────────────────── */}
      <div className="col-span-1 lg:col-span-5 bg-slate-50 flex flex-col justify-center items-center px-6 py-12 lg:p-16 relative">
        
        {/* Mobile Header Brand visibility logo */}
        <div className="lg:hidden mb-8">
          <Link href="/">
            <MyMobPayLogo className="w-40 h-auto" />
          </Link>
        </div>

        {/* Authentication Card matching Main Website Theme */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] animate-scale-up">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Sign in or build your merchant account console</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold mb-6 flex items-start gap-2">
              <div className="mt-0.5"><Lock className="w-3.5 h-3.5 text-red-400" /></div>
              <div className="flex-1 leading-normal">{error}</div>
            </div>
          )}

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 p-3 rounded-xl text-xs font-semibold mb-6">
              {message}
            </div>
          )}

          <div className="space-y-5">
            
            {/* Email field */}
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              
              {/* Sign In CTA */}
              <button
                onClick={() => handleAuth('signin')}
                disabled={loading || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white-pure font-extrabold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 text-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
              
              {/* Create Account trigger */}
              <button
                onClick={() => handleAuth('signup')}
                disabled={loading || !email || !password}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 text-xs"
              >
                Create Account
              </button>

              <div className="relative my-3 flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[8px] font-extrabold uppercase tracking-widest">or continue with</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google OAuth Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-white-pure font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-55 flex items-center justify-center gap-2.5 shadow-sm text-xs"
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

          </div>

        </div>

        <p className="lg:hidden mt-8 text-[10px] text-slate-400 font-semibold text-center">
          © 2026 MyMobPay · B2B Payments Gateway
        </p>

      </div>

    </div>
  );
}
