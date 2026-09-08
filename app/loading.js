'use client';

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070e17] text-white selection:bg-blue-500/20">
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none -z-10" />

      <div className="flex flex-col items-center gap-6 animate-fade-up">
        {/* Animated Brand Logo Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <svg
              className="w-8 h-8 text-white animate-spin"
              style={{ animationDuration: '3s' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-blue-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-1 font-black text-xl tracking-tight">
            <span className="font-['Outfit'] text-white">MyMob</span>
            <span className="font-['Orbitron'] italic text-blue-400">Pay</span>
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase animate-pulse">
            Connecting secure session...
          </p>
        </div>
      </div>
    </div>
  );
}
