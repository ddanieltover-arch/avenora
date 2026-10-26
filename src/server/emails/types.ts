/**
 * @license Apache-2.0
 * Avenora — transactional email payload types
 */

export interface EmailTag {
  name: string;
  value: string;
}

export interface EmailPayload {
  subject: string;
  html: string;
  text: string;
  tags?: EmailTag[];
}

export interface EmailCta {
  label: string;
  href: string;
}

export interface EmailDetailRow {
  label: string;
  value: string;
}
