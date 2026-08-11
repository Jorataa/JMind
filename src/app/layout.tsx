import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";
import { ToastProvider } from "@/components/ui/Toast";
import { Analytics } from "@vercel/analytics/next";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

// Instrument Serif ships a single 400 weight (+ italic) — the design never
// bolds the serif, so nothing else is needed.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-spline-mono",
});

export const metadata: Metadata = {
  title: "Jorata - Think. Plan. Execute.",
  description:
    "Jorata is a personal operating system for thinking and execution.",
  verification: {
    google: "Bz8T9kP2MnXbD6lC3qqJaa7wm4A25Ko1aKLCICz0AlA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${splineSansMono.variable}`}
    >
      {/* Apply theme before first paint to prevent flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('jmind:theme');if(['ocean','violet','rose','amber'].indexOf(t)>-1)document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body className="bg-paper text-ink-700 antialiased">
        <LayoutShell>{children}</LayoutShell>
        <ToastProvider />
        <Analytics />
      </body>
    </html>
  );
}
