'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { BadgeCheck, FileUp, Home, ShieldCheck, Stethoscope } from 'lucide-react';

export default function DoctorRegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-800 mb-4">
          <Home className="h-4 w-4" /> Home
        </Link>

        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">Doctor Verification Registration</h1>
              <p className="text-sm text-slate-600 mt-1">Submit professional identity and license details before dashboard access is approved.</p>
            </div>
          </div>

          {submitted ? (
            <div className="mt-8 border border-emerald-200 bg-emerald-50 rounded-lg p-5">
              <p className="font-semibold text-emerald-900 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5" /> Verification request submitted
              </p>
              <p className="text-sm text-emerald-800 mt-2">
                In a production healthcare system, this would be reviewed against licensing boards, NPI records, organization affiliation, and identity documents before dashboard access is enabled.
              </p>
              <Link href="/doctor/sign-in" className="inline-flex mt-4 bg-emerald-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-emerald-800 transition">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <label className="text-xs font-medium text-slate-600">
                Legal Full Name
                <input required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Professional Email
                <input type="email" required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Phone Number
                <input required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Specialty
                <select required className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">Select specialty</option>
                  <option>Family Medicine</option>
                  <option>Internal Medicine</option>
                  <option>Emergency Medicine</option>
                  <option>Pediatrics</option>
                  <option>Cardiology</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600">
                Medical License Number
                <input required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                License State / Region
                <input required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                NPI / Provider ID
                <input required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Hospital / Clinic Affiliation
                <input required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                Work Address
                <input required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Password
                <input type="password" required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Confirm Password
                <input type="password" required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                License / ID Document
                <div className="mt-1 border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 flex items-center gap-3">
                  <FileUp className="h-5 w-5 text-slate-500" />
                  <input type="file" className="text-sm text-slate-600" />
                </div>
              </label>
              <label className="sm:col-span-2 flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" required className="mt-1" />
                I certify that the submitted license, affiliation, and identity information is accurate and may be verified before clinical dashboard access.
              </label>
              <div className="sm:col-span-2 border border-amber-200 bg-amber-50 rounded-lg p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
                <p className="text-sm text-amber-800">
                  This demo records the verification intent on screen only. Production would require secure identity proofing, encrypted document storage, audit logs, RBAC, and official license/NPI verification.
                </p>
              </div>
              <button className="sm:col-span-2 bg-slate-900 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 transition">
                Submit for Verification
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
