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

/**
 * Keep accept simple — iOS/Android gallery pickers are most reliable with `image/*`.
 * Extra MIME/extension tokens can cause some mobile browsers to show an empty picker.
 */
export const KYC_IDENTITY_IMAGE_ACCEPT = 'image/*';

export const KYC_IDENTITY_MAX_FILE_BYTES = 10 * 1024 * 1024;

const IDENTITY_IMAGE_NAME_RE = /\.(jpe?g|png|webp|heic|heif|gif|bmp|tif{1,2})$/i;

/** True when the file looks like a usable identity photo (tolerant of empty MIME on mobile). */
export function isAcceptableKycIdentityImage(file: File): boolean {
  if (!file || file.size <= 0) return false;
  if (file.size > KYC_IDENTITY_MAX_FILE_BYTES) return false;
  if (file.type.startsWith('image/')) return true;
  if (IDENTITY_IMAGE_NAME_RE.test(file.name || '')) return true;
  // Camera/gallery picks on some WebViews omit MIME type entirely.
  return !file.type;
}

export function isKycIdentityDocumentType(value: string): value is KycIdentityDocumentType {
  return (KYC_IDENTITY_DOCUMENT_TYPES as readonly string[]).includes(value);
}
