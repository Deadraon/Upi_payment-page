'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Zap,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Smartphone,
  Mail,
  AlertCircle,
  RefreshCw,
  Sparkles,
  X,
  Lock,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const COMMON_UPI_HANDLES = [
  '@okaxis',
  '@okhdfcbank',
  '@okicici',
  '@oksbi',
  '@paytm',
  '@ybl',
  '@ibl',
  '@axl'
];

export default function MerchantOnboardingWizard({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  initialStep = 1
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Step 1: UPI ID state
  const [upiId, setUpiId] = useState(
    profile?.upi_id && profile.upi_id !== 'pending@upi' ? profile.upi_id : ''
  );
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [upiSaved, setUpiSaved] = useState(false);

  // Step 2: Email Routing state
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [gmailCode, setGmailCode] = useState(profile?.gmail_verification_code || '');
  const [pollingGmail, setPollingGmail] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Step 3: Bank Account state (Optional)
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [bankAccName, setBankAccName] = useState(profile?.bank_account_name || profile?.business_name || '');
  const [bankAccNum, setBankAccNum] = useState(profile?.bank_account_number || '');
  const [bankAccNumConfirm, setBankAccNumConfirm] = useState(profile?.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(profile?.bank_ifsc || '');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState('');

  // Step 4: Finalizing
  const [completing, setCompleting] = useState(false);

  // Sync profile when opened
  useEffect(() => {
    if (profile) {
      if (profile.upi_id && profile.upi_id !== 'pending@upi') {
        setUpiId(profile.upi_id);
      }
      if (profile.gmail_verification_code) {
        setGmailCode(profile.gmail_verification_code);
      }
      if (profile.bank_name) setBankName(profile.bank_name);
      if (profile.bank_account_name) setBankAccName(profile.bank_account_name);
      if (profile.bank_account_number) {
        setBankAccNum(profile.bank_account_number);
        setBankAccNumConfirm(profile.bank_account_number);
      }
      if (profile.bank_ifsc) setBankIfsc(profile.bank_ifsc);
    }
  }, [profile]);

  // Step 2: Poll Supabase for intercepted Gmail verification code/link
  useEffect(() => {
    if (currentStep !== 2 || !profile?.id) return;

    let isMounted = true;
    setPollingGmail(true);

    const checkGmailCode = async () => {
      try {
        const { data } = await supabase
          .from('merchants')
          .select('gmail_verification_code')
          .eq('id', profile.id)
          .single();

        if (isMounted && data?.gmail_verification_code) {
          setGmailCode(data.gmail_verification_code);
        }
      } catch {}
    };

    checkGmailCode();
    const interval = setInterval(checkGmailCode, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      setPollingGmail(false);
    };
  }, [currentStep, profile?.id]);

  if (!isOpen) return null;

  const forwardingEmail = `${profile?.api_key || 'your-key'}@mymob.tech`;

  const copyToClipboard = (text, setDone) => {
    try {
      navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {}
  };

  // ── Save Step 1: UPI ID ───────────────────────────────────────
  const handleSaveUpi = async (e) => {
    if (e) e.preventDefault();
    setUpiError('');

    const cleanUpi = upiId.trim();
    if (!cleanUpi) {
      setUpiError('Please enter your receiving UPI ID.');
      return;
    }
    if (!cleanUpi.includes('@') || cleanUpi.startsWith('@') || cleanUpi.endsWith('@')) {
      setUpiError('Invalid format. Must include handle (e.g. yourname@okhdfcbank or 9876543210@paytm).');
      return;
    }

    setUpiSaving(true);
    try {
      const { data, error } = await supabase
        .from('merchants')
        .update({ upi_id: cleanUpi })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      setUpiSaved(true);
      if (onProfileUpdated && data) {
        onProfileUpdated(data);
      }

      setTimeout(() => {
        setUpiSaved(false);
        setCurrentStep(2);
      }, 350);
    } catch (err) {
      setUpiError(err.message || 'Failed to save UPI ID. Please try again.');
    } finally {
      setUpiSaving(false);
    }
  };

  const handleAppendHandle = (handle) => {
    const raw = upiId.split('@')[0].trim();
    if (raw) {
      setUpiId(raw + handle);
    } else {
      setUpiId('merchant' + handle);
    }
    setUpiError('');
  };

  // ── Save Step 2: Email Routing ────────────────────────────────
  const handleCompleteEmailStep = async () => {
    try {
      const currentSetup = profile?.setup_progress || {};
      const { data, error } = await supabase
        .from('merchants')
        .update({
          setup_progress: {
            ...currentSetup,
            email_forwarding: true
          }
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data && onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch {}

    setCurrentStep(3);
  };

  // ── Save Step 3: Bank Details (Optional) ──────────────────────
  const handleSaveBank = async (e) => {
    if (e) e.preventDefault();
    setBankError('');

    const cleanAcc = bankAccNum.trim();
    const cleanConfirm = bankAccNumConfirm.trim();
    const cleanIfsc = bankIfsc.trim().toUpperCase();
    const cleanName = bankAccName.trim();
    const cleanBank = bankName.trim();

    if (cleanAcc || cleanConfirm || cleanIfsc || cleanName || cleanBank) {
      if (!cleanBank) return setBankError('Please enter the bank name.');
      if (!cleanName) return setBankError('Please enter account holder name.');
      if (!cleanAcc) return setBankError('Please enter account number.');
      if (cleanAcc !== cleanConfirm) return setBankError('Account numbers do not match.');
      if (!cleanIfsc) return setBankError('Please enter IFSC code.');
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        return setBankError('Invalid IFSC code format (e.g. HDFC0001234, SBIN0004567).');
      }

      setBankSaving(true);
      try {
        const { data, error } = await supabase
          .from('merchants')
          .update({
            bank_name: cleanBank,
            bank_account_name: cleanName,
            bank_account_number: cleanAcc,
            bank_ifsc: cleanIfsc,
            enable_bank_transfer: true
          })
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        if (onProfileUpdated && data) onProfileUpdated(data);
        setCurrentStep(4);
      } catch (err) {
        setBankError(err.message || 'Failed to save bank details.');
      } finally {
        setBankSaving(false);
      }
    } else {
      setCurrentStep(4);
    }
  };

  const handleSkipBank = () => {
    setCurrentStep(4);
  };

  // ── Save Step 4: Finish Wizard ────────────────────────────────
  const handleFinishWizard = async () => {
    setCompleting(true);
    try {
      const currentSetup = profile?.setup_progress || {};
      const { data, error } = await supabase
        .from('merchants')
        .update({
          setup_progress: {
            ...currentSetup,
            onboarding_completed: true,
            email_forwarding: true
          }
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data && onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch {} finally {
      setCompleting(false);
      onClose();
    }
  };

  const isLinkOrCode = (val) => {
    if (!val) return null;
    if (val.startsWith('http://') || val.startsWith('https://')) return { type: 'link', url: val };
    if (val.startsWith('CODE:')) return { type: 'code', code: val.replace('CODE:', '') };
    if (/^\d{6,12}$/.test(val)) return { type: 'code', code: val };
    return { type: 'link', url: val };
  };

  const gmailIntercept = isLinkOrCode(gmailCode);

  const STEPS = [
    { num: 1, label: 'Receiving UPI', desc: 'Settle direct to your account' },
    { num: 2, label: 'Auto-Verify', desc: 'Cloud email forwarding' },
    { num: 3, label: 'Bank Details', desc: 'Net Banking (Optional)' },
    { num: 4, label: 'Live Ready', desc: 'Review & test payment' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ─── ELEGANT LIGHT HEADER ─── */}
        <div className="bg-white border-b border-slate-100 px-6 sm:px-8 py-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    Merchant Setup Wizard
                  </h3>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                    Step {currentStep} of 4
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete setup to activate direct UPI settlement & auto-verification
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              title="Close wizard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── MODERN STEP TRACKER ─── */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {STEPS.map(step => {
              const isDone = currentStep > step.num;
              const isActive = currentStep === step.num;
              return (
                <div key={step.num} className="space-y-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500 w-full'
                          : isActive
                          ? 'bg-blue-600 w-full'
                          : 'w-0'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-semibold tracking-tight ${
                      isActive ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {step.num}. {step.label}
                    </span>
                    {isDone && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── SCROLLABLE FORM BODY ─── */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white">

          {/* ══════════════════════════════════════════════════════════
              STEP 1: RECEIVING UPI ID (MANDATORY)
          ══════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-bold">
                  <Smartphone className="w-3.5 h-3.5" /> Essential Setup
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
                  Where should customer payments go?
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Enter your business or personal UPI ID. 100% of customer payments settle directly and instantly into this account on NPCI rails with 0% gateway commission.
                </p>
              </div>

              <form onSubmit={handleSaveUpi} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Primary Receiving UPI ID / VPA <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* High contrast, pristine light input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="font-mono text-sm font-bold">@</span>
                    </div>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => {
                        setUpiId(e.target.value.toLowerCase().trim());
                        setUpiError('');
                      }}
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      className="w-full h-12 pl-9 pr-24 rounded-2xl border-2 border-slate-200 bg-slate-50/70 text-slate-900 font-mono text-sm font-semibold placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                      autoFocus
                    />
                    {upiSaved && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>

                  {upiError && (
                    <p className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {upiError}
                    </p>
                  )}
                </div>

                {/* Quick Handle Shortcuts */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Common Bank Handle Shortcuts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_UPI_HANDLES.map(handle => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => handleAppendHandle(handle)}
                        className="px-3 py-1.5 text-xs font-mono font-semibold rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/90 hover:border-blue-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Passthrough Callout Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-slate-50 to-blue-50/40 border border-emerald-200/70 text-xs text-slate-700 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Direct Passthrough Rail (Zero Escrow)
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-600 font-medium">
                    MyMobPay never holds customer funds in escrow. All QR scans transfer money straight to this UPI address. You can update or switch this anytime from Settings.
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={upiSaving || !upiId.trim()}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <span>{upiSaving ? 'Saving…' : 'Save & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              STEP 2: EMAIL ROUTING / AUTO-VERIFICATION (MANDATORY)
          ══════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold">
                  <Zap className="w-3.5 h-3.5" /> 100% Cloud Auto-Verification
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
                  Connect Bank Email for Automated Verification
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Whenever a customer pays, your bank emails you a credit notification. By forwarding this alert to your dedicated MyMobPay cloud address, our parser automatically matches the UTR and confirms the transaction in real-time.
                </p>
              </div>

              {/* Dedicated Cloud Forwarding Address Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/90 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Your Dedicated Forwarding Address:
                  </span>
                  <span className="text-[10.5px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    Private Cloud Pipeline
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={forwardingEmail}
                    className="flex-1 h-11 px-3.5 rounded-xl bg-white border border-blue-300 font-mono text-xs font-bold text-slate-900 select-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(forwardingEmail, setCopiedEmail)}
                    className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11.5px] text-slate-600 font-medium">
                  Any UPI credit alert forwarded to this address is processed instantly by your gateway.
                </p>
              </div>

              {/* 3 Step Visual Guide */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  How to setup in Gmail (takes 45 seconds):
                </span>
                
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 shadow-xs">
                      1
                    </span>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-xs">
                        Open Gmail Forwarding Settings
                      </p>
                      <a
                        href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs"
                      >
                        <span>Open Gmail Settings Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 shadow-xs">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        Add Forwarding Address
                      </p>
                      <p className="text-slate-500 mt-0.5 font-medium leading-relaxed">
                        Click <strong className="text-slate-800">&quot;Add a forwarding address&quot;</strong> and paste your dedicated address shown above.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 shadow-xs">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        Confirm Google Verification
                      </p>
                      <p className="text-slate-500 mt-0.5 font-medium leading-relaxed">
                        Google will send an email with a verification link. Our webhook intercepts it automatically so you can confirm it right below!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intercepted Gmail Verification Card */}
              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    {pollingGmail && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    )}
                    Google Verification Listener:
                  </span>
                  {gmailIntercept ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Intercepted
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium italic">
                      Waiting for Google verification email…
                    </span>
                  )}
                </div>

                {gmailIntercept ? (
                  <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2 animate-in zoom-in-95">
                    <p className="text-xs text-emerald-900 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> Verification email successfully captured!
                    </p>
                    {gmailIntercept.type === 'link' ? (
                      <a
                        href={gmailIntercept.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <span>Confirm Forwarding in Google (1-Click)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold bg-white px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900">
                          {gmailIntercept.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(gmailIntercept.code, setCopiedCode)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors"
                        >
                          {copiedCode ? 'Copied ✓' : 'Copy Code'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200 font-medium">
                    Once you submit the address in Gmail, Google will send the confirmation email here within 30–60 seconds.
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteEmailStep}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <span>Continue to Bank Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              STEP 3: BANK DETAILS (OPTIONAL / ADD LATER)
          ══════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                  <Building2 className="w-3.5 h-3.5" /> Optional Payout Channel
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
                  Add Bank Account for Net Banking (Optional)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Allow your customers to pay via direct IMPS / NEFT Net Banking in addition to UPI QR. You can fill this now, or skip and add it anytime from Settings.
                </p>
              </div>

              <form onSubmit={handleSaveBank} className="space-y-4">
                {bankError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {bankError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={bankAccName}
                      onChange={e => setBankAccName(e.target.value)}
                      placeholder="e.g. Rahul Sharma or Store Pvt Ltd"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccNum}
                      onChange={e => setBankAccNum(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter bank account number"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccNumConfirm}
                      onChange={e => setBankAccNumConfirm(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter bank account number"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bankIfsc}
                    onChange={e => setBankIfsc(e.target.value.toUpperCase().trim())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-mono text-xs uppercase font-semibold focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xs"
                  />
                </div>

                {/* Navigation and Skip Options */}
                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSkipBank}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Skip & Add Later
                    </button>

                    <button
                      type="submit"
                      disabled={bankSaving}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <span>{bankSaving ? 'Saving…' : 'Save & Continue'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              STEP 4: SETUP COMPLETE & LIVE INTEGRATION TEST
          ══════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Your Account Is Live!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                  Your gateway is fully configured for automated cloud verification with direct T+0 settlements.
                </p>
              </div>

              {/* Status Summary Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-semibold">Receiving UPI ID</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {upiId || profile?.upi_id || 'Configured'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-semibold">Cloud Verification Forwarding</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {forwardingEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-semibold">Net Banking Settlement</span>
                  <span className="font-bold text-slate-700">
                    {profile?.bank_account_number || bankAccNum ? 'Configured ✓' : 'Optional (Add anytime)'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-500 font-semibold">Active API Key</span>
                  <span className="font-mono text-[11px] text-slate-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {profile?.api_key || 'active'}
                  </span>
                </div>
              </div>

              {/* Live Test Payment Link Box */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-left flex items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Test your payment page right now:
                  </p>
                  <p className="text-[11.5px] text-blue-800/80 font-medium">
                    Open a live ₹1.00 checkout session to see direct UPI settlement in action.
                  </p>
                </div>
                <a
                  href={`/pay?key=${profile?.api_key || ''}&amount=1.00&project=${encodeURIComponent(profile?.business_name || 'MyMobPay Merchant')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Test ₹1</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Complete Setup Action */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={completing}
                  onClick={handleFinishWizard}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-slate-900/15 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{completing ? 'Completing setup…' : 'Enter Merchant Dashboard'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
