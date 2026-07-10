'use client';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText, Home, Pill, Search, ShieldCheck, UserRound } from 'lucide-react';

type Severity = 'Low' | 'Medium' | 'High' | 'Emergency';

interface Case {
  _id: string;
  patient_id: string;
  chief_complaint: string;
  symptoms_duration: string;
  severity_level: Severity;
  reported_symptoms: string[];
  associated_symptoms?: string[];
  red_flags?: string[];
  relevant_history: string;
  medications?: string[];
  allergies?: string[];
  recommended_priority?: Severity;
  ai_summary?: string;
  status: string;
  created_at: string;
  doctor_notes?: { note: string; created_at: string }[];
  patient?: Patient;
}

interface Patient {
  patient_id: string;
  name: string;
  age?: number;
  sex?: string;
  phone?: string;
  email?: string;
  blood_group?: string;
  emergency_contact?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: string[];
  past_surgeries?: string[];
  family_history?: string;
  lifestyle_notes?: string;
  last_case?: Case | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [history, setHistory] = useState<Case[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');

  const selectedPatient = patients.find((patient) => patient.patient_id === selectedPatientId) || patients[0];
  const activeCase = history.find((item) => item.status === 'pending_review') || history[0];

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patients`);
      const data = await res.json();
      setPatients(data);
      if (!selectedPatientId && data.length > 0) setSelectedPatientId(data[0].patient_id);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    }
  };

  const fetchHistory = async (patientId: string) => {
    if (!patientId) return;
    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch patient history', err);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPatient?.patient_id) fetchHistory(selectedPatient.patient_id);
  }, [selectedPatient?.patient_id]);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((patient) => {
      return patient.name?.toLowerCase().includes(q) || patient.patient_id.toLowerCase().includes(q);
    });
  }, [patients, search]);

  const resolveCase = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/clinician/cases/${id}/resolve`, { method: 'POST' });
      await fetchPatients();
      if (selectedPatient?.patient_id) await fetchHistory(selectedPatient.patient_id);
    } catch (err) {
      console.error(err);
    }
  };

  const saveNote = async () => {
    if (!activeCase || !note.trim()) return;
    try {
      await fetch(`${API_URL}/api/doctor/cases/${activeCase._id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      setNote('');
      if (selectedPatient?.patient_id) fetchHistory(selectedPatient.patient_id);
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityStyle = (lvl?: string) => {
    switch(lvl) {
      case 'Emergency': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const StatLine = ({ label, value }: { label: string; value?: string | number | string[] | null }) => {
    const display = Array.isArray(value) ? value.join(', ') : value;
    return (
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm text-slate-900 mt-0.5">{display || 'Not recorded'}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Doctor Review Dashboard</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Patient profiles, intake cases, and history in one view
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm bg-white border border-slate-200 px-3 py-2 rounded-md text-slate-600 flex items-center gap-2 hover:text-cyan-800 transition">
              <Home className="h-4 w-4" /> Home
            </Link>
            <div className="text-sm bg-slate-100 px-3 py-2 rounded-md text-slate-600 flex items-center gap-2 w-fit">
              <Clock className="h-4 w-4" /> Auto-refresh active
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6">
        <aside className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients" className="w-full border rounded-md pl-9 pr-3 py-2 text-sm" />
            </div>
          </div>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            {filteredPatients.map((patient) => (
              <button
                key={patient.patient_id}
                onClick={() => setSelectedPatientId(patient.patient_id)}
                className={`w-full text-left p-4 border-b hover:bg-slate-50 transition ${selectedPatient?.patient_id === patient.patient_id ? 'bg-cyan-50' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-950 truncate">{patient.name}</p>
                    <p className="text-xs text-slate-500">{patient.patient_id}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${getSeverityStyle(patient.last_case?.severity_level)}`}>
                    {patient.last_case?.severity_level || 'No case'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 truncate">{patient.last_case?.chief_complaint || 'No intake history yet'}</p>
              </button>
            ))}
            {filteredPatients.length === 0 && <p className="text-sm text-slate-400 text-center p-8">No patients found.</p>}
          </div>
        </aside>

        <section className="space-y-6">
          {selectedPatient ? (
            <>
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">{selectedPatient.name}</h2>
                      <p className="text-sm text-slate-500">{selectedPatient.patient_id}</p>
                    </div>
                  </div>
                  {activeCase && (
                    <span className={`text-xs px-3 py-1 rounded-full border font-semibold w-fit ${getSeverityStyle(activeCase.severity_level)}`}>
                      {activeCase.severity_level} priority
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                  <StatLine label="Age" value={selectedPatient.age} />
                  <StatLine label="Sex" value={selectedPatient.sex} />
                  <StatLine label="Blood Group" value={selectedPatient.blood_group} />
                  <StatLine label="Phone" value={selectedPatient.phone} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  <StatLine label="Allergies" value={selectedPatient.allergies} />
                  <StatLine label="Conditions" value={selectedPatient.chronic_conditions} />
                  <StatLine label="Medications" value={selectedPatient.current_medications} />
                </div>
              </div>

              {activeCase ? (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_20rem] gap-6">
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-cyan-700" />
                      <h3 className="font-semibold text-slate-950">Current Intake Case</h3>
                    </div>
                    <div className="space-y-4">
                      <StatLine label="Chief Complaint" value={activeCase.chief_complaint} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatLine label="Duration" value={activeCase.symptoms_duration} />
                        <StatLine label="Relevant History" value={activeCase.relevant_history} />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Symptoms</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[...(activeCase.reported_symptoms || []), ...(activeCase.associated_symptoms || [])].map((symptom, index) => (
                            <span key={`${symptom}-${index}`} className="bg-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs">{symptom}</span>
                          ))}
                        </div>
                      </div>
                      {!!activeCase.red_flags?.length && (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Red Flags
                          </p>
                          <p className="text-sm text-red-800 mt-1">{activeCase.red_flags.join(', ')}</p>
                        </div>
                      )}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">AI Summary</p>
                        <p className="text-sm text-slate-800 mt-1 leading-6">{activeCase.ai_summary || 'Summary not provided by the model.'}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => resolveCase(activeCase._id)} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Sign-off Case
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Pill className="h-5 w-5 text-cyan-700" />
                      <h3 className="font-semibold text-slate-950">Doctor Notes</h3>
                    </div>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="Add review notes..." className="w-full border rounded-md px-3 py-2 text-sm" />
                    <button onClick={saveNote} className="mt-3 w-full bg-slate-900 text-white px-3 py-2 rounded-md hover:bg-slate-800 transition text-sm font-medium">Save Note</button>
                    <div className="space-y-3 mt-5">
                      {(activeCase.doctor_notes || []).map((item, index) => (
                        <div key={index} className="border rounded-md p-3 bg-slate-50">
                          <p className="text-sm text-slate-800">{item.note}</p>
                        </div>
                      ))}
                      {!activeCase.doctor_notes?.length && <p className="text-sm text-slate-400">No notes yet.</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center text-slate-400">No intake cases for this patient yet.</div>
              )}

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <h3 className="font-semibold text-slate-950 mb-4">Patient History</h3>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item._id} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm text-slate-950">{item.chief_complaint}</p>
                        <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()} · {item.status}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full border w-fit ${getSeverityStyle(item.severity_level)}`}>{item.severity_level}</span>
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-sm text-slate-400">No history recorded.</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center text-slate-400">Create a patient profile to begin.</div>
          )}
        </section>
      </main>
    </div>
  );
}
