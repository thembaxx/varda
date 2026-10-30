import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import ExperienceProvider from "@/components/ExperienceProvider";
import "./globals.css";
import "./theme.css";

const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-normal.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/fraunces-italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});
const outfit = localFont({
  src: "./fonts/outfit-normal.woff2",
  variable: "--font-outfit",
  weight: "400 700",
  display: "swap",
});
const jetbrains = localFont({
  src: "./fonts/jetbrains-normal.woff2",
  variable: "--font-jetbrains",
  weight: "400 600",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f7f7ef",
};
export const metadata: Metadata = {
  title: "Varda — Your place. Your people.",
  description:
    "Good spaces, good people, and a little more life. Find community events, shared spaces, and a greener everyday with Varda.",
  applicationName: "Varda",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Varda" },
  icons: { icon: "/icon.svg?v=2", apple: "/apple-touch-icon.png?v=2" },
  openGraph: {
    title: "Varda — Your place. Your people.",
    description: "Good spaces. Good people. A little more life.",
    type: "website",
  },
  formatDetection: { telephone: false },
};

// Apply the persisted colour scheme before paint, including the browser's status bar.
const themeBootstrap = `(function(){try{var p=JSON.parse(localStorage.getItem('varda.preferences.v2')||'{}');var d=p.theme==='dark'||(p.theme!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);var e=document.documentElement;e.dataset.theme=d?'dark':'light';e.dataset.accent=['sage','coral','sunflower'].includes(p.accent)?p.accent:'sunflower';e.dataset.motion=p.motion===false||matchMedia('(prefers-reduced-motion:reduce)').matches?'reduced':'full';document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=d?'#102e28':'#f7f7ef'})}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-ZA"
      suppressHydrationWarning
      className={`${fraunces.variable} ${outfit.variable} ${jetbrains.variable}`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ExperienceProvider>{children}</ExperienceProvider>
        <Analytics />
      </body>
    </html>
  );
}
