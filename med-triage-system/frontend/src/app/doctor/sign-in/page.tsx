'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ArrowRight, Home, Stethoscope } from 'lucide-react';

export default function DoctorSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = (event: React.FormEvent) => {
    event.preventDefault();
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-800 mb-4">
          <Home className="h-4 w-4" /> Home
        </Link>
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="h-11 w-11 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Doctor Sign In</h1>
          <p className="text-sm text-slate-600 mt-2">Verified clinicians can access the patient review dashboard.</p>

          <form onSubmit={signIn} className="space-y-4 mt-6">
            <label className="text-xs font-medium text-slate-600 block">
              Professional Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <button className="w-full bg-slate-900 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2">
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-5">
            Need access? <Link href="/doctor/register" className="font-medium text-cyan-800 hover:text-cyan-950">Register for verification</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
