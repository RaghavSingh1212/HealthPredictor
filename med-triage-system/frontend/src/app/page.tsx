import ChatWidget from './components/ChatWidget';

export default function PatientPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 flex items-center justify-center">
      <ChatWidget patientId="PT-8831A" />
    </main>
  );
}
