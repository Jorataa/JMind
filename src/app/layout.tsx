import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
