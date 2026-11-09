import type {Metadata} from 'next';
import {Inter, Geist_Mono} from 'next/font/google';
import '../globals.css';

// Separate root layout: the admin area has no public header, no locale
// routing, no visitor analytics and is never indexed.

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
  title: {default: 'Admin', template: '%s · Admin'},
  robots: {index: false, follow: false, nocache: true}
};

export default function AdminLayout({
  children
}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
