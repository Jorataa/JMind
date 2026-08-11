import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  LegalSection,
  LegalCallout,
} from "@/components/legal/LegalComponents";
import { LEGAL_CONSTANTS } from "@/components/legal/constants";

export const metadata: Metadata = {
  title: "Terms of Service — Jorata",
  description: "Terms and conditions governing your use of Jorata.",
};

const TOC_SECTIONS = [
  { id: "introduction", label: "1. Introduction & Acceptance" },
  { id: "eligibility", label: "2. Eligibility & Age Requirements" },
  { id: "account", label: "3. Account & Local Security" },
  { id: "acceptable-use", label: "4. Acceptable Use Policy" },
  { id: "user-content", label: "5. User Content Ownership" },
  { id: "ai-disclaimer", label: "6. AI Features Disclaimer" },
  { id: "availability", label: "7. Service Availability & Evolution" },
  { id: "liability", label: "8. Limitation of Liability" },
  { id: "governing-law", label: "9. Governing Law" },
  { id: "contact", label: "10. Contact Information" },
];

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Clear, fair rules for using Jorata. Built to protect your work and maintain a productive, trustworthy environment."
      activeTab="terms"
      tocSections={TOC_SECTIONS}
    >
      <LegalSection id="introduction" title="1. Introduction & Acceptance">
        <p>
          Welcome to {LEGAL_CONSTANTS.PRODUCT_NAME}. By accessing or using Jorata (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
        </p>
        <p>
          Jorata is a personal operating system for thinking and execution, designed around a local-first philosophy that prioritizes speed, privacy, and user autonomy.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility & Age Requirements">
        <p>
          You may use Jorata if you meet the applicable age requirement:
        </p>
        <LegalCallout type="info" title="Minimum Age Policy">
          Minimum age requirement: <strong>{LEGAL_CONSTANTS.MINIMUM_AGE}</strong>. If you are under the required age in your jurisdiction, you must have permission from a parent or legal guardian to use the Service.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="account" title="3. Account & Local Security">
        <p>
          Because Jorata is primarily local-first:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Device Security:</strong> You are responsible for maintaining the security of your browser, operating system, and physical device where your local workspace data is stored.</li>
          <li><strong>Optional Credentials:</strong> If you choose to enable opt-in cloud synchronization, you are responsible for maintaining the confidentiality of any sign-in credentials or tokens used to access your cloud account.</li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptable-use" title="4. Acceptable Use Policy">
        <p>
          You agree to use Jorata only for lawful purposes. You must not:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>Use the Service to engage in illegal, abusive, harassing, or malicious activities.</li>
          <li>Attempt to probe, scan, or compromise the security of Jorata&apos;s API routes or third-party infrastructure.</li>
          <li>Automate abusive requests to server-side AI endpoints or attempt to bypass application rate limits.</li>
          <li>Reverse-engineer or tamper with the software beyond permitted fair use or license terms.</li>
        </ul>
      </LegalSection>

      <LegalSection id="user-content" title="5. User Content Ownership">
        <p>
          We firmly believe that your creative thinking, notes, and task lists belong to you.
        </p>
        <LegalCallout type="shield" title="Your Content Belongs To You">
          You retain 100% full ownership of all content you create, write, or upload within Jorata—including notes, tasks, mind maps, goals, reflections, and custom sources. Jorata claims no intellectual property rights over your user content.
        </LegalCallout>
        <p>
          You grant Jorata only the limited, temporary permissions necessary to operate the application on your device and deliver explicitly requested features (such as processing an AI prompt or synchronizing your workspace across your devices).
        </p>
      </LegalSection>

      <LegalSection id="ai-disclaimer" title="6. AI Features Disclaimer">
        <p>
          Jorata provides optional AI-assisted features (such as mind map node expansion, automated summary generation, and task recommendations) powered by large language models.
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Not Professional Advice:</strong> AI-generated outputs are for brainstorming and informational purposes only. They do not constitute legal, medical, financial, or professional advice.</li>
          <li><strong>Verification Required:</strong> AI models may occasionally produce inaccurate, incomplete, or biased information. You should review and verify all AI-generated content before acting upon it.</li>
          <li><strong>User Discretion:</strong> You retain complete discretion to accept, edit, or discard any suggestion generated by the AI.</li>
        </ul>
      </LegalSection>

      <LegalSection id="availability" title="7. Service Availability & Evolution">
        <p>
          We strive to provide a reliable, quiet software experience. However:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Updates &amp; Evolution:</strong> Features within Jorata may be refined, updated, or improved over time.</li>
          <li><strong>No Guarantee of Uptime:</strong> While your local data remains accessible offline in your browser, server-side API features (such as AI generation or cloud sync) may experience occasional maintenance or service interruptions.</li>
          <li><strong>Local Backups Encouraged:</strong> We encourage you to periodically export your workspace as a JSON file via Settings to maintain an offsite backup.</li>
        </ul>
      </LegalSection>

      <LegalSection id="liability" title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, Jorata and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, use, goodwill, or other intangible losses resulting from:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>Your access to, use of, or inability to access or use the Service.</li>
          <li>Local browser data loss resulting from hardware failure, browser cache clearing, or OS corruption.</li>
          <li>Any errors or inaccuracies in AI-generated output.</li>
        </ul>
      </LegalSection>

      <LegalSection id="governing-law" title="9. Governing Law">
        <p>
          These Terms shall be governed by and construed in accordance with the applicable laws of:
        </p>
        <p className="font-mono text-[14px] text-ink-900 bg-sunken px-3 py-2 rounded-lg inline-block my-2">
          {LEGAL_CONSTANTS.GOVERNING_LAW}
        </p>
        <p>
          Without regard to its conflict of law provisions.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="10. Contact Information">
        <p>
          For questions or notices concerning these Terms of Service, please contact:
        </p>
        <p className="font-mono text-[14px] text-ink-900 bg-sunken px-3 py-2 rounded-lg inline-block my-2">
          {LEGAL_CONSTANTS.LEGAL_EMAIL}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
