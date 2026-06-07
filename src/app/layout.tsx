import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/layout-shell";
import { ToastProvider } from "@/components/ui/Toast";

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <LayoutShell>{children}</LayoutShell>
        <ToastProvider />
      </body>
    </html>
  );
}
