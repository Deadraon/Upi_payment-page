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
          </div>
        </div>
      </div>
      <p className="mt-8 text-xs text-slate-400 font-medium">© 2026 MyMobPay · B2B Payments</p>
    </div>
  );
}
