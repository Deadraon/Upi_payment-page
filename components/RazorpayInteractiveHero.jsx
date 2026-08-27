'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { CheckCircle2, ShieldCheck, Zap, ArrowUpRight, Sparkles, Smartphone, Landmark, Bell } from 'lucide-react';

export default function RazorpayInteractiveHero({ demoAmount = '500' }) {
  const containerRef = useRef(null);

  // 3D Parallax Tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Interactive Payment Simulator State
  const [selectedApp, setSelectedApp] = useState('GPay');
  const [activeAmount, setActiveAmount] = useState(demoAmount || '500');
  const [collectedTotal, setCollectedTotal] = useState(14500);
  const [simulatedCount, setSimulatedCount] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastPayment, setLastPayment] = useState({
    name: 'Rahul V.',
    amount: '4,500',
    app: 'Google Pay',
    utr: '429108492019',
    latency: '134ms'
  });
  const [showSuccessRipple, setShowSuccessRipple] = useState(false);

  // Play subtle web audio chime on simulated payment
  const playPaymentSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pleasant dual tone fintech chime
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } catch {
      // AudioContext might be blocked until user gesture, ignore
    }
  }, []);

  // Handle 3D perspective mouse movement
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    // Smooth tilt angles
    setTilt({
      x: Math.max(-10, Math.min(10, x * 18)),
      y: Math.max(-10, Math.min(10, -y * 18)),
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Simulate Instant UPI Payment
  const handleSimulatePayment = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    playPaymentSound();
    setShowSuccessRipple(true);

    const names = ['Aman Sharma', 'Sneha Patel', 'Vikram Rao', 'Ananya Roy', 'Deepak Verma'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const numAmount = parseInt(activeAmount, 10) || 500;
    const randomUTR = '42' + Math.floor(1000000000 + Math.random() * 9000000000);
    const randomLatency = Math.floor(110 + Math.random() * 60) + 'ms';

    setTimeout(() => {
      setCollectedTotal(prev => prev + numAmount);
      setSimulatedCount(prev => prev + 1);
      setLastPayment({
        name: randomName,
        amount: numAmount.toLocaleString('en-IN'),
        app: selectedApp === 'GPay' ? 'Google Pay' : selectedApp === 'PhonePe' ? 'PhonePe' : selectedApp === 'Paytm' ? 'Paytm' : 'BHIM UPI',
        utr: randomUTR,
        latency: randomLatency
      });
      setIsSimulating(false);
    }, 300);

    setTimeout(() => {
      setShowSuccessRipple(false);
    }, 1800);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[540px] mx-auto select-none perspective-[1200px] transition-all duration-300"
      style={{ perspective: '1200px' }}
    >
      {/* Dynamic Aurora Glow Backdrop */}
      <div 
        className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-sky-400/20 to-indigo-600/20 rounded-[48px] blur-3xl opacity-75 transition-transform duration-500 pointer-events-none"
        style={{
          transform: `scale(${isHovered ? 1.05 : 1}) translate3d(${tilt.x * 2}px, ${-tilt.y * 2}px, 0)`
        }}
      />

      {/* Main 3D Card Wrapper */}
      <div
        className="relative rounded-[36px] bg-slate-900/90 border border-slate-700/60 p-2 sm:p-3 shadow-[0_24px_64px_rgba(15,23,42,0.35)] backdrop-blur-md overflow-visible transition-transform duration-200 ease-out"
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* The Real Human Founder Commercial Photo */}
        <div className="relative w-full aspect-[4/3.2] sm:aspect-[4/3] rounded-[28px] overflow-hidden bg-slate-800 shadow-inner group">
          <Image
            src="/hero_merchant.jpg"
            alt="Young Indian SaaS founder holding smartphone with live verified UPI payment"
            fill
            sizes="(max-width: 768px) 100vw, 540px"
            priority
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />

          {/* Cinematic Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />

          {/* Success Flash Ripple Animation */}
          {showSuccessRipple && (
            <div className="absolute inset-0 bg-emerald-500/15 animate-ping pointer-events-none" />
          )}

          {/* Top Edge Pill: Live Merchant Mode */}
          <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-full shadow-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Live Merchant Online</span>
          </div>

          {/* Top Right Edge Pill: Instant Zero Escrow */}
          <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white px-2.5 py-1 rounded-full shadow-md text-[9px] font-black tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-200" />
            <span>Direct P2P · 0% Fee</span>
          </div>

          {/* Bottom Bar overlay over photo */}
          <div className="absolute bottom-3 inset-x-3 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-700/70 rounded-2xl p-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Settled Direct to Bank</p>
                <p className="text-xs font-black text-white">HDFC Bank A/c •••• 4092</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Today&apos;s Inflow</span>
              <span className="text-sm font-black text-emerald-400 tracking-tight">
                ₹{collectedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* ─── FLOATING INTERACTIVE CARDS (RAZORPAY STYLE) ─── */}

        {/* 1. TOP-LEFT FLOATING LIVE PAYMENT CARD */}
        <div
          className="absolute -top-6 -left-4 sm:-left-8 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.15)] flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          style={{
            transform: `translate3d(${tilt.x * -1.2}px, ${tilt.y * -1.2}px, 45px)`,
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 relative">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-pulse-success" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Payment Received
              </span>
              <span className="text-[9px] font-bold text-slate-400">{lastPayment.latency}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <p className="text-base font-black text-slate-950">₹{lastPayment.amount}</p>
              <span className="text-[10px] font-bold text-slate-500">from {lastPayment.name}</span>
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
              Via {lastPayment.app} · UTR: {lastPayment.utr.slice(0, 8)}•••
            </p>
          </div>
        </div>

        {/* 2. BOTTOM-RIGHT INTERACTIVE PAYMENT TRIGGER CONTROLLER */}
        <div
          className="absolute -bottom-10 -right-2 sm:-right-8 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 shadow-[0_20px_48px_rgba(0,0,0,0.35)] w-[260px] sm:w-[280px] space-y-2.5 transition-all duration-300 hover:border-blue-500"
          style={{
            transform: `translate3d(${tilt.x * 1.5}px, ${tilt.y * 1.5}px, 60px)`,
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Live Interactive Demo</span>
            </div>
            <span className="text-[8px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded uppercase">
              Clickable
            </span>
          </div>

          {/* Quick Select Amounts */}
          <div className="flex items-center gap-1.5 justify-between">
            {['500', '2000', '4500'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAmount(amt);
                }}
                className={`flex-1 py-1 rounded-lg text-[10px] font-black border transition-all ${
                  activeAmount === amt
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {/* UPI App selector */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
              <button
                key={app}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApp(app);
                }}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                  selectedApp === app
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {app}
              </button>
            ))}
          </div>

          {/* Interactive Trigger Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSimulatePayment();
            }}
            disabled={isSimulating}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer group"
          >
            {isSimulating ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>Processing UPI...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 group-hover:scale-125 transition-transform" />
                <span>Simulate UPI Payment (₹{activeAmount})</span>
              </>
            )}
          </button>

          <p className="text-[8px] text-center text-slate-500 font-semibold">
            ⚡ Triggers instant real-time webhook callback test
          </p>
        </div>

        {/* 3. FLOATING METRIC CHIP: Uptime & Speed */}
        <div
          className="hidden sm:flex absolute -right-6 top-1/3 z-25 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-2 rounded-xl shadow-lg flex-col gap-0.5 -rotate-3 hover:rotate-0 transition-transform duration-300"
          style={{
            transform: `translate3d(${tilt.x * 1.8}px, ${tilt.y * 1.8}px, 35px)`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] font-black text-slate-900">99.98% SUCCESS</span>
          </div>
          <span className="text-[8px] font-bold text-slate-500">Latency &lt; 180ms</span>
        </div>

      </div>

      {/* Interactive Helper Hint below card */}
      <div className="flex items-center justify-center gap-2 mt-12 sm:mt-14 text-slate-500 text-xs font-bold">
        <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
        <span>Move mouse to tilt in 3D · Click &quot;Simulate UPI Payment&quot; to test</span>
      </div>
    </div>
  );
}
