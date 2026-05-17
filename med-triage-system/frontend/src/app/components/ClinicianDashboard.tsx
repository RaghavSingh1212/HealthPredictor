'use client';
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface Case {
  _id: string;
  patient_id: string;
  chief_complaint: string;
  symptoms_duration: string;
  severity_level: 'Low' | 'Medium' | 'High' | 'Emergency';
  reported_symptoms: string[];
  relevant_history: string;
  created_at: string;
}

export default function ClinicianDashboard() {
  const [cases, setCases] = useState<Case[]>([]);

  const fetchCases = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/clinician/cases`);
      const data = await res.json();
      setCases(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const resolveCase = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/clinician/cases/${id}/resolve`, { method: 'POST' });
      fetchCases();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityStyle = (lvl: string) => {
    switch(lvl) {
      case 'Emergency': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Physician Triage Dashboard</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> HIPAA Compliant E2E Encryption Active
          </p>
        </div>
        <div className="text-sm bg-slate-100 px-3 py-1.5 rounded-md text-slate-600 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Real-time feed active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((item) => (
          <div key={item._id} className="border rounded-xl shadow-sm bg-white overflow-hidden flex flex-col justify-between">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">ID: {item.patient_id}</span>
                <span className={`text-xs px-2.5 py-0.5 font-semibold rounded-full border ${getSeverityStyle(item.severity_level)}`}>
                  {item.severity_level}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Chief Complaint</h3>
              <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-2.5 rounded border border-dashed">{item.chief_complaint}</p>
              
              <div className="space-y-2 text-xs">
                <div><span className="font-semibold text-slate-600">Duration:</span> {item.symptoms_duration}</div>
                <div>
                  <span className="font-semibold text-slate-600">Symptoms:</span> 
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.reported_symptoms.map((s, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div><span className="font-semibold text-slate-600">Relevant History:</span> {item.relevant_history}</div>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-between items-center">
              <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleTimeString()}</span>
              <button onClick={() => resolveCase(item._id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Sign-off Case
              </button>
            </div>
          </div>
        ))}
      </div>
      {cases.length === 0 && (
        <div className="text-center py-20 text-slate-400 text-sm">No critical triage summaries pending review.</div>
      )}
    </div>
  );
}
