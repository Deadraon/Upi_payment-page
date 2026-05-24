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
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#161B22] border border-[#30363D] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#E6EDF3] mb-2">MyMobPay SaaS</h1>
          <p className="text-sm text-[#8B949E]">Sign in to your merchant dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg text-sm mb-6">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-[#8B949E]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl py-2.5 pl-10 pr-4 text-[#E6EDF3] focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="merchant@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-[#8B949E]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl py-2.5 pl-10 pr-4 text-[#E6EDF3] focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={() => handleAuth('signin')}
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => handleAuth('signup')}
              disabled={loading || !email || !password}
              className="w-full bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
