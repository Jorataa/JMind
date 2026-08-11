import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  LegalSection,
  LegalCallout,
  LegalTable,
} from "@/components/legal/LegalComponents";
import { CookiePreferences } from "@/components/legal/CookiePreferences";

export const metadata: Metadata = {
  title: "Cookies & Storage Policy — Jorata",
  description: "Understand how Jorata uses local browser storage and manage your preferences.",
};

const TOC_SECTIONS = [
  { id: "preferences", label: "1. Manage Your Preferences" },
  { id: "why-storage", label: "2. Why We Use Local Storage" },
  { id: "keys-table", label: "3. Storage Keys & Categories" },
  { id: "cookies-vs-storage", label: "4. Local Storage vs. Cookies" },
  { id: "controls", label: "5. Browser Controls & Clearing Data" },
];

export default function CookiesPolicyPage() {
  return (
    <LegalLayout
      title="Cookies &amp; Storage Policy"
      subtitle="Complete transparency on local storage keys, session states, and telemetry controls."
      activeTab="cookies"
      tocSections={TOC_SECTIONS}
    >
      <LegalSection id="preferences" title="1. Manage Your Preferences">
        <p className="mb-4">
          You have full control over optional preferences and telemetry. Use the controls below to customize how Jorata operates in this browser:
        </p>
        <CookiePreferences />
      </LegalSection>

      <LegalSection id="why-storage" title="2. Why We Use Local Storage">
        <p>
          Jorata is a local-first application. Unlike traditional websites that store your files on cloud servers and track you across the web with cookies, Jorata relies primarily on your browser&apos;s HTML5 <code>localStorage</code> to keep your workspace fast, private, and available offline.
        </p>
        <LegalCallout type="shield" title="Local-First Storage">
          Your tasks, mind maps, notes, goals, reflections, and theme choices are stored directly inside your web browser. They never leave your device unless you explicitly opt into cloud sync.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="keys-table" title="3. Storage Keys &amp; Categories">
        <p>
          Below is a complete breakdown of every local storage key used by Jorata:
        </p>

        <LegalTable
          headers={["Storage Key", "Category", "Purpose & Description", "Retention"]}
          rows={[
            [
              <code key="k1">jmind:mindmap</code>,
              "Essential",
              "Stores your mind maps, canvas nodes, and connections.",
              "Persistent until cleared",
            ],
            [
              <code key="k2">jmind:tasks</code>,
              "Essential",
              "Stores your tasks, subtasks, priorities, and deadlines.",
              "Persistent until cleared",
            ],
            [
              <code key="k3">jmind:notes</code>,
              "Essential",
              "Stores your personal notes and document contents.",
              "Persistent until cleared",
            ],
            [
              <code key="k4">jmind:kpis</code>,
              "Essential",
              "Stores your goals, target values, and progress metrics.",
              "Persistent until cleared",
            ],
            [
              <code key="k5">jmind:theme</code>,
              "Essential",
              "Remembers your selected accent color theme.",
              "Persistent until cleared",
            ],
            [
              <code key="k6">jmind:ui</code>,
              "Preferences",
              "Remembers your display name and sidebar collapse state.",
              "Persistent until cleared",
            ],
            [
              <code key="k7">jmind:cookie-consent</code>,
              "Preferences",
              "Remembers your cookie & telemetry preferences.",
              "Persistent until cleared",
            ],
            [
              <code key="k8">jmind:visitor-id</code>,
              "Analytics",
              "Random device UUID used for anonymous entry logs.",
              "Persistent until cleared",
            ],
            [
              <code key="k9">jmind:visit-logged</code>,
              "Analytics",
              "Session storage flag to prevent duplicate visit logs.",
              "Expires on tab close",
            ],
          ]}
        />
      </LegalSection>

      <LegalSection id="cookies-vs-storage" title="4. Local Storage vs. Cookies">
        <p>
          Standard HTTP cookies are small text files automatically attached to every HTTP request sent to a website server. Jorata does <strong>not</strong> use third-party advertising or tracking cookies.
        </p>
        <p>
          Instead, we use <code>localStorage</code>, which remains isolated inside your browser environment and is never transmitted over the network automatically.
        </p>
      </LegalSection>

      <LegalSection id="controls" title="5. Browser Controls &amp; Clearing Data">
        <p>
          You can inspect, manage, or clear local storage data at any time through your browser&apos;s built-in developer tools or privacy settings:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Inside Jorata:</strong> Navigate to <strong>Settings &rarr; Data &rarr; Clear all data</strong> to permanently erase your local workspace and reset all storage keys.</li>
          <li><strong>In Browser Settings:</strong> You can clear website data for Jorata via your browser&apos;s site settings menu (under Privacy &amp; Security).</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
