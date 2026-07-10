import Link from 'next/link';
import { Stethoscope, UserRound, ShieldCheck, ArrowRight } from 'lucide-react';

export default function PatientPage() {
  return (
    <main className="min-h-screen bg-[#f2f2f7]">
      <section className="mx-auto min-h-screen max-w-md bg-[#f8f8fb] px-4 py-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-cyan-700 text-white flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-950">HealthPredictor</p>
              <p className="text-xs text-slate-500">AI intake and clinician review</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-cyan-800 hover:text-cyan-950">
            Dashboard
          </Link>
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-cyan-700 to-slate-950 text-white p-6 mb-5">
          <p className="text-sm text-cyan-100">Welcome</p>
          <h1 className="text-3xl font-bold tracking-normal mt-2">
            Start your healthcare workflow.
          </h1>
          <p className="mt-4 text-sm text-cyan-50 leading-6">
            Choose patient intake or doctor review. Profiles, history, and AI triage stay connected.
          </p>
        </div>

        <div className="space-y-3">
            <Link href="/patient/sign-in" className="block bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:border-cyan-300 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-950">I am a Patient</h2>
                    <p className="text-sm text-slate-600 mt-1">Sign in, register, complete your profile, and start intake.</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 shrink-0" />
              </div>
            </Link>

            <Link href="/doctor/sign-in" className="block bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:border-cyan-300 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-950">I am a Doctor</h2>
                    <p className="text-sm text-slate-600 mt-1">Sign in or submit professional details for verification.</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 shrink-0" />
              </div>
            </Link>
        </div>
      </section>
    </main>
  );
}
