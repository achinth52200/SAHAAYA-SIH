import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import '../styles/globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
  ),
  title: {
    default: 'SAHAAYA - Mental Health Monitoring & Distress Prediction',
    template: '%s | SAHAAYA',
  },
  description: 'AI-powered dynamic mental health monitoring and distress prediction system for victims of atrocities. Early warning, human-in-the-loop review, explainable AI.',
  keywords: ['mental health', 'distress prediction', 'victim support', 'AI', 'early warning', 'human-in-the-loop'],
  authors: [{ name: 'SAHAAYA Team' }],
  creator: 'SAHAAYA',
  publisher: 'SAHAAYA',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sahaaya.gov.in',
    siteName: 'SAHAAYA',
    title: 'SAHAAYA - Mental Health Monitoring & Distress Prediction',
    description: 'AI-powered dynamic mental health monitoring and distress prediction system for victims of atrocities.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SAHAAYA Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SAHAAYA - Mental Health Monitoring',
    description: 'AI-powered early warning system for victim mental health.',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: '#3E7C59',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background font-body text-text-primary">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}