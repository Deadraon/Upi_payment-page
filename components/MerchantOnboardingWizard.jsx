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
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  X,
  CreditCard,
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
        const { data, error } = await supabase
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
      setUpiError('Invalid UPI ID format. Must include username and bank handle (e.g., yourname@okhdfcbank).');
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
      }, 400);
    } catch (err) {
      setUpiError(err.message || 'Failed to save UPI ID. Please try again.');
    } finally {
      setUpiSaving(false);
    }
  };

  // Quick handle appender
  const handleAppendHandle = (handle) => {
    const raw = upiId.split('@')[0].trim();
    if (raw) {
      setUpiId(raw + handle);
    } else {
      setUpiId('username' + handle);
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
        return setBankError('Invalid IFSC code format (e.g., HDFC0001234, SBIN0004567).');
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
      // User didn't fill anything and clicked next
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header & Progress Indicator */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                  Merchant Setup Wizard
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Step {currentStep} of 4
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Configure direct settlements and auto-verification rails
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close wizard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Receiving UPI' },
              { num: 2, label: 'Auto-Verify' },
              { num: 3, label: 'Bank Details' },
              { num: 4, label: 'Ready' }
            ].map(step => (
              <div key={step.num} className="space-y-1">
                <div className="h-1.5 rounded-full overflow-hidden bg-white/15">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > step.num
                        ? 'bg-emerald-400 w-full'
                        : currentStep === step.num
                        ? 'bg-blue-400 w-full'
                        : 'w-0'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${currentStep === step.num ? 'text-white' : currentStep > step.num ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {step.num}. {step.label}
                  </span>
                  {currentStep > step.num && (
                    <Check className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* ══════════════════════════════════════════════════════════
              STEP 1: RECEIVING UPI ID (MANDATORY)
          ══════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <Smartphone className="w-3.5 h-3.5" /> Mandatory Setup
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Where should customer payments go?
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your business or personal UPI ID. 100% of customer payments will settle directly and instantly into this account on T+0 rails with 0% gateway deductions.
                </p>
              </div>

              <form onSubmit={handleSaveUpi} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Primary UPI ID / VPA <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => {
                        setUpiId(e.target.value.toLowerCase().trim());
                        setUpiError('');
                      }}
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                    {upiSaved && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Saved
                      </span>
                    )}
                  </div>
                  {upiError && (
                    <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {upiError}
                    </p>
                  )}
                </div>

                {/* Common Handles Quick Select */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                    Quick Bank Handle Shortcuts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_UPI_HANDLES.map(handle => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => handleAppendHandle(handle)}
                        className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Callout */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Direct Passthrough Rail
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-500">
                    MyMobPay never holds customer funds in escrow. All QR scans transfer money straight to this UPI address. You can update this anytime from Settings.
                  </p>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={upiSaving || !upiId.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
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
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5" /> Zero-Hardware Auto Verification
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Connect Bank Email for Automated Verification
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Whenever a customer pays, your bank emails you a credit alert. By forwarding this email to your personal MyMobPay address, our server automatically parses the UTR and marks orders as paid in seconds.
                </p>
              </div>

              {/* Dedicated Forwarding Address Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                  Your Dedicated Cloud Forwarding Address:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={forwardingEmail}
                    className="flex-1 h-11 px-3.5 rounded-xl bg-white border border-blue-300 font-mono text-xs font-bold text-slate-900 select-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(forwardingEmail, setCopiedEmail)}
                    className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-blue-700/80">
                  Emails sent to this address trigger our Cloudflare email parser automatically.
                </p>
              </div>

              {/* 3 Step Visual Instructions */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  How to setup in Gmail (takes 45 seconds):
                </span>
                
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800">
                        Open Gmail Forwarding Settings
                      </p>
                      <a
                        href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                      >
                        <span>Open Gmail Forwarding Settings</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Add Forwarding Address
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Click <strong className="text-slate-700">&quot;Add a forwarding address&quot;</strong> and paste your dedicated address above.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Confirm Google Verification
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Google will send an email to verify. Our cloud engine intercepts this email automatically so you can confirm it below!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intercepted Gmail Verification Code Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {pollingGmail && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    )}
                    Google Verification Status:
                  </span>
                  {gmailIntercept ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Intercepted
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Listening for incoming Google verification…
                    </span>
                  )}
                </div>

                {gmailIntercept ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                    <p className="text-xs text-emerald-900 font-semibold">
                      🎉 Google forwarded the verification email to your gateway address!
                    </p>
                    {gmailIntercept.type === 'link' ? (
                      <a
                        href={gmailIntercept.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <span>Confirm Forwarding in Google (1-Click)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold bg-white px-2.5 py-1 rounded border border-emerald-300 text-emerald-900">
                          {gmailIntercept.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(gmailIntercept.code, setCopiedCode)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300"
                        >
                          {copiedCode ? 'Copied ✓' : 'Copy Code'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                    Once you submit the forwarding address in Gmail, Google will send the verification email here within 30–60 seconds.
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to UPI</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteEmailStep}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" /> Optional Step
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Add Bank Account for Net Banking (Optional)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Allow your customers to pay via direct IMPS / NEFT Net Banking in addition to UPI QR. You can fill this now, or skip and add it anytime from Settings.
                </p>
              </div>

              <form onSubmit={handleSaveBank} className="space-y-3.5">
                {bankError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {bankError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={bankAccName}
                      onChange={e => setBankAccName(e.target.value)}
                      placeholder="e.g. Rahul Sharma or Store Pvt Ltd"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccNum}
                      onChange={e => setBankAccNum(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter bank account number"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccNumConfirm}
                      onChange={e => setBankAccNumConfirm(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter bank account number"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bankIfsc}
                    onChange={e => setBankIfsc(e.target.value.toUpperCase().trim())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Navigation and Skip Options */}
                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSkipBank}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                    >
                      Skip & Add Later
                    </button>

                    <button
                      type="submit"
                      disabled={bankSaving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-slate-900">
                  Your Account Is Ready!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your payment gateway is now fully configured on MyMobPay&apos;s zero-hardware automated verification rails.
                </p>
              </div>

              {/* Status Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Receiving UPI ID</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {upiId || profile?.upi_id || 'Configured'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Auto-Verification Engine</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {forwardingEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Net Banking Settlement</span>
                  <span className="font-bold text-slate-700">
                    {profile?.bank_account_number || bankAccNum ? 'Configured ✓' : 'Optional (Add anytime)'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 font-medium">Active API Key</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                    {profile?.api_key || 'active'}
                  </span>
                </div>
              </div>

              {/* Live Test Payment Link Box */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-left flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-blue-900">
                    Test your payment page now:
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Open a live ₹1.00 checkout session to see direct UPI settlement in action.
                  </p>
                </div>
                <a
                  href={`/pay?key=${profile?.api_key || ''}&amount=1.00&project=${encodeURIComponent(profile?.business_name || 'MyMobPay Merchant')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-sm transition-all"
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
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-slate-900/20 transition-all cursor-pointer flex items-center justify-center gap-2"
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
