/**
 * Government identity document kinds accepted in customer KYC submission.
 */

export type KycIdentityDocumentType =
  | 'PASSPORT'
  | 'NATIONAL_ID'
  | 'DRIVERS_LICENSE'
  | 'PASSPORT_PHOTOGRAPH';

export const KYC_IDENTITY_DOCUMENT_TYPES: readonly KycIdentityDocumentType[] = [
  'PASSPORT',
  'NATIONAL_ID',
  'DRIVERS_LICENSE',
  'PASSPORT_PHOTOGRAPH',
];

export interface KycIdentityDocumentOption {
  type: KycIdentityDocumentType;
  label: string;
  uploadHint: string;
}

export type KycGovernmentIdDocumentType = Exclude<KycIdentityDocumentType, 'PASSPORT_PHOTOGRAPH'>;

export const KYC_GOVERNMENT_ID_DOCUMENT_OPTIONS: readonly KycIdentityDocumentOption[] = [
  {
    type: 'PASSPORT',
    label: "Int'l Passport",
    uploadHint: 'Upload a clear photo of your passport photo page.',
  },
  {
    type: 'NATIONAL_ID',
    label: 'National ID',
    uploadHint: 'Upload clear photos of the front and back of your national identity card.',
  },
  {
    type: 'DRIVERS_LICENSE',
    label: "Driver's License",
    uploadHint: "Upload clear photos of the front and back of your driver's license.",
  },
];

export const KYC_PASSPORT_PHOTOGRAPH_OPTION: KycIdentityDocumentOption = {
  type: 'PASSPORT_PHOTOGRAPH',
  label: 'Passport Photograph',
  uploadHint: 'Upload a recent passport-style photograph (plain background).',
};

/** @deprecated Use KYC_GOVERNMENT_ID_DOCUMENT_OPTIONS and KYC_PASSPORT_PHOTOGRAPH_OPTION */
export const KYC_IDENTITY_DOCUMENT_OPTIONS: readonly KycIdentityDocumentOption[] = [
  ...KYC_GOVERNMENT_ID_DOCUMENT_OPTIONS,
  KYC_PASSPORT_PHOTOGRAPH_OPTION,
];

export function kycGovernmentIdRequiresFrontAndBack(
  type: KycGovernmentIdDocumentType,
): boolean {
  return type === 'NATIONAL_ID' || type === 'DRIVERS_LICENSE';
}

export const KYC_IDENTITY_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

export const KYC_IDENTITY_MAX_FILE_BYTES = 10 * 1024 * 1024;

export function isKycIdentityDocumentType(value: string): value is KycIdentityDocumentType {
  return (KYC_IDENTITY_DOCUMENT_TYPES as readonly string[]).includes(value);
}
