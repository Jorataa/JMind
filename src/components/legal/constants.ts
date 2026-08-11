/**
 * Jorata Legal & Trust Constants
 * 
 * Configurable placeholders and metadata for legal documents.
 * Replace placeholders with actual company details upon qualification.
 */
export const LEGAL_CONSTANTS = {
  ENTITY_NAME: "[LEGAL_ENTITY_NAME]",
  LEGAL_EMAIL: "getjorata@gmail.com",
  COPYRIGHT_EMAIL: "getjorata@gmail.com",
  GOVERNING_LAW: "[GOVERNING_LAW_JURISDICTION]",
  MINIMUM_AGE: "[MINIMUM_AGE_POLICY]",
  LAST_UPDATED: "August 10, 2026",
  PRODUCT_NAME: "Jorata",
  PRODUCT_TAGLINE: "A personal operating system for thinking and execution.",
} as const;

export const LEGAL_TABS = [
  { id: "privacy", label: "Privacy Policy", href: "/privacy" },
  { id: "terms", label: "Terms of Service", href: "/terms" },
  { id: "copyright", label: "Copyright Policy", href: "/copyright" },
  { id: "cookies", label: "Cookies & Storage", href: "/cookies" },
] as const;
