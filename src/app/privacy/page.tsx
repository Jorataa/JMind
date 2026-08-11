import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  LegalSection,
  LegalHeading,
  LegalCallout,
  LegalTable,
} from "@/components/legal/LegalComponents";
import { LEGAL_CONSTANTS } from "@/components/legal/constants";

export const metadata: Metadata = {
  title: "Privacy Policy — Jorata",
  description: "Learn how Jorata respects, protects, and handles your personal data.",
};

const TOC_SECTIONS = [
  { id: "overview", label: "1. Overview & Philosophy" },
  { id: "data-provided", label: "2. Information You Provide" },
  { id: "data-automated", label: "3. Automated Information" },
  { id: "data-use", label: "4. How Data Is Used" },
  { id: "ai-content", label: "5. AI & User Content" },
  { id: "storage-retention", label: "6. Data Storage & Retention" },
  { id: "third-parties", label: "7. Third-Party Services" },
  { id: "user-rights", label: "8. Your Rights & Controls" },
  { id: "contact", label: "9. Contact Information" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Jorata is designed local-first. We believe your thoughts, tasks, and reflections belong to you — not our servers."
      activeTab="privacy"
      tocSections={TOC_SECTIONS}
    >
      <LegalSection id="overview" title="1. Overview & Philosophy">
        <p>
          At Jorata, trust starts with technical clarity. Jorata is built around a local-first engineering philosophy: your core data—including your tasks, mind maps, notes, goals, and reflections—is stored directly inside your web browser’s local storage rather than on central company servers by default.
        </p>
        <p>
          This document explains what information is processed when you use Jorata, why it is processed, and how you retain complete control over your data at all times.
        </p>
        <LegalCallout type="shield" title="The Local-First Principle">
          By default, Jorata operates entirely offline on your device. We do not maintain a backend database containing your personal notes or mind maps unless you explicitly choose to enable opt-in Cloud Sync.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="data-provided" title="2. Information You Provide">
        <p>
          Depending on how you use Jorata, you may create or input the following categories of data:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>
            <strong>Display Name:</strong> A simple greeting name stored locally in your browser to personalize your Dashboard. No email address or password is required for basic local use.
          </li>
          <li>
            <strong>Workspace Content:</strong> Tasks, subtasks, notes, mind map nodes, edge connections, sticky notes, KPI goals, knowledge sources, daily reflections, and calendar items.
          </li>
          <li>
            <strong>Custom Preferences:</strong> Accent theme selections, sidebar state, wisdom strip visibility, and shortcut preferences.
          </li>
          <li>
            <strong>Sync Credentials (Optional):</strong> If you choose to enable cloud synchronization via Supabase, your email address and authentication tokens are processed securely to authenticate your device.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="data-automated" title="3. Automated Information & Technical Data">
        <p>
          When you access Jorata, standard browser technical information and local storage keys are utilized to provide a seamless application experience.
        </p>

        <LegalHeading level={3}>Local Storage Mechanisms</LegalHeading>
        <p>
          Jorata uses HTML5 <code>localStorage</code> and <code>sessionStorage</code> rather than third-party tracking cookies. These keys store your workspace offline and remember your preferences across page refreshes.
        </p>

        <LegalHeading level={3}>Anonymous Visitor Telemetry</LegalHeading>
        <p>
          To help us understand application adoption and general usage, Jorata records a minimal, best-effort visitor entry log when the app loads. This log records:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>A randomly generated device identifier UUID (stored in local storage as <code>jmind:visitor-id</code>).</li>
          <li>The greeting name you provided.</li>
          <li>Basic technical context: page path, referrer URL, browser time zone, and language header.</li>
        </ul>
        <p>
          This telemetry <strong>never</strong> includes your task text, note contents, or mind map structures. You can disable this telemetry at any time in <a href="/cookies" className="text-emerald-700 underline font-medium">Cookie &amp; Storage Settings</a>.
        </p>
      </LegalSection>

      <LegalSection id="data-use" title="4. How Data Is Used">
        <p>We process data exclusively for legitimate product purposes:</p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Operating the Product:</strong> Rendering your canvas, managing task states, calculating KPI progress, and persisting changes locally.</li>
          <li><strong>Generating AI Assistance:</strong> When you explicitly invoke AI features (such as mind map expansion or the Assistant dock), your prompt and context are sent to Google Gemini server-side.</li>
          <li><strong>Cloud Synchronization (Opt-In):</strong> Synchronizing changes across your devices if you have signed into an optional cloud account.</li>
          <li><strong>Improving Reliability:</strong> Diagnosing unhandled errors and maintaining application performance.</li>
        </ul>
      </LegalSection>

      <LegalSection id="ai-content" title="5. AI & User Content">
        <p>
          Jorata includes optional AI assistance powered by the Google Gemini API. Transparency around AI data handling is essential:
        </p>
        <LegalCallout type="info" title="How AI Generation Works in Jorata">
          <ul className="list-disc pl-4 flex flex-col gap-1.5 text-[13px]">
            <li><strong>Triggered Only on Request:</strong> Content is sent to the AI only when you click an AI button (e.g., &quot;Ask Jorata&quot;, expand mind map node, generate insights).</li>
            <li><strong>Server-Side Security:</strong> API requests pass securely through Jorata&apos;s server-side API routes. Your private API keys or tokens are never exposed in browser logs.</li>
            <li><strong>No Model Training:</strong> API requests to Google Gemini via standard commercial endpoints are not used by Jorata to train public AI models.</li>
            <li><strong>Transient Processing:</strong> Requests are processed in-memory to generate immediate responses and are not stored permanently by Jorata&apos;s server routes.</li>
          </ul>
        </LegalCallout>
      </LegalSection>

      <LegalSection id="storage-retention" title="6. Data Storage & Retention">
        <p>
          Because your data lives in your browser&apos;s local storage, retention is under your direct physical control:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Local Persistence:</strong> Your workspace remains in your browser until you choose to clear your browser data or click &quot;Clear all data&quot; in Settings.</li>
          <li><strong>Exportability:</strong> You can export your entire workspace at any time as a single, portable JSON backup file via <strong>Settings &rarr; Data &rarr; Export JSON</strong>.</li>
          <li><strong>Cloud Sync Data (If Enabled):</strong> If cloud sync is configured, synced data is retained until you delete your items or request account deletion.</li>
        </ul>
      </LegalSection>

      <LegalSection id="third-parties" title="7. Third-Party Services">
        <p>
          Jorata integrates with a minimal set of third-party infrastructure providers to support optional backend functionality:
        </p>
        <LegalTable
          headers={["Provider", "Purpose", "Data Transferred", "Privacy Policy"]}
          rows={[
            [
              "Google Gemini API",
              "AI mind map expansion & assistant",
              "User prompt text & selected node context",
              <a key="1" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-emerald-700 underline">Google Privacy</a>,
            ],
            [
              "Supabase (Optional)",
              "Opt-in multi-device workspace sync",
              "Encrypted workspace snapshots & auth tokens",
              <a key="2" href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-emerald-700 underline">Supabase Privacy</a>,
            ],
            [
              "Google Apps Script / Sheets",
              "Best-effort visitor telemetry log",
              "Device UUID, greeting name, path, language",
              <a key="3" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-emerald-700 underline">Google Privacy</a>,
            ],
          ]}
        />
      </LegalSection>

      <LegalSection id="user-rights" title="8. Your Rights & Controls">
        <p>
          We respect user data rights globally. You possess the following immediate controls inside Jorata:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Right to Access &amp; Export:</strong> Download a full JSON copy of all stored data at any time from Settings.</li>
          <li><strong>Right to Rectify &amp; Erasure:</strong> Edit or delete any note, mind map, or task immediately, or clear your entire workspace with one click.</li>
          <li><strong>Right to Withdraw Telemetry Consent:</strong> Toggle off usage telemetry in <a href="/cookies" className="text-emerald-700 underline font-medium">Cookie &amp; Storage Settings</a>.</li>
        </ul>
      </LegalSection>

      <LegalSection id="contact" title="9. Contact Information">
        <p>
          If you have questions, feedback, or privacy requests regarding this Privacy Policy, please reach out to our team at:
        </p>
        <p className="font-mono text-[14px] text-ink-900 bg-sunken px-3 py-2 rounded-lg inline-block my-2">
          {LEGAL_CONSTANTS.LEGAL_EMAIL}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
