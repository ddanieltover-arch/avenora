/**
 * Optional prototype KYC bypass (disabled by default).
 */

import { getValidatedConfig } from './env.config.ts';

/** When true, new accounts are treated as KYC-approved without completing verification. */
export function isKycBypassEnabled(): boolean {
  const config = getValidatedConfig();
  return config.BYPASS_KYC_GATES === true;
}
