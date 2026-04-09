import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'arc-workflows',
  description: 'Build GitHub Actions workflows with confidence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
