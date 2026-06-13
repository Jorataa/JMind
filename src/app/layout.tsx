import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "JMind - Think. Plan. Execute.",
  description:
    "JMind is a personal operating system for thinking and execution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      {/* Apply theme before first paint to prevent flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('jmind:theme');if(t&&t!=='default')document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <LayoutShell>{children}</LayoutShell>
        <ToastProvider />
      </body>
    </html>
  );
}
