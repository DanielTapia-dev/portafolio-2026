import type React from 'react';
import type {Metadata} from 'next';
import {Inter, Geist_Mono} from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import {Analytics} from '@vercel/analytics/next';

const _inter = Inter({subsets: ['latin']});
const _geistMono = Geist_Mono({subsets: ['latin']});

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
      <body className={`font-sans antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
