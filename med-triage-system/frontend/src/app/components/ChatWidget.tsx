'use client';
import React, { useState } from 'react';
import { Send, Activity } from 'lucide-react';

export default function ChatWidget({ patientId }: { patientId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: 'Hello, I am your secure intake assistant. Please describe the primary medical concerns or symptoms you are experiencing today.' }
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
      } else {
        setMessages(prev => [...prev, { role: 'model', content: data.message }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 border border-slate-200 rounded-xl shadow-lg bg-white overflow-hidden">
      <div className="bg-blue-600 p-4 text-white flex items-center gap-2">
        <Activity className="h-5 w-5 animate-pulse" />
        <h2 className="font-semibold text-md">Secure Medical Intake Triage</h2>
      </div>
      <div className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 italic">Processing securely...</div>}
      </div>
      {!isFinished && (
        <form onSubmit={sendMessage} className="p-3 border-t flex gap-2 bg-white">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Describe symptoms, duration, severity..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
