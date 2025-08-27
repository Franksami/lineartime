import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import { ReactScan } from '@/components/performance/ReactScan';
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { PWAStatus } from '@/components/pwa/pwa-status';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type React from 'react';
import { getLangDir } from 'rtl-detect';
import { Providers } from './providers';
import './globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'LinearTime - Experience Time as Flow',
  description:
    "The world's first true linear calendar. Experience time as a continuous flow, not fragmented blocks. Life is bigger than a week.",
  generator: 'Next.js',
  metadataBase: new URL('https://lineartime.app'),
  applicationName: 'LinearTime Calendar',
  authors: [{ name: 'LinearTime Team' }],
  keywords: ['calendar', 'linear', 'productivity', 'planning', 'time management', 'PWA'],
  creator: 'LinearTime Team',
  publisher: 'LinearTime',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LinearTime',
    startupImage: ['/icon-192x192.png'],
  },
  openGraph: {
    type: 'website',
    siteName: 'LinearTime Calendar',
    title: 'LinearTime - Experience Time as Flow',
    description: "The world's first true linear calendar. Life is bigger than a week.",
    images: ['/screenshot-desktop.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinearTime - Experience Time as Flow',
    description: "The world's first true linear calendar. Life is bigger than a week.",
    images: ['/screenshot-desktop.png'],
  },
  icons: {
    icon: [
      { url: '/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon-96x96.png',
    apple: [{ url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale and messages for internationalization
  const locale = await getLocale();
  const messages = await getMessages();
  const direction = getLangDir(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`dark ${fontSans.variable} ${fontMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#2196F3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LinearTime" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body
        className={`font-sans antialiased bg-background text-foreground min-h-screen ${direction === 'rtl' ? 'rtl' : ''}`}
      >
        <ReactScan />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <PWAInstallPrompt />
            <PWAStatus />
            <PerformanceDashboard />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
