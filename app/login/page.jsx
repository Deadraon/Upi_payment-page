'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock, Mail, ArrowRight } from 'lucide-react';

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
              business_name: 'My Business',
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center animate-fade-in">
        {/* We can reuse the MymobPay logo text logic here for brand consistency */}
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          MyMob<span className="text-blue-600 italic">Pay</span>
        </h1>
      </div>
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-scale-up">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1.5">Welcome back</h2>
          <p className="text-sm text-slate-500 font-medium">Sign in to your merchant dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-medium mb-6 flex items-start gap-2">
            <div className="mt-0.5"><Lock className="w-3.5 h-3.5" /></div>
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-xl text-xs font-medium mb-6">
            {message}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all"
                placeholder="merchant@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => handleAuth('signin')}
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => handleAuth('signup')}
              disabled={loading || !email || !password}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              Create Account
            </button>

            <div className="relative my-3 flex items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or continue with</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-55 flex items-center justify-center gap-3 shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
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
      <p className="mt-8 text-xs text-slate-400 font-medium">© 2026 MyMobPay · B2B Payments</p>
    </div>
  );
}
