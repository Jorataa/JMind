import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  LegalSection,
  LegalCallout,
} from "@/components/legal/LegalComponents";
import { LEGAL_CONSTANTS } from "@/components/legal/constants";

export const metadata: Metadata = {
  title: "Copyright Policy — Jorata",
  description: "Intellectual property policy and copyright notice guidelines for Jorata.",
};

const TOC_SECTIONS = [
  { id: "jorata-ip", label: "1. Jorata Intellectual Property" },
  { id: "user-ownership", label: "2. User Content Ownership" },
  { id: "infringement-notice", label: "3. Copyright Infringement Notices" },
  { id: "notice-requirements", label: "4. Notice Requirements" },
  { id: "counter-notice", label: "5. Resolution & Response" },
];

export default function CopyrightPolicyPage() {
  return (
    <LegalLayout
      title="Copyright &amp; IP Policy"
      subtitle="Clear distinction between Jorata's software assets and your personal creative work."
      activeTab="copyright"
      tocSections={TOC_SECTIONS}
    >
      <LegalSection id="jorata-ip" title="1. Jorata Intellectual Property">
        <p>
          The Jorata brand, software application, interface design, custom typography integration, iconography, visual assets, documentation, and underlying code base are protected by applicable copyright, trademark, and intellectual property laws.
        </p>
        <p>
          All rights not expressly granted to users in our Terms of Service are reserved by {LEGAL_CONSTANTS.PRODUCT_NAME}. You may not copy, duplicate, or redistribute the proprietary visual assets or source code of Jorata without prior explicit written permission.
        </p>
      </LegalSection>

      <LegalSection id="user-ownership" title="2. User Content Ownership">
        <p>
          We respect creator rights above all else. Your thoughts, mind maps, notes, and goals belong exclusively to you.
        </p>
        <LegalCallout type="shield" title="Explicit Ownership Guarantee">
          Jorata claims zero copyright ownership or licensing rights over user-created notes, mind map nodes, task descriptions, reflections, or original uploaded documents. Your original material remains 100% your intellectual property.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="infringement-notice" title="3. Copyright Infringement Notices">
        <p>
          We respect the intellectual property rights of copyright holders. If you believe that content hosted or transmitted through Jorata infringes upon your copyrighted work, you may submit a formal copyright infringement notice to our designated contact:
        </p>
        <p className="font-mono text-[14px] text-ink-900 bg-sunken px-3 py-2 rounded-lg inline-block my-2">
          {LEGAL_CONSTANTS.COPYRIGHT_EMAIL}
        </p>
      </LegalSection>

      <LegalSection id="notice-requirements" title="4. Notice Requirements">
        <p>
          To ensure efficient processing, your copyright notice should contain the following information:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Identification of Work:</strong> A description of the copyrighted work that you claim has been infringed.</li>
          <li><strong>Identification of Content:</strong> Specific URL or description of the location of the allegedly infringing material.</li>
          <li><strong>Contact Information:</strong> Your name, mailing address, telephone number, and email address.</li>
          <li><strong>Good-Faith Statement:</strong> A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
          <li><strong>Accuracy Statement:</strong> A statement made under penalty of perjury that the information in your notice is accurate and that you are the copyright owner or authorized to act on the owner&apos;s behalf.</li>
          <li><strong>Signature:</strong> An electronic or physical signature of the person authorized to act on behalf of the copyright owner.</li>
        </ul>
      </LegalSection>

      <LegalSection id="counter-notice" title="5. Resolution & Response">
        <p>
          Upon receiving a valid notice containing the required information, we will investigate the request promptly, take appropriate action where warranted, and communicate with the involved parties in good faith.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
