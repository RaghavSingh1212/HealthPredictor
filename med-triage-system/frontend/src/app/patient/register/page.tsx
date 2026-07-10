'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { ArrowRight, Home, UserRound } from 'lucide-react';

export default function PatientRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    consent: false,
  });

  const patientId = useMemo(() => {
    const seed = `${form.email || form.phone || form.name || 'patient'}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
    return `PT-${seed || 'NEW'}-${Math.floor(1000 + Math.random() * 9000)}`;
  }, [form.email, form.phone, form.name]);

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const register = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({
      patient_id: patientId,
      name: form.name,
      email: form.email,
      phone: form.phone,
    });
    router.push(`/patient?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#f2f2f7]">
      <div className="mx-auto min-h-screen max-w-md bg-[#f8f8fb] p-4 shadow-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-800 mb-5">
          <Home className="h-4 w-4" /> Home
        </Link>
        <section className="bg-white border border-slate-200 rounded-[28px] shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">Patient Registration</h1>
              <p className="text-sm text-slate-600 mt-1">Create basic access, then complete your full medical profile on the next screen.</p>
            </div>
          </div>

          <form onSubmit={register} className="space-y-4 mt-6">
            <label className="text-xs font-medium text-slate-600 block">
              Full Name
              <input value={form.name} onChange={(e) => update('name', e.target.value)} required className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Email
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Phone Number
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} required className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Date of Birth
              <input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} required className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Generated Patient ID
              <input value={patientId} readOnly className="mt-1 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 text-slate-500" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Password
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <label className="text-xs font-medium text-slate-600 block">
              Confirm Password
              <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required className="mt-1 w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white" />
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.consent} onChange={(e) => update('consent', e.target.checked)} required className="mt-1" />
              I consent to storing my profile and intake information for clinician review in this demo system.
            </label>
            <button className="w-full bg-cyan-700 text-white rounded-full px-3 py-3 text-sm font-semibold hover:bg-cyan-800 transition flex items-center justify-center gap-2">
              Create Account and Build Profile <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-5">
            Already registered? <Link href="/patient/sign-in" className="font-medium text-cyan-800 hover:text-cyan-950">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
