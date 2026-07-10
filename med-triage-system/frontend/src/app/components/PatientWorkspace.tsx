'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ClipboardList, MessageCircle, Plus, Save, Trash2, UserRound, X } from 'lucide-react';
import ChatWidget from './ChatWidget';

type PatientProfile = {
  patient_id: string;
  name: string;
  age: string;
  sex: string;
  phone: string;
  email: string;
  blood_group: string;
  emergency_contact: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  past_surgeries: string[];
  family_history: string[];
  lifestyle_notes: string;
  important_notes: string;
};

type ListField =
  | 'allergies'
  | 'chronic_conditions'
  | 'current_medications'
  | 'past_surgeries'
  | 'family_history';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const initialProfile: PatientProfile = {
  patient_id: 'PT-RAGHA-2102',
  name: 'Raghav Singh',
  age: '24',
  sex: 'Male',
  phone: '5107388851',
  email: 'raghav.world1212@gmail.com',
  blood_group: '',
  emergency_contact: '',
  allergies: ['Penicillin', 'Peanuts'],
  chronic_conditions: ['Asthma', 'Diabetes'],
  current_medications: ['Metformin', 'Inhaler'],
  past_surgeries: ['Appendectomy', 'Knee surgery'],
  family_history: [],
  lifestyle_notes: '',
  important_notes: '',
};

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function AddListSection({
  title,
  placeholder,
  values,
  onAdd,
  onRemove,
}: {
  title: string;
  placeholder: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft('');
  };

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <span className="text-xs text-slate-400">{values.length}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-cyan-600 focus:bg-white"
        />
        <button type="button" onClick={submit} className="h-10 w-10 rounded-full bg-cyan-700 text-white flex items-center justify-center hover:bg-cyan-800 transition" title={`Add ${title}`}>
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {values.map((value, index) => (
          <div key={`${value}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
            <span className="text-sm text-slate-800">{value}</span>
            <button type="button" onClick={() => onRemove(index)} className="h-8 w-8 rounded-full text-slate-400 hover:bg-white hover:text-red-600 transition" title={`Remove ${value}`}>
              <Trash2 className="h-4 w-4 mx-auto" />
            </button>
          </div>
        ))}
        {values.length === 0 && <p className="text-sm text-slate-400 py-1">No items added yet.</p>}
      </div>
    </section>
  );
}

export default function PatientWorkspace() {
  const [profile, setProfile] = useState<PatientProfile>(initialProfile);
  const [status, setStatus] = useState('Profile ready');
  const [caseCount, setCaseCount] = useState(0);
  const [screen, setScreen] = useState<'profile' | 'home'>('profile');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const patientSummary = useMemo(() => {
    const basics = [profile.age && `${profile.age} yrs`, profile.sex, profile.blood_group].filter(Boolean).join(' / ');
    return basics || 'Complete your profile';
  }, [profile.age, profile.sex, profile.blood_group]);

  const fetchHistory = async (patientId = profile.patient_id) => {
    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/history`);
      if (!res.ok) return;
      const data = await res.json();
      setCaseCount(data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patient_id') || initialProfile.patient_id;
    const name = params.get('name');
    const email = params.get('email');
    const phone = params.get('phone');

    setProfile((prev) => ({
      ...prev,
      patient_id: patientId,
      name: name || prev.name,
      email: email || prev.email,
      phone: phone || prev.phone,
    }));

    fetch(`${API_URL}/api/patients/${patientId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setProfile({
          patient_id: data.patient_id || patientId,
          name: data.name || '',
          age: data.age?.toString() || '',
          sex: data.sex || '',
          phone: data.phone || '',
          email: data.email || '',
          blood_group: data.blood_group || '',
          emergency_contact: data.emergency_contact || '',
          allergies: normalizeList(data.allergies),
          chronic_conditions: normalizeList(data.chronic_conditions),
          current_medications: normalizeList(data.current_medications),
          past_surgeries: normalizeList(data.past_surgeries),
          family_history: normalizeList(data.family_history),
          lifestyle_notes: data.lifestyle_notes || '',
          important_notes: data.important_notes || '',
        });
      })
      .catch(() => undefined);
    fetchHistory(patientId);
  }, []);

  const updateField = (field: keyof PatientProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const addListItem = (field: ListField, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: [...prev[field], value] }));
  };

  const removeListItem = (field: ListField, index: number) => {
    setProfile((prev) => ({ ...prev, [field]: prev[field].filter((_, itemIndex) => itemIndex !== index) }));
  };

  const saveProfile = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setStatus('Saving profile...');
    const payload = {
      ...profile,
      age: profile.age ? Number(profile.age) : null,
    };

    try {
      const res = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Unable to save profile');
      setStatus('Profile saved');
      fetchHistory();
      setScreen('home');
    } catch (err) {
      console.error(err);
      setStatus('Profile could not be saved');
    }
  };

  const HomeScreen = () => (
    <section className="px-4 py-5 space-y-4">
      <div className="rounded-[32px] bg-gradient-to-br from-cyan-700 to-slate-950 p-6 text-white">
        <p className="text-sm text-cyan-100">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">{profile.name || 'Patient'}</h1>
        <p className="mt-3 text-sm text-cyan-50">{patientSummary}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/12 p-3">
            <p className="text-xs text-cyan-100">Cases</p>
            <p className="mt-1 text-2xl font-semibold">{caseCount}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3">
            <p className="text-xs text-cyan-100">Patient ID</p>
            <p className="mt-2 text-sm font-semibold truncate">{profile.patient_id}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Appointments</h2>
              <p className="text-xs text-slate-500">Upcoming visits</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No appointments</p>
          <p className="mt-1 text-xs text-slate-500">Your upcoming appointments will appear here.</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800">
          <ClipboardList className="h-4 w-4 text-cyan-700" />
          <h2 className="text-sm font-semibold">Medical Snapshot</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Allergies</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{profile.allergies.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Medications</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{profile.current_medications.length}</p>
          </div>
        </div>
      </section>
    </section>
  );

  return (
    <main className="min-h-screen bg-[#f2f2f7] text-slate-950">
      <div className="mx-auto min-h-screen max-w-md bg-[#f8f8fb] shadow-2xl">
        <header className="sticky top-0 z-10 bg-[#f8f8fb]/95 backdrop-blur border-b border-slate-200">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <Link href="/" className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600" title="Home">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <p className="text-sm font-semibold text-slate-800">{screen === 'home' ? 'Home' : 'Patient Profile'}</p>
            <button
              onClick={() => screen === 'home' ? setScreen('profile') : saveProfile()}
              className="h-9 w-9 rounded-full bg-cyan-700 text-white flex items-center justify-center"
              title={screen === 'home' ? 'Open profile' : 'Save profile'}
            >
              {screen === 'home' ? <UserRound className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            </button>
          </div>

          {screen === 'profile' && (
          <div className="px-4 pb-4">
            <div className="rounded-[28px] bg-gradient-to-br from-cyan-700 to-slate-900 text-white p-5">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <UserRound className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold leading-tight">{profile.name || 'Patient Profile'}</h1>
                  <p className="text-sm text-cyan-50 mt-1">{patientSummary}</p>
                  <p className="text-xs text-cyan-100 mt-3">ID {profile.patient_id}</p>
                </div>
              </div>
            </div>
          </div>
          )}
        </header>

        {screen === 'home' ? (
          <HomeScreen />
        ) : (
          <form onSubmit={saveProfile} className="px-4 py-5 space-y-4">
            <section className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-950 mb-3">Account Details</h2>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-500">
                  Patient ID
                  <input value={profile.patient_id} onChange={(e) => updateField('patient_id', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Name
                  <input value={profile.name} onChange={(e) => updateField('name', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-slate-500">
                    Age
                    <input type="number" value={profile.age} onChange={(e) => updateField('age', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
                  </label>
                  <label className="block text-xs font-medium text-slate-500">
                    Sex
                    <select value={profile.sex} onChange={(e) => updateField('sex', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white">
                      <option value="">Select</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Non-binary</option>
                      <option>Prefer not to say</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-slate-500">
                    Blood Group
                    <input value={profile.blood_group} onChange={(e) => updateField('blood_group', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
                  </label>
                  <label className="block text-xs font-medium text-slate-500">
                    Phone
                    <input value={profile.phone} onChange={(e) => updateField('phone', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
                  </label>
                </div>
                <label className="block text-xs font-medium text-slate-500">
                  Email
                  <input type="email" value={profile.email} onChange={(e) => updateField('email', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Emergency Contact
                  <input value={profile.emergency_contact} onChange={(e) => updateField('emergency_contact', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
                </label>
              </div>
            </section>

            <AddListSection title="Allergies" placeholder="Add allergy" values={profile.allergies} onAdd={(value) => addListItem('allergies', value)} onRemove={(index) => removeListItem('allergies', index)} />
            <AddListSection title="Chronic Conditions" placeholder="Add condition" values={profile.chronic_conditions} onAdd={(value) => addListItem('chronic_conditions', value)} onRemove={(index) => removeListItem('chronic_conditions', index)} />
            <AddListSection title="Current Medications" placeholder="Add medication" values={profile.current_medications} onAdd={(value) => addListItem('current_medications', value)} onRemove={(index) => removeListItem('current_medications', index)} />
            <AddListSection title="Family History" placeholder="Add family history item" values={profile.family_history} onAdd={(value) => addListItem('family_history', value)} onRemove={(index) => removeListItem('family_history', index)} />
            <AddListSection title="Past Surgeries" placeholder="Add surgery" values={profile.past_surgeries} onAdd={(value) => addListItem('past_surgeries', value)} onRemove={(index) => removeListItem('past_surgeries', index)} />

            <section className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-950">Lifestyle Notes</h3>
              <textarea value={profile.lifestyle_notes} onChange={(e) => updateField('lifestyle_notes', e.target.value)} rows={3} placeholder="Smoking, alcohol, exercise, diet notes" className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
            </section>

            <section className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-950">Important Note</h3>
              <textarea value={profile.important_notes} onChange={(e) => updateField('important_notes', e.target.value)} rows={4} placeholder="Anything important that does not fit above" className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:bg-white" />
            </section>

            <button type="submit" className="w-full rounded-full bg-cyan-700 text-white px-4 py-3 text-sm font-semibold hover:bg-cyan-800 transition flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> Save Profile
            </button>
            <p className="text-center text-xs text-slate-500">{status}</p>
          </form>
        )}

        {screen === 'home' && (
          <div className="fixed inset-x-0 bottom-6 z-20 pointer-events-none">
            <div className="mx-auto max-w-md px-5 flex justify-end">
              <button
                onClick={() => setIsChatOpen(true)}
                className="pointer-events-auto h-16 w-16 rounded-full bg-cyan-700 text-white shadow-2xl shadow-cyan-900/30 flex items-center justify-center hover:bg-cyan-800 transition"
                title="Open AI intake chat"
              >
                <MessageCircle className="h-7 w-7" />
              </button>
            </div>
          </div>
        )}

        {isChatOpen && (
          <div className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm flex items-end justify-center">
            <section className="w-full max-w-md rounded-t-[32px] bg-[#f8f8fb] p-4 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">AI Intake</p>
                  <h2 className="text-lg font-bold text-slate-950">Describe any issue</h2>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center" title="Close chat">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ChatWidget patientId={profile.patient_id} patientName={profile.name} onCaseCompleted={fetchHistory} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
