import type { Metadata } from "next";
import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Jovan Tioria — Creator Profile | Jorata",
  description:
    "Meet Jovan Tioria, student founder and solo developer behind Jorata — a visual productivity workspace combining mind maps, tasks, and KPI tracking.",
  keywords: [
    "Jovan Tioria",
    "Jorata",
    "Jorata founder",
    "Jovan Tioria Jorata",
    "JMind",
    "Jorata app",
    "visual productivity workspace",
    "mind mapping",
  ],
  authors: [{ name: "Jovan Tioria", url: "https://jorata.vercel.app/profile" }],
  openGraph: {
    title: "Jovan Tioria — Creator Profile | Jorata",
    description:
      "Meet Jovan Tioria, student founder and solo developer behind Jorata — a visual productivity workspace combining mind maps, tasks, and KPI tracking.",
    url: "https://jorata.vercel.app/profile",
    siteName: "Jorata",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jovan Tioria — Creator Profile | Jorata",
    description:
      "Meet Jovan Tioria, student founder and solo developer behind Jorata.",
  },
};

export default function ProfilePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jovan Tioria",
    jobTitle: "Founder & Solo Developer",
    worksFor: {
      "@type": "SoftwareApplication",
      name: "Jorata",
      url: "https://jorata.vercel.app",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
    },
    email: "getjorata@gmail.com",
    telephone: "+6281977777152",
    url: "https://jorata.vercel.app/profile",
    sameAs: ["https://jorata.vercel.app"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileClient />
    </>
  );
}
