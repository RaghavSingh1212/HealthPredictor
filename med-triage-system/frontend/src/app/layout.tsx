import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Medical Triage System',
  description: 'HIPAA-compliant patient intake and clinician dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
