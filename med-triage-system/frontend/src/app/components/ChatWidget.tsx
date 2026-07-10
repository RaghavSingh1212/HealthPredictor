'use client';
import React, { useState } from 'react';
import { Send, Activity, RotateCcw, ShieldCheck } from 'lucide-react';

type ChatWidgetProps = {
  patientId: string;
  patientName?: string;
  onCaseCompleted?: () => void;
};

export default function ChatWidget({ patientId, patientName, onCaseCompleted }: ChatWidgetProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: 'Hello, I am your secure intake assistant. Please describe your main medical concern today, including where you feel it if that applies.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: input };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, history: updatedHistory })
      });
      const data = await res.json();

      if (data.status === 'completed') {
        setIsFinished(true);
        setMessages(prev => [...prev, { role: 'model', content: 'Thank you. Your structured intake assessment has been securely sent directly to your physician.' }]);
        onCaseCompleted?.();
      } else {
        setMessages(prev => [...prev, { role: 'model', content: data.message }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      { role: 'model', content: 'Hello, I am your secure intake assistant. Please describe your main medical concern today, including where you feel it if that applies.' }
    ]);
    setInput('');
    setIsFinished(false);
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-cyan-700 to-slate-900 p-5 text-white">
        <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-base truncate">Secure Medical Intake</h2>
            <p className="text-xs text-cyan-100 truncate">{patientName || patientId}</p>
          </div>
        </div>
        {isFinished && (
          <button onClick={resetChat} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center" title="Start another intake">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-cyan-50">
          <ShieldCheck className="h-4 w-4" />
          <span>Information is prepared for clinician review</span>
        </div>
      </div>
      <div className="h-[calc(100vh-22rem)] min-h-[26rem] overflow-y-auto p-4 space-y-3 bg-[#f8f8fb]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[84%] px-4 py-3 text-sm leading-6 shadow-sm ${msg.role === 'user' ? 'bg-cyan-700 text-white rounded-[22px] rounded-br-md' : 'bg-white border border-slate-100 text-slate-800 rounded-[22px] rounded-bl-md'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-full bg-white border border-slate-100 px-4 py-2 text-xs text-slate-400 shadow-sm">Processing securely...</div>
          </div>
        )}
      </div>
      {!isFinished && (
        <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Symptoms, duration, severity, history..."
            className="flex-1 min-w-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:bg-white"
          />
          <button type="submit" className="h-11 w-11 rounded-full bg-cyan-700 text-white hover:bg-cyan-800 transition flex items-center justify-center" title="Send message">
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
