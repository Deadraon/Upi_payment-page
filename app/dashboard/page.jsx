'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { LogOut, Save, Key, User, Briefcase, Link as LinkIcon, Loader2, Copy, CheckCircle, CreditCard } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
    };

    fetchSession();
  }, [router]);

  // Safe UUID generator that works on non-HTTPS connections
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;

      // Auto-fix missing api_key for older accounts
      if (!data.api_key) {
        const newKey = generateUUID();
        await supabase.from('merchants').update({ api_key: newKey }).eq('id', userId);
        data.api_key = newKey;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If profile doesn't exist, create it (fallback)
      if (error.code === 'PGRST116') {
         const newKey = generateUUID();
         const newProfile = { id: userId, business_name: 'My Business', upi_id: 'pending@upi', api_key: newKey };
         const { data: insertedData, error: insertErr } = await supabase.from('merchants').insert(newProfile).select().single();
         if (insertErr) throw insertErr;
         setProfile(insertedData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          business_name: profile.business_name,
          upi_id: profile.upi_id,
          webhook_url: profile.webhook_url
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyApiKey = () => {
    if (!profile?.api_key) return;
    navigator.clipboard.writeText(profile.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#161B22] p-6 rounded-2xl border border-[#30363D]">
          <div>
            <h1 className="text-2xl font-black">Merchant Dashboard</h1>
            <p className="text-sm text-[#8B949E]">Manage your UPI Gateway settings</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-[#21262D] hover:bg-[#30363D] rounded-lg transition-colors text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Status & API Key Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#161B22] p-6 rounded-2xl border border-[#30363D]">
            <h3 className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Account Status
            </h3>
            <div className="flex items-center gap-3 mt-4">
              <div className={`w-3 h-3 rounded-full ${profile?.subscription_status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              <span className="font-medium capitalize">{profile?.subscription_status || 'Inactive'}</span>
            </div>
            <p className="text-xs text-[#8B949E] mt-2 mb-4">Active accounts can process payments.</p>
            {profile?.subscription_status !== 'active' && (
              <button
                onClick={() => {
                  const url = `/pay?api_key=${CONFIG.platformApiKey}&amount=${CONFIG.subscriptionFee}&ref=${profile.id}&note=Subscription_Renewal`;
                  window.open(url, '_blank');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-bold flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Renew for ₹{CONFIG.subscriptionFee}/mo
              </button>
            )}
          </div>

          <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-500/20">
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" /> Secret API Key
            </h3>
            <p className="text-xs text-[#8B949E] mb-4">Use this key to generate dynamic checkout links on your website.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0D1117] border border-[#30363D] px-3 py-2 rounded-lg text-sm font-mono break-all text-blue-300">
                {profile?.api_key || 'Loading...'}
              </code>
              <button 
                onClick={copyApiKey}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Copy API Key"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-[#161B22] p-6 rounded-2xl border border-[#30363D]">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-[#30363D] pb-4">
            <Briefcase className="w-5 h-5 text-blue-400" /> Business Profile
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Business Name</label>
              <input 
                type="text" 
                value={profile?.business_name || ''} 
                onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl py-2.5 px-4 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. My Awesome Store"
              />
              <p className="text-xs text-[#8B949E] mt-1">This name appears on your public checkout page.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">UPI ID (VPA)</label>
              <input 
                type="text" 
                value={profile?.upi_id || ''} 
                onChange={(e) => setProfile({...profile, upi_id: e.target.value})}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl py-2.5 px-4 focus:border-blue-500 focus:outline-none font-mono text-emerald-400"
                placeholder="merchant@upi"
              />
              <p className="text-xs text-[#8B949E] mt-1">Payments will be sent directly to this UPI ID.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#8B949E]" /> Webhook URL (Optional)
              </label>
              <input 
                type="url" 
                value={profile?.webhook_url || ''} 
                onChange={(e) => setProfile({...profile, webhook_url: e.target.value})}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl py-2.5 px-4 focus:border-blue-500 focus:outline-none"
                placeholder="https://yourwebsite.com/api/payment-webhook"
              />
              <p className="text-xs text-[#8B949E] mt-1">We will send a POST request here when an order is verified.</p>
            </div>

            {message && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
