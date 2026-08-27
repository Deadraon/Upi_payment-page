'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Landmark, Zap, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, QrCode, BellRing, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function RazorpayHumanShowcase() {
  const [activeTab, setActiveTab] = useState('qr');
  const [copiedVpa, setCopiedVpa] = useState(false);

  const tabs = [
    {
      id: 'qr',
      title: 'Instant UPI Dynamic QR',
      badge: 'Zero Intermediary',
      icon: QrCode,
      desc: 'Generate dynamic UPI QR codes that buyers scan with any Indian UPI app. Funds settle instantly to your bank account with 0% gateway cuts.',
      stat: '0.4s',
      statLabel: 'Scan Detection',
    },
    {
      id: 'webhook',
      title: 'Real-Time Webhook Engine',
      badge: 'HMAC SHA-256',
      icon: BellRing,
      desc: 'Our bank SMS & notification parsing engine automatically matches transactions and dispatches cryptographically signed callbacks to your servers.',
      stat: '< 180ms',
      statLabel: 'Dispatch Latency',
    },
    {
      id: 'settlement',
      title: 'Direct Bank Settlement',
      badge: '100% P2P Route',
      icon: Landmark,
      desc: 'Never worry about T+2 settlement days, frozen merchant funds, or reserve pools. Payments land in your current or savings account instantly.',
      stat: '0%',
      statLabel: 'Transaction Fee',
    },
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText('merchant@okhdfcbank');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <section className="py-24 bg-white border-b border-slate-200/60 overflow-hidden relative">
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">

        {/* Section Header (Razorpay Style) */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Platform Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How modern businesses collect payments with zero cuts
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed">
            See how founders and developers replace expensive 2% payment gateways with direct UPI automation.
          </p>
        </div>

        {/* Interactive Showcase Grid */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left Column: Interactive Tab Controllers */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer group ${
                      isActive
                        ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20'
                        : 'bg-slate-100/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-200 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-base font-black transition-colors ${isActive ? 'text-slate-950' : 'text-slate-700'}`}>
                          {tab.title}
                        </h3>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-200/70 text-slate-500'
                        }`}>
                          {tab.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                        {tab.desc}
                      </p>
                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-6">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Performance</span>
                            <span className="text-sm font-black text-slate-900">{tab.stat}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Metric</span>
                            <span className="text-sm font-black text-emerald-600">{tab.statLabel}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs text-center flex items-center justify-center gap-2"
              >
                <span>Get Started with Direct UPI</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{copiedVpa ? '✓ Copied Demo VPA!' : 'Copy Demo Merchant VPA'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Real Human Founder Photo with Floating Interactive Hotspots */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Interactive Image Frame */}
            <div className="relative w-full max-w-[480px] rounded-[32px] overflow-hidden bg-slate-900 border-2 border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.18)] group">
              
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/showcase_founder.jpg"
                  alt="Confident Indian female entrepreneur smiling while holding phone showing payment success"
                  fill
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20 pointer-events-none" />
              </div>

              {/* Dynamic Interactive Overlay pinned to active tab */}
              {activeTab === 'qr' && (
                <div className="absolute top-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl animate-fade-up">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Dynamic QR Ready</p>
                        <p className="text-[10px] text-slate-500 font-semibold">Scan with GPay, PhonePe, Paytm</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Auto-Match
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'webhook' && (
                <div className="absolute top-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-xl animate-fade-up text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black font-mono">POST /api/webhook</span>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                      200 OK (142ms)
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-2 truncate">
                    payload: &#123; utr: &quot;4291082&quot;, status: &quot;PAID&quot;, amount: 500 &#125;
                  </p>
                </div>
              )}

              {activeTab === 'settlement' && (
                <div className="absolute top-4 left-4 right-4 z-20 bg-emerald-600/95 backdrop-blur-md border border-emerald-400/40 rounded-2xl p-4 shadow-xl animate-fade-up text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span className="text-xs font-black">Direct Bank Credit</span>
                    </div>
                    <span className="text-[9px] font-black bg-white text-emerald-700 px-2 py-0.5 rounded-full">
                      Zero Escrow
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-100 font-medium mt-1">
                    Funds deposited straight to your current bank account without intermediary holding periods.
                  </p>
                </div>
              )}

              {/* Bottom interactive card pinned over photo */}
              <div className="absolute bottom-4 inset-x-4 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Transaction Verification</p>
                    <p className="text-xs font-black text-slate-100">100% Real-Time Settlement</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
