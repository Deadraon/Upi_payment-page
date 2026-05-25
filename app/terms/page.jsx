'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Landmark, FileText, CheckCircle, Scale } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 py-12 px-6 sm:px-12 lg:px-20 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8 animate-scale-up">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Previous Page
        </button>

        {/* Heading Header */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Last updated: May 25, 2026</p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-650">
          
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-blue-600" /> 1. Merchant Service Acceptance
            </h2>
            <p>
              By registering a merchant profile on the <strong>MyMobPay Gateway</strong> platform, you agree to comply with all terms and conditions set forth herein. MyMobPay acts exclusively as a technology service provider facilitating P2P UPI payment verification and order status logs routing.
            </p>
            <p>
              Merchants are solely responsible for ensuring the legality of all products, services, and transactions processed via their custom payment links or integrations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4.5 h-4.5 text-blue-600" /> 2. RBI Compliance Disclaimer
            </h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-450 rounded-2xl text-xs space-y-2 font-medium">
              <strong className="text-amber-300 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-amber-700" /> Reserve Bank of India (RBI) Regulatory Compliance
              </strong>
              <p>
                Our platform operates strictly as a technical routing and verification middleware, and does NOT function as a payment aggregator, wallet system, or escrow agent. We do not store, hold, or pool funds at any point during transaction processing.
              </p>
            </div>
            <p>
              All transfers are executed via direct peer-to-peer (P2P) banking systems supervised by the National Payments Corporation of India (NPCI) and compliant with Reserve Bank of India (RBI) guidelines. Merchants must ensure their VPAs and associated bank accounts maintain standard regulatory compliance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-blue-600" /> 3. P2P Settlement and Fee Disclaimers
            </h2>
            <p>
              Since MyMobPay facilitates direct UPI transfers from consumer bank accounts to merchant bank accounts, settlements are **100% instant and direct**. Funds do not transit through platform-controlled bank buffers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium text-xs text-slate-500">
              <li><strong>Zero Aggregator Delay:</strong> Unlike traditional payment aggregators, there are no T+1 or T+2 holding delays. Money is settled instantly into your merchant bank account at the moment NPCI verifies the UPI credit.</li>
              <li><strong>Verification Service Fee:</strong> The subscription fee covers payment tracking, automated email/SMS verification middleware routing, and the admin console portal, and is billed on a rolling monthly cycle.</li>
              <li><strong>Chargeback & Dispute Resolution:</strong> All payment refunds, disputes, or customer queries regarding payments must be handled directly between the merchant and the end-consumer.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-600" /> 4. Service Availability & Limits
            </h2>
            <p>
              While we guarantee high-availability middleware, we are not liable for delayed notification parsing arising from NPCI network congestion, merchant bank downtime, or SMS/email routing delays.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
          <p>© 2026 MyMobPay Gateway. All rights reserved.</p>
          <p className="mt-1">Use of this platform constitutes acceptance of all terms, conditions, and RBI regulatory guidelines.</p>
        </div>

      </div>
    </div>
  );
}
