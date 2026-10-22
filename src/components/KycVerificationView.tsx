/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Customer KYC & Compliance Verification Component
 */

import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { useAuth } from './AuthContext.tsx';
import {
  canonicalizeTaxIdType,
  getTaxIdOptionsForCountry,
  isTaxIdTypeAllowedForCountry,
  resolveDefaultTaxIdType,
  UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE,
  type KycTaxIdType,
} from '../domain/kyc/taxIdByCountry.ts';
import {
  KYC_GOVERNMENT_ID_DOCUMENT_OPTIONS,
  KYC_PASSPORT_PHOTOGRAPH_OPTION,
  KYC_IDENTITY_IMAGE_ACCEPT,
  KYC_IDENTITY_MAX_FILE_BYTES,
  isAcceptableKycIdentityImage,
  kycGovernmentIdRequiresFrontAndBack,
  isKycIdentityDocumentType,
  type KycGovernmentIdDocumentType,
  type KycIdentityDocumentType,
} from '../domain/kyc/kycIdentityDocuments.ts';
import {
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  BookOpen,
  Flag,
  IdCard,
  Camera,
  X,
} from 'lucide-react';

const GOVERNMENT_ID_ICONS: Record<
  KycGovernmentIdDocumentType,
  React.ComponentType<{ className?: string }>
> = {
  PASSPORT: BookOpen,
  NATIONAL_ID: Flag,
  DRIVERS_LICENSE: IdCard,
};

type UploadSlot = {
  file: File | null;
  previewUrl: string | null;
  savedLabel: string | null;
};

const emptyUploadSlot = (): UploadSlot => ({
  file: null,
  previewUrl: null,
  savedLabel: null,
});

const MAX_REVIEW_PREVIEW_CHARS = 1_600_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/** Compress image for staff review; omit preview if still too large. */
async function fileToReviewPreviewDataUrl(file: File): Promise<string | undefined> {
  try {
    if (!file.type.startsWith('image/')) {
      if (file.size > 350_000) return undefined;
      const raw = await readFileAsDataUrl(file);
      return raw.length <= MAX_REVIEW_PREVIEW_CHARS ? raw : undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Image decode failed'));
        el.src = objectUrl;
      });
      const maxEdge = 1280;
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.72;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length > MAX_REVIEW_PREVIEW_CHARS && quality > 0.35) {
        quality -= 0.12;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      return dataUrl.length <= MAX_REVIEW_PREVIEW_CHARS ? dataUrl : undefined;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return undefined;
  }
}

interface IdentityUploadZoneProps {
  title: string;
  hint: string;
  slot: UploadSlot;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelectFile: (file: File | null) => void;
  onClear: () => void;
}

const IdentityUploadZone: React.FC<IdentityUploadZoneProps> = ({
  title,
  hint,
  slot,
  inputRef,
  onSelectFile,
  onClear,
}) => {
  const inputId = useId();
  const hasSelection = Boolean(slot.file || slot.previewUrl || slot.savedLabel);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    const file = selected && selected.length > 0 ? selected.item(0) : null;
    onSelectFile(file);
  };

  return (
    <div className="kyc-upload-zone rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden />
        <div className="min-w-0 text-left">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
          <p className="mt-1 text-[10px] text-slate-500">Photos from camera or gallery · Max 10 MB</p>
        </div>
      </div>

      {slot.previewUrl && (
        <img
          src={slot.previewUrl}
          alt={title}
          className="mx-auto max-h-40 w-full rounded-lg border border-slate-800 object-contain"
        />
      )}

      {hasSelection && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden />
          <span className="font-mono text-slate-200 break-all">
            {slot.file?.name || slot.savedLabel}
          </span>
          <span className="font-semibold uppercase tracking-wide text-emerald-400">Ready</span>
        </div>
      )}

      {/*
        Visible native file control — required for reliable mobile (Android Chrome / iOS).
        Do not use opacity-0 overlays; they miss taps inside scroll containers on phones.
        No capture= attribute — that forces camera-only and blocks gallery on many devices.
      */}
      <input
        id={inputId}
        ref={inputRef}
        name={`kyc-upload-${inputId}`}
        type="file"
        accept={KYC_IDENTITY_IMAGE_ACCEPT}
        onChange={handleFileChange}
        className="kyc-file-input"
      />

      {hasSelection && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-slate-700 px-4 py-2.5 text-xs text-slate-300 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Remove photo
        </button>
      )}
    </div>
  );
};

export const KycVerificationView: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [legalFirstName, setLegalFirstName] = useState('');
  const [legalLastName, setLegalLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const signupCountryCode = (user?.countryCode ?? 'US').toUpperCase();
  const taxIdOptions = useMemo(
    () => getTaxIdOptionsForCountry(signupCountryCode),
    [signupCountryCode],
  );

  const [taxIdType, setTaxIdType] = useState<KycTaxIdType>(() =>
    resolveDefaultTaxIdType(signupCountryCode),
  );
  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [selectedGovernmentIdType, setSelectedGovernmentIdType] =
    useState<KycGovernmentIdDocumentType>('PASSPORT');
  const [govSingleSlot, setGovSingleSlot] = useState<UploadSlot>(emptyUploadSlot);
  const [govFrontSlot, setGovFrontSlot] = useState<UploadSlot>(emptyUploadSlot);
  const [govBackSlot, setGovBackSlot] = useState<UploadSlot>(emptyUploadSlot);
  const [passportPhotoSlot, setPassportPhotoSlot] = useState<UploadSlot>(emptyUploadSlot);
  const govSingleInputRef = useRef<HTMLInputElement>(null);
  const govFrontInputRef = useRef<HTMLInputElement>(null);
  const govBackInputRef = useRef<HTMLInputElement>(null);
  const passportPhotoInputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const focusUploadSection = () => {
    window.setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const activeTaxIdOption =
    taxIdOptions.find((option) => option.value === taxIdType) ?? taxIdOptions[0];

  // Compliance Reviewer states (for staff roles)
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
  const [selectedReviewUser, setSelectedReviewUser] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFORMATION'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('Document review completed.');

  // Feedback
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const isStaff = user?.role === 'COMPLIANCE_REVIEWER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/kyc/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        if (data.profile.legalFirstName) setLegalFirstName(data.profile.legalFirstName);
        if (data.profile.legalLastName) setLegalLastName(data.profile.legalLastName);
        if (data.profile.dateOfBirth) setDateOfBirth(data.profile.dateOfBirth);
        const canonicalTaxId = data.profile.taxIdType
          ? canonicalizeTaxIdType(signupCountryCode, data.profile.taxIdType)
          : null;
        setTaxIdType(canonicalTaxId ?? resolveDefaultTaxIdType(signupCountryCode));
        if (data.profile.residentialAddress) {
          const { street, city } = data.profile.residentialAddress;
          const parts = [street, city].filter((part) => part && String(part).trim());
          setAddressLine(parts.join(', '));
        }
        const documentRefs = data.profile.documentRefs ?? [];
        const latestGov = [...documentRefs]
          .reverse()
          .find(
            (doc) =>
              doc.type &&
              doc.type !== 'PASSPORT_PHOTOGRAPH' &&
              doc.type !== 'PROOF_OF_ADDRESS' &&
              isKycIdentityDocumentType(doc.type),
          );
        if (latestGov?.type && latestGov.type !== 'PASSPORT_PHOTOGRAPH') {
          setSelectedGovernmentIdType(latestGov.type as KycGovernmentIdDocumentType);
        }

        const govType = (latestGov?.type as KycGovernmentIdDocumentType) || 'PASSPORT';
        const govDocs = documentRefs.filter((doc) => doc.type === govType);
        const frontSaved = govDocs.find((doc) => /_FRONT_/i.test(doc.fileName || ''));
        const backSaved = govDocs.find((doc) => /_BACK_/i.test(doc.fileName || ''));
        const singleSaved = govDocs.find(
          (doc) => !/_FRONT_/i.test(doc.fileName || '') && !/_BACK_/i.test(doc.fileName || ''),
        );

        setGovSingleSlot({
          file: null,
          previewUrl: null,
          savedLabel:
            govType === 'PASSPORT' && singleSaved?.fileName
              ? singleSaved.fileName
              : null,
        });
        setGovFrontSlot({
          file: null,
          previewUrl: null,
          savedLabel: frontSaved?.fileName ?? null,
        });
        setGovBackSlot({
          file: null,
          previewUrl: null,
          savedLabel: backSaved?.fileName ?? null,
        });

        const photoSaved = [...documentRefs]
          .reverse()
          .find((doc) => doc.type === 'PASSPORT_PHOTOGRAPH');
        setPassportPhotoSlot({
          file: null,
          previewUrl: null,
          savedLabel: photoSaved?.fileName ?? null,
        });
      }

      // If staff, also load pending profiles for review
      if (isStaff) {
        const revRes = await fetch('/api/v1/kyc/reviews', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const revData = await revRes.json();
        if (revRes.ok && revData.profiles) {
          setPendingProfiles(revData.profiles);
        }
      }
    } catch (err) {
      console.error('Failed to load KYC', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token, user?.role, signupCountryCode]);

  useEffect(() => {
    if (!isTaxIdTypeAllowedForCountry(signupCountryCode, taxIdType)) {
      setTaxIdType(resolveDefaultTaxIdType(signupCountryCode));
    }
  }, [signupCountryCode, taxIdType]);

  useEffect(() => {
    const previewUrls = [
      govSingleSlot.previewUrl,
      govFrontSlot.previewUrl,
      govBackSlot.previewUrl,
      passportPhotoSlot.previewUrl,
    ].filter(Boolean) as string[];
    return () => {
      for (const url of previewUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [
    govSingleSlot.previewUrl,
    govFrontSlot.previewUrl,
    govBackSlot.previewUrl,
    passportPhotoSlot.previewUrl,
  ]);

  const activeGovernmentIdOption =
    KYC_GOVERNMENT_ID_DOCUMENT_OPTIONS.find((option) => option.type === selectedGovernmentIdType) ??
    KYC_GOVERNMENT_ID_DOCUMENT_OPTIONS[0];

  const governmentIdNeedsFrontAndBack = kycGovernmentIdRequiresFrontAndBack(selectedGovernmentIdType);

  const clearUploadSlot = (
    setSlot: React.Dispatch<React.SetStateAction<UploadSlot>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    setSlot((current) => {
      if (current.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return emptyUploadSlot();
    });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const applyUploadSlotFile = (
    setSlot: React.Dispatch<React.SetStateAction<UploadSlot>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
    file: File | null,
  ) => {
    if (!file) {
      clearUploadSlot(setSlot, inputRef);
      return;
    }

    if (file.size > KYC_IDENTITY_MAX_FILE_BYTES) {
      setFeedback({ success: false, message: 'Image must be 10 MB or smaller.' });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (!isAcceptableKycIdentityImage(file)) {
      setFeedback({
        success: false,
        message: 'Please choose a photo from your camera or gallery (JPEG, PNG, WebP, or HEIC).',
      });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {
      // Some mobile formats still upload without a browser preview.
      previewUrl = null;
    }

    setFeedback(null);
    setSlot((current) => {
      if (current.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return {
        file,
        previewUrl,
        savedLabel: null,
      };
    });
  };

  const clearGovernmentIdUploads = () => {
    clearUploadSlot(setGovSingleSlot, govSingleInputRef);
    clearUploadSlot(setGovFrontSlot, govFrontInputRef);
    clearUploadSlot(setGovBackSlot, govBackInputRef);
  };

  const slotHasFile = (slot: UploadSlot) => Boolean(slot.file || slot.savedLabel);

  const buildDocumentPayload = async () => {
    const documents: Array<{
      type: KycIdentityDocumentType;
      fileName: string;
      mimeType: string;
      fileSize: number;
      previewDataUrl?: string;
    }> = [];

    const pushDoc = async (
      type: KycIdentityDocumentType,
      file: File,
      fileName: string
    ) => {
      const previewDataUrl = await fileToReviewPreviewDataUrl(file);
      documents.push({
        type,
        fileName,
        mimeType: file.type || 'image/jpeg',
        fileSize: file.size,
        ...(previewDataUrl ? { previewDataUrl } : {}),
      });
    };

    if (governmentIdNeedsFrontAndBack) {
      if (govFrontSlot.file) {
        await pushDoc(
          selectedGovernmentIdType,
          govFrontSlot.file,
          `${selectedGovernmentIdType}_FRONT_${govFrontSlot.file.name}`
        );
      }
      if (govBackSlot.file) {
        await pushDoc(
          selectedGovernmentIdType,
          govBackSlot.file,
          `${selectedGovernmentIdType}_BACK_${govBackSlot.file.name}`
        );
      }
    } else if (govSingleSlot.file) {
      await pushDoc(selectedGovernmentIdType, govSingleSlot.file, govSingleSlot.file.name);
    }

    if (passportPhotoSlot.file) {
      await pushDoc('PASSPORT_PHOTOGRAPH', passportPhotoSlot.file, passportPhotoSlot.file.name);
    }

    return documents;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!taxIdType || taxIdOptions.length === 0) {
      setFeedback({
        success: false,
        message: UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE,
      });
      return;
    }

    if (governmentIdNeedsFrontAndBack) {
      if (!slotHasFile(govFrontSlot) || !slotHasFile(govBackSlot)) {
        setFeedback({
          success: false,
          message: `Please upload both front and back images for your ${activeGovernmentIdOption.label}.`,
        });
        focusUploadSection();
        return;
      }
    } else if (!slotHasFile(govSingleSlot)) {
      setFeedback({
        success: false,
        message: `Please upload an image for your ${activeGovernmentIdOption.label}. Scroll down and use Choose File.`,
      });
      focusUploadSection();
      return;
    }

    if (!slotHasFile(passportPhotoSlot)) {
      setFeedback({
        success: false,
        message: 'Please upload your passport-style photograph. Scroll to the photo section and use Choose File.',
      });
      focusUploadSection();
      return;
    }

    const documents = await buildDocumentPayload();

    try {
      const res = await fetch('/api/v1/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier: 2,
          legalFirstName,
          legalLastName,
          dateOfBirth,
          taxIdType,
          taxIdNumber,
          residentialAddress: {
            street: addressLine,
            country: signupCountryCode,
          },
          documents: documents.length > 0 ? documents : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(null);
        await fetchProfile();
        refreshUser();
      } else {
        setFeedback({ success: false, message: data.detail || 'Submission failed' });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message });
    }
  };

  const handleReviewDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewUser) return;
    try {
      const res = await fetch(`/api/v1/kyc/reviews/${selectedReviewUser}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: reviewDecision,
          notes: reviewNotes,
          rejectionReason: reviewDecision === 'REJECTED' ? 'Documentation does not meet requirements' : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ success: true, message: `Review decision "${reviewDecision}" recorded.` });
        fetchProfile();
        refreshUser();
      } else {
        setFeedback({ success: false, message: data.detail || 'Decision failed' });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message });
    }
  };

  const kycStatus = profile?.status || user?.kycStatus || 'NOT_STARTED';
  const isPendingReview = kycStatus === 'SUBMITTED' || kycStatus === 'UNDER_REVIEW';
  const isApproved = kycStatus === 'APPROVED';
  const canEditForm =
    kycStatus === 'NOT_STARTED' ||
    kycStatus === 'IN_PROGRESS' ||
    kycStatus === 'REJECTED' ||
    kycStatus === 'NEEDS_MORE_INFORMATION';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED (APPROVED)
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/30">
            <Clock className="w-3.5 h-3.5" /> UNDER COMPLIANCE REVIEW
          </span>
        );
      case 'NEEDS_MORE_INFORMATION':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> ACTION REQUIRED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> VERIFICATION REJECTED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            NOT STARTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Overview & Status Banner */}
      <div className="portal-dark-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-primary/25 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 portal-dark-icon">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Customer Identity Verification (KYC / AML)
              </h2>
              <p className="text-xs text-slate-400">
                Tiered compliance verification. Server-authoritative review workflow.
              </p>
            </div>
          </div>

          <div>{getStatusBadge(kycStatus)}</div>
        </div>

        {feedback && !feedback.success && (
          <div className="p-3 rounded-xl border text-xs bg-rose-950/30 border-rose-500/40 text-rose-300">
            {feedback.message}
          </div>
        )}
      </div>

      {/* Customer verification area: form OR pending OR approved */}
      <div className="portal-dark-panel p-6 space-y-4">
        {isApproved && (
          <div className="rounded-xl border border-brand-accent/40 bg-brand-deep/40 p-6 sm:p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center portal-dark-icon">
              <CheckCircle2 className="w-6 h-6" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-brand-accent">Identity verified</h3>
            <p className="text-sm text-brand-accent/90 max-w-md mx-auto leading-relaxed">
              Your KYC verification has been approved. You now have full access to identity-gated
              account features, including simulated domestic account details on your dashboard.
            </p>
          </div>
        )}

        {isPendingReview && (
          <div className="rounded-xl border border-brand-accent/45 bg-brand-deep/35 p-6 sm:p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center portal-dark-icon">
              <Clock className="w-6 h-6" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-brand-accent">
              Verification details submitted for compliance review.
            </h3>
            <p className="text-sm text-brand-accent/85 max-w-md mx-auto leading-relaxed">
              Your documents and personal details are with our compliance team. You do not need to
              resubmit while this review is in progress. We will update this page when a decision is made.
            </p>
          </div>
        )}

        {canEditForm && (
          <>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-accent" />
          {kycStatus === 'REJECTED' || kycStatus === 'NEEDS_MORE_INFORMATION'
            ? 'Update and resubmit verification details'
            : 'Submit verification details'}
        </h3>

        {(kycStatus === 'REJECTED' || kycStatus === 'NEEDS_MORE_INFORMATION') && (
          <div className="p-3 rounded-xl border border-amber-500/35 bg-amber-950/25 text-amber-100 text-xs leading-relaxed">
            {kycStatus === 'REJECTED'
              ? profile?.rejectionReason ||
                'Your previous submission was not approved. Please correct your details and documents, then submit again.'
              : 'Additional information is required. Please update the fields below and resubmit your verification.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Legal First Name</label>
              <input
                type="text"
                value={legalFirstName}
                onChange={(e) => setLegalFirstName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                placeholder="Alex"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Legal Last Name</label>
              <input
                type="text"
                value={legalLastName}
                onChange={(e) => setLegalLastName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                placeholder="Vance"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Tax ID Type</label>
              {taxIdOptions.length === 0 ? (
                <p className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-2.5 text-[11px] text-amber-200">
                  {UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE}
                </p>
              ) : (
                <select
                  value={taxIdType}
                  onChange={(e) => setTaxIdType(e.target.value as KycTaxIdType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {taxIdOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Tax ID Number</label>
              <input
                type="text"
                value={taxIdNumber}
                onChange={(e) => setTaxIdNumber(e.target.value)}
                required={taxIdOptions.length > 0}
                disabled={taxIdOptions.length === 0}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono disabled:opacity-50"
                placeholder={activeTaxIdOption?.placeholder ?? ''}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Residential Address</label>
            <input
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
              placeholder="100 Financial Plaza Suite 900, New York"
            />
          </div>

          <div
            ref={uploadSectionRef}
            id="kyc-document-uploads"
            className="space-y-4 rounded-xl border border-cyan-700/40 bg-slate-950/60 p-4"
          >
            <div>
              <span className="font-semibold text-white block text-sm">Government ID document</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Choose the ID you are submitting, then tap <span className="text-cyan-300 font-semibold">Choose File</span> to
                upload from your camera or gallery.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {KYC_GOVERNMENT_ID_DOCUMENT_OPTIONS.map((option) => {
                const Icon = GOVERNMENT_ID_ICONS[option.type];
                const isSelected = selectedGovernmentIdType === option.type;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setSelectedGovernmentIdType(option.type);
                      clearGovernmentIdUploads();
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white px-3 py-4 text-center transition shadow-sm ${
                      isSelected
                        ? 'border-cyan-600 text-cyan-700 ring-2 ring-cyan-500/30'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${isSelected ? 'text-cyan-600' : 'text-slate-500'}`}
                    />
                    <span className="text-[11px] font-semibold leading-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {governmentIdNeedsFrontAndBack ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IdentityUploadZone
                  title="Upload front"
                  hint={`Front of your ${activeGovernmentIdOption.label}.`}
                  slot={govFrontSlot}
                  inputRef={govFrontInputRef}
                  onSelectFile={(file) => applyUploadSlotFile(setGovFrontSlot, govFrontInputRef, file)}
                  onClear={() => clearUploadSlot(setGovFrontSlot, govFrontInputRef)}
                />
                <IdentityUploadZone
                  title="Upload back"
                  hint={`Back of your ${activeGovernmentIdOption.label}.`}
                  slot={govBackSlot}
                  inputRef={govBackInputRef}
                  onSelectFile={(file) => applyUploadSlotFile(setGovBackSlot, govBackInputRef, file)}
                  onClear={() => clearUploadSlot(setGovBackSlot, govBackInputRef)}
                />
              </div>
            ) : (
              <IdentityUploadZone
                title="Upload document image"
                hint={activeGovernmentIdOption.uploadHint}
                slot={govSingleSlot}
                inputRef={govSingleInputRef}
                onSelectFile={(file) => applyUploadSlotFile(setGovSingleSlot, govSingleInputRef, file)}
                onClear={() => clearUploadSlot(setGovSingleSlot, govSingleInputRef)}
              />
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 border border-slate-700 text-cyan-400 shrink-0">
                <Camera className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">
                  {KYC_PASSPORT_PHOTOGRAPH_OPTION.label}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {KYC_PASSPORT_PHOTOGRAPH_OPTION.uploadHint} This is separate from your government ID
                  upload.
                </p>
              </div>
            </div>

            <IdentityUploadZone
              title="Upload passport photograph"
              hint={KYC_PASSPORT_PHOTOGRAPH_OPTION.uploadHint}
              slot={passportPhotoSlot}
              inputRef={passportPhotoInputRef}
              onSelectFile={(file) => applyUploadSlotFile(setPassportPhotoSlot, passportPhotoInputRef, file)}
              onClear={() => clearUploadSlot(setPassportPhotoSlot, passportPhotoInputRef)}
            />
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={taxIdOptions.length === 0}
              className="px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-deep disabled:opacity-50 text-white font-medium text-xs shadow-md transition"
            >
              Submit for Compliance Verification
            </button>
          </div>
        </form>
          </>
        )}
      </div>

      {/* COMPLIANCE DECISION CONSOLE (Staff Only) */}
      {isStaff && (
        <div className="bg-slate-900/90 rounded-2xl border border-purple-800/40 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Compliance Reviewer Console (Staff Role Active)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              ROLE: {user?.role}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            As a compliance reviewer or administrator, you can inspect pending user verifications and record authoritative decisions.
          </p>

          <form onSubmit={handleReviewDecision} className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block text-slate-300 mb-1">Target Customer to Review</label>
              <select
                value={selectedReviewUser}
                onChange={(e) => setSelectedReviewUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
              >
                <option value="">Select a user...</option>
                {pendingProfiles.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.userId} — {p.legalFirstName || 'Pending'} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Compliance Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="APPROVED">APPROVED (Verified)</option>
                  <option value="NEEDS_MORE_INFORMATION">NEEDS_MORE_INFORMATION</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Reviewer Notes (Internal Only)</label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  placeholder="Sanctions check passed."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedReviewUser}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium shadow"
            >
              Record Compliance Decision
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
