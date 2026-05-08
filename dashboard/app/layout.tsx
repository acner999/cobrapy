import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CobraPy Dashboard',
  description: 'Cobros instantáneos sobre el SIP del BCP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
