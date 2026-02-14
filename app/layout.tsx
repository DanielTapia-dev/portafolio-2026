import type {Metadata} from 'next';
import {Inter, Geist_Mono} from 'next/font/google';
import {Analytics} from '@vercel/analytics/next';
import './globals.css';
import Header from './components/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Daniel Tapia | Full Stack Developer',
  description:
    'Portfolio y CV de Daniel Tapia - Desarrollador Full Stack especializado en crear experiencias digitales excepcionales'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Header />
        <main className="min-h-screen">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
