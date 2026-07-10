'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ArrowRight, Home, UserRound } from 'lucide-react';

export default function PatientSignInPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState('PT-8831A');
  const [email, setEmail] = useState('');

  const signIn = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({ patient_id: patientId });
    if (email) params.set('email', email);
    router.push(`/patient?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#f2f2f7]">
      <div className="mx-auto min-h-screen max-w-md bg-[#f8f8fb] p-4 shadow-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-800 mb-5">
          <Home className="h-4 w-4" /> Home
        </Link>
        <section className="bg-white border border-slate-200 rounded-[28px] shadow-sm p-6">
          <div className="h-12 w-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4">
            <UserRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Patient Sign In</h1>
          <p className="text-sm text-slate-600 mt-2">Use your patient ID and email to continue to your intake workspace.</p>

          <form onSubmit={signIn} className="space-y-4 mt-6">
            <label className="text-xs font-medium text-slate-600 block">
              Patient ID
              <input value={patientId} onChange={(e) => setPatientId(e.target.value)} required className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <button className="w-full bg-cyan-700 text-white rounded-full px-3 py-3 text-sm font-semibold hover:bg-cyan-800 transition flex items-center justify-center gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-5">
            New patient? <Link href="/patient/register" className="font-medium text-cyan-800 hover:text-cyan-950">Register first</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
