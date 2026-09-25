'use client';

/**
 * Mobile-First Login Design Example
 * This demonstrates the key design patterns from your provided HTML
 * Integrate these patterns into your existing page.jsx
 */

import { Mail, ArrowRight, Lock, Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const MyMobPayLogo = ({ className = 'h-8 w-auto', textColor = '#131b2e' }) => (
  <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
    <text x="2" y="42" letterSpacing="0">
      {/* MyMob */}
      <tspan fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="36" fill={textColor}>MyMob</tspan>
      {/* Pay */}
      <tspan fontFamily="'Orbitron', sans-serif" fontWeight="900" fontStyle="italic" fontSize="36" fill="#3B82F6" dx="3">Pay</tspan>
    </text>
  </svg>
);

export default function MobileLoginExample() {
  const [authTab, setAuthTab] = useState('otp');
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-center items-center font-sans antialiased p-4 sm:p-6">
      <div className="flex flex-col w-full max-w-sm mx-auto pb-8">
        
        {/* Brand & Gateway Badge Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          <div className="h-10 flex items-center justify-center">
            <MyMobPayLogo className="h-8 w-auto" textColor="#131b2e" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2e7ff] text-[#44474d] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009d6d] animate-pulse"></span>
            <span className="text-[11px] font-semibold tracking-wide">mymob.tech • Unified Fintech Gateway</span>
          </div>
        </div>

        {/* Header Titles */}
        <div className="text-center mb-5">
          <h1 className="text-[22px] font-semibold text-[#131b2e] tracking-tight leading-[30px]">
            Log in to Dashboard
          </h1>
          <p className="text-[12px] text-[#44474d] mt-1 leading-[16px]">
            Manage payments, instant settlements, and refunds
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-xl shadow-md p-5 space-y-5">
          
          {/* 3-Tab Segmented Control */}
          <div className="p-1 bg-[#eaedff] rounded-lg flex items-center mb-1 gap-1">
            <button 
              type="button"
              onClick={() => setAuthTab('otp')}
              className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold flex items-center justify-center transition-all ${
                authTab === 'otp'
                  ? 'bg-white text-[#2c60ff] shadow-sm'
                  : 'text-[#44474d] hover:text-[#131b2e]'
              }`}
            >
              Email OTP
            </button>
            <button 
              type="button"
              onClick={() => setAuthTab('magic')}
              className={`flex-1 py-1.5 rounded-md text-[12px] font-medium flex items-center justify-center transition-all ${
                authTab === 'magic'
                  ? 'bg-white text-[#2c60ff] shadow-sm'
                  : 'text-[#44474d] hover:text-[#131b2e]'
              }`}
            >
              Email Link
            </button>
            <button 
              type="button"
              onClick={() => setAuthTab('pass')}
              className={`flex-1 py-1.5 rounded-md text-[12px] font-medium flex items-center justify-center transition-all ${
                authTab === 'pass'
                  ? 'bg-white text-[#2c60ff] shadow-sm'
                  : 'text-[#44474d] hover:text-[#131b2e]'
              }`}
            >
              Password
            </button>
          </div>

          {/* Email OTP Form */}
          {authTab === 'otp' && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="otp-email" className="text-[12px] text-[#131b2e] font-medium leading-[16px]">
                    Work Email
                  </label>
                  {emailOtpSent && (
                    <button 
                      type="button" 
                      onClick={() => setEmailOtpSent(false)}
                      className="text-[10px] text-[#0045de] hover:underline cursor-pointer leading-[14px] tracking-wider font-semibold"
                    >
                      Change
                    </button>
                  )}
                </div>
                <div className="flex items-center bg-[#eaedff] rounded-lg px-3 py-2.5 border border-[#dae2fd] focus-within:border-[#2c60ff] transition-all">
                  <Mail className="text-[#74777e] mr-2 w-5 h-5" />
                  <input 
                    id="otp-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={emailOtpSent}
                    className="flex-1 text-[14px] text-[#131b2e] placeholder:text-[#74777e] bg-transparent outline-none leading-[20px]"
                    required
                  />
                  {email.includes('@') && email.includes('.') && (
                    <Check className="text-[#009d6d] w-[18px] h-[18px]" />
                  )}
                </div>
              </div>

              {!emailOtpSent ? (
                <>
                  <button
                    type="submit"
                    onClick={() => setEmailOtpSent(true)}
                    className="w-full py-3 px-4 rounded-lg bg-[#2c60ff] hover:bg-[#0045de] text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                  >
                    <span>Send Email OTP</span>
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </button>
                  <p className="text-[12px] text-center text-[#44474d] leading-[16px]">
                    A 6-digit one-time passcode will be sent to your email.
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] text-[#131b2e] font-medium leading-[16px]">
                        Enter 6-digit Code
                      </label>
                      <span className="text-[10px] text-[#009d6d] bg-[#eaedff] px-2 py-0.5 rounded font-medium leading-[14px] tracking-wider">
                        Sent to email
                      </span>
                    </div>
                    
                    {/* 6-Digit OTP Grid */}
                    <div className="grid grid-cols-6 gap-2 w-full">
                      {[...Array(6)].map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          placeholder="·"
                          className={`h-12 w-full text-center font-bold text-[20px] rounded-lg border-2 transition-all outline-none ${
                            emailOtp[i]
                              ? 'bg-white border-[#2c60ff] text-[#131b2e] shadow-sm'
                              : 'bg-[#f2f3ff] border-[#dae2fd] text-[#131b2e] placeholder:text-[#74777e]'
                          } focus:border-[#2c60ff] focus:bg-white focus:shadow-md`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[12px] text-[#44474d] leading-[16px]">
                        Didn&apos;t receive code?
                      </span>
                      <button 
                        type="button"
                        className="text-[10px] text-[#0045de] hover:underline cursor-pointer font-medium flex items-center gap-1 leading-[14px] tracking-wider"
                      >
                        <RefreshCw className="w-[14px] h-[14px]" /> Resend OTP (0:45)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-lg bg-[#2c60ff] hover:bg-[#0045de] text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] mt-2"
                  >
                    <span>Verify &amp; Log In</span>
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </button>
                </>
              )}

            </form>
          )}

          {/* Subtle Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full h-px bg-[#dae2fd]"></div>
            <span className="absolute bg-white px-3 text-[#74777e] text-[10px] font-bold uppercase tracking-wider leading-[14px]">
              or
            </span>
          </div>

          {/* Google Workspace SSO */}
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-lg bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] text-[12px] font-medium flex items-center justify-center gap-2.5 transition-all leading-[16px]"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4"></path>
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z" fill="#34A853"></path>
              <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" fill="#FBBC05"></path>
              <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"></path>
            </svg>
            <span>Continue with Google</span>
          </button>

        </div>

        {/* Sign Up Incentive Banner */}
        <div className="mt-5 text-center text-[12px] text-[#44474d] leading-[16px]">
          <span>New to mymobpay? </span>
          <a href="#" className="font-semibold text-[#0045de] hover:underline">
            Create an account
          </a>
        </div>

        {/* Security & Trust Indicators */}
        <div className="mt-5 flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 text-[#74777e]">
          <div className="flex items-center gap-1 text-[10px] leading-[14px] tracking-wider">
            <Lock className="w-[14px] h-[14px] text-[#009d6d]" />
            <span>256-Bit SSL</span>
          </div>
          <span className="text-[#c4c6ce]">•</span>
          <div className="flex items-center gap-1 text-[10px] leading-[14px] tracking-wider">
            <Lock className="w-[14px] h-[14px] text-[#0045de]" />
            <span>RBI PA-Compliant</span>
          </div>
        </div>

        {/* Merchant Helpline Footer */}
        <div className="mt-4 text-center">
          <p className="text-[12px] text-[#44474d] leading-[16px]">
            Need assistance?{' '}
            <a className="font-medium text-[#0045de] hover:underline" href="tel:180012369662">
              1800-123-MYMOB
            </a>
          </p>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009d6d]"></span>
            <a className="text-[10px] text-[#44474d] hover:text-[#131b2e] transition-colors leading-[14px] tracking-wider" href="#">
              Chat with Merchant Support Online
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
