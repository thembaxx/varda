import type {Metadata, Viewport} from 'next';
import {Fraunces, Plus_Jakarta_Sans, JetBrains_Mono} from 'next/font/google';
import OfflineBanner from '@/components/OfflineBanner';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600', '700'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#F4F3EC'},
    {media: '(prefers-color-scheme: dark)', color: '#0B241E'},
  ],
};

export const metadata: Metadata = {
  title: 'Varda — 3D Spatial Studio & Eco-Living Platform (South Africa)',
  description:
    'Interactive 3D isometric wireframe & WebGL shader studio with real-time collision physics, community living board, offline data resilience, and South African payments.',
  applicationName: 'Varda',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Varda',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Varda — 3D Spatial Studio & Eco-Living Platform (South Africa)',
    description:
      'Interactive 3D isometric wireframe & WebGL shader studio with real-time collision physics, community living board, offline data resilience, and South African payments.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Varda — 3D Spatial Studio & Eco-Living Platform (South Africa)',
    description:
      'Interactive 3D isometric wireframe & WebGL shader studio with real-time collision physics, community living board, offline data resilience, and South African payments.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en-ZA"
      className={`${fraunces.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[#F4F3EC] text-[#11362E] font-sans antialiased selection:bg-[#144239] selection:text-[#F4F3EC] min-h-screen"
      >
        {children}
        <OfflineBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.debug('SW reg non-blocking:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
