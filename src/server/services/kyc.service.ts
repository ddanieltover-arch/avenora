/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Simulated KYC & Identity Verification Service
 *
 * Implements:
 * - Tiered verification workflows (Tier 1 Basic, Tier 2 Full Document)
 * - Country-specific compliance validations (US SSN, BR CPF, ES DNI)
 * - Document metadata vault with private synthetic references (no public URLs)
 * - Server-authoritative state transitions with reviewer role enforcement
 * - Append-only review history and audit events
 */

import { KycStatus, UserRole } from './auth.service.ts';
import { defaultAuthService } from './auth.service.ts';
import { defaultAuditService } from './audit.service.ts';
import { defaultDomesticBankAccountService } from './domesticBankAccount.service.ts';
import {
  canonicalizeTaxIdType,
  countryHasIndividualTaxId,
  findTaxIdOption,
  UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE,
} from '../../domain/kyc/taxIdByCountry.ts';

export interface DocumentReference {
  id: string;
  type:
    | 'PASSPORT'
    | 'DRIVERS_LICENSE'
    | 'NATIONAL_ID'
    | 'PASSPORT_PHOTOGRAPH'
    | 'PROOF_OF_ADDRESS';
  fileName: string;
  mimeType: string;
  storageRef: string; // Synthetic encrypted vault URI (e.g. vault://kyc/enc_doc_xxx)
  fileSize: number;
  uploadedAt: Date;
  /** Staff-only review preview (data URL). Never returned to customers. */
  previewDataUrl?: string;
}

export interface ReviewHistoryEvent {
  reviewerUserId: string;
  reviewerName: string;
  previousStatus: KycStatus;
  newStatus: KycStatus;
  notes?: string;
  reasonCode?: string;
  timestamp: Date;
}

export interface KycCustomerNotification {
  id: string;
  status: KycStatus;
  title: string;
  message: string;
  timestamp: Date;
}

export interface ExternalKycRecord {
  providerCode: string;
  externalCaseId: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'INCONCLUSIVE' | 'UNRESOLVED';
  confidenceScore?: number;
  checksSummary?: {
    documentAuthenticity: boolean;
    facialMatch: boolean;
    sanctionsClear: boolean;
    pepClear: boolean;
  };
  disclaimer: string;
  receivedAt: Date;
  callbackSignatureVerified: boolean;
}

export interface KycProfileRecord {
  id: string;
  userId: string;
  tier: number;
  status: KycStatus;
  version: number;
  resubmissionCount: number;
  legalFirstName?: string;
  legalLastName?: string;
  dateOfBirth?: string;
  taxIdType?: string;
  taxIdMasked?: string;
  /** Full tax ID for compliance review only — stripped from customer responses. */
  taxIdFull?: string;
  residentialAddress?: {
    street: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  documentRefs: DocumentReference[];
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewerUserId?: string;
  reviewerNotes?: string;
  rejectionReason?: string;
  reasonCode?: string;
  reviewHistory: ReviewHistoryEvent[];
  customerNotifications: KycCustomerNotification[];
  externalVerification?: ExternalKycRecord;
  /** Authoritative jurisdiction for domestic account format after KYC approval. */
  verifiedCountryCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class KycService {
  private profilesByUserId = new Map<string, KycProfileRecord>();

  /**
   * Retrieves or initializes a KYC profile for a user.
   */
  public getOrCreateProfile(userId: string): KycProfileRecord {
    let profile = this.profilesByUserId.get(userId);
    if (!profile) {
      profile = {
        id: `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        tier: 1,
        status: 'NOT_STARTED',
        version: 1,
        resubmissionCount: 0,
        documentRefs: [],
        reviewHistory: [],
        customerNotifications: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.profilesByUserId.set(userId, profile);
    }
    return profile;
  }

  /**
   * Submits or updates verification details. Customer-facing.
   */
  public submitVerification(params: {
    userId: string;
    tier?: number;
    legalFirstName: string;
    legalLastName: string;
    dateOfBirth: string; // YYYY-MM-DD
    taxIdType: string;
    taxIdNumber: string;
    residentialAddress: {
      street: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country: string;
    };
    documents?: Array<{
      type:
        | 'PASSPORT'
        | 'DRIVERS_LICENSE'
        | 'NATIONAL_ID'
        | 'PASSPORT_PHOTOGRAPH'
        | 'PROOF_OF_ADDRESS';
      fileName: string;
      mimeType: string;
      fileSize: number;
      previewDataUrl?: string;
    }>;
  }): KycProfileRecord {
    const profile = this.getOrCreateProfile(params.userId);

    // Cannot submit while currently under review or already approved
    if (profile.status === 'UNDER_REVIEW') {
      throw new Error('Your verification is currently under review by our compliance team.');
    }
    if (profile.status === 'APPROVED') {
      throw new Error('Your identity verification has already been approved.');
    }

    const country = params.residentialAddress.country;
    if (!countryHasIndividualTaxId(country)) {
      throw new Error(UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE);
    }
    const taxIdType = canonicalizeTaxIdType(country, params.taxIdType);
    if (!taxIdType) {
      throw new Error('Tax ID type is not valid for this country.');
    }

    this.validateTaxId(taxIdType, params.taxIdNumber, country);

    // Mask sensitive tax ID for safe presentation
    const cleanTaxId = params.taxIdNumber.trim();
    const masked = cleanTaxId.length > 4 
      ? `***-**-${cleanTaxId.slice(-4)}`
      : '***';

    // Build document references with private synthetic vault storage references
    const newDocRefs: DocumentReference[] = (params.documents || []).map((doc) => {
      const preview =
        typeof doc.previewDataUrl === 'string' &&
        doc.previewDataUrl.startsWith('data:') &&
        doc.previewDataUrl.length <= 1_800_000
          ? doc.previewDataUrl
          : undefined;
      return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: doc.type,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        storageRef: `vault://kyc/${new Date().getFullYear()}/${params.userId}/${Math.random().toString(36).substring(2, 10)}.enc`,
        fileSize: doc.fileSize,
        uploadedAt: new Date(),
        ...(preview ? { previewDataUrl: preview } : {}),
      };
    });

    const isResubmission = profile.status === 'REJECTED' || profile.status === 'NEEDS_MORE_INFORMATION';

    profile.tier = params.tier || 1;
    profile.status = 'SUBMITTED';
    profile.version = (profile.version || 1) + 1;
    if (isResubmission) {
      profile.resubmissionCount = (profile.resubmissionCount || 0) + 1;
    }
    profile.legalFirstName = params.legalFirstName.trim();
    profile.legalLastName = params.legalLastName.trim();
    profile.dateOfBirth = params.dateOfBirth;
    profile.taxIdType = taxIdType;
    profile.taxIdMasked = masked;
    profile.taxIdFull = cleanTaxId;
    profile.residentialAddress = params.residentialAddress;
    // Resubmissions replace prior document set so reviewers see the latest pack
    profile.documentRefs = newDocRefs.length > 0 ? newDocRefs : profile.documentRefs;
    profile.submittedAt = new Date();
    profile.rejectionReason = undefined;
    profile.updatedAt = new Date();

    // Customer Notification
    profile.customerNotifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'SUBMITTED',
      title: isResubmission ? 'KYC Resubmission Queued' : 'KYC Verification Queued',
      message: isResubmission
        ? 'Your updated verification details and documents have been received and queued for compliance re-evaluation.'
        : 'Your verification submission has been received and queued for compliance review.',
      timestamp: new Date(),
    });

    // Update user record kycStatus — account stays inactive until admin approval
    const user = defaultAuthService.getUserById(params.userId);
    if (user) {
      user.kycStatus = 'SUBMITTED';
      user.updatedAt = new Date();
      defaultAuthService.syncCustomerActivationFromKyc(params.userId);
    }

    return profile;
  }

  /**
   * Compliance review action. Strictly restricted to COMPLIANCE_REVIEWER / ADMIN.
   * Customers CANNOT invoke this method.
   */
  public async reviewProfile(params: {
    reviewerRole: UserRole;
    reviewerUserId: string;
    reviewerName: string;
    targetUserId: string;
    decision: 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFORMATION' | 'UNDER_REVIEW';
    notes?: string;
    rejectionReason?: string;
    reasonCode?: string;
    expectedVersion?: number;
  }): Promise<KycProfileRecord> {
    // Strict Server-Side Role Enforcement
    const allowedRoles: UserRole[] = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(params.reviewerRole)) {
      throw new Error('Access denied: only compliance officers or administrators can review verification profiles.');
    }

    // Separation of duties: Reviewer cannot review/approve their own KYC submission
    if (params.reviewerUserId === params.targetUserId) {
      throw new Error('Separation of duties violation: You cannot review or approve your own KYC profile.');
    }

    if (params.decision === 'REJECTED' && !params.rejectionReason && !params.notes) {
      throw new Error('A documented reason is required when rejecting a KYC submission.');
    }
    if (params.decision === 'NEEDS_MORE_INFORMATION' && !params.notes) {
      throw new Error('Documented notes explaining what additional information is required are mandatory.');
    }

    const profile = this.profilesByUserId.get(params.targetUserId);
    if (!profile) {
      throw new Error(`KYC profile not found for user: ${params.targetUserId}`);
    }

    // Concurrency Conflict Detection
    if (params.expectedVersion !== undefined && profile.version !== params.expectedVersion) {
      throw new Error(
        `Conflict: KYC case for user "${params.targetUserId}" was modified by another reviewer (version ${profile.version} vs expected ${params.expectedVersion}).`
      );
    }

    // Idempotent duplicate check: if already in requested state with same decision
    if (
      profile.status === params.decision &&
      profile.reviewerUserId === params.reviewerUserId &&
      (profile.reviewerNotes === params.notes || !params.notes)
    ) {
      return profile;
    }

    // Prevent conflicting terminal state overwrites without resubmission
    if (profile.status === 'APPROVED' && params.decision !== 'APPROVED') {
      throw new Error(
        `Conflict: KYC case for user "${params.targetUserId}" has already reached terminal status APPROVED. Status cannot be changed without customer resubmission.`
      );
    }

    const prevStatus = profile.status;
    profile.status = params.decision;
    profile.version = (profile.version || 1) + 1;
    profile.reviewerUserId = params.reviewerUserId;
    profile.reviewerNotes = params.notes;
    profile.reasonCode = params.reasonCode || (params.decision === 'APPROVED' ? 'SANCTIONS_AND_IDENTITY_CLEARED' : 'COMPLIANCE_EVALUATION');
    profile.reviewedAt = new Date();
    profile.rejectionReason = params.rejectionReason;
    profile.updatedAt = new Date();

    if (params.decision === 'APPROVED') {
      profile.verifiedCountryCode = profile.residentialAddress?.country?.trim().toUpperCase();
    }

    // Append to immutable review history
    profile.reviewHistory.push({
      reviewerUserId: params.reviewerUserId,
      reviewerName: params.reviewerName,
      previousStatus: prevStatus,
      newStatus: params.decision,
      notes: params.notes,
      reasonCode: profile.reasonCode,
      timestamp: new Date(),
    });

    // Notify Customer through portal notification mechanism
    const notifTitle =
      params.decision === 'APPROVED'
        ? 'Identity Verification Approved (Demo Prototype)'
        : params.decision === 'REJECTED'
        ? 'Identity Verification Rejected'
        : params.decision === 'NEEDS_MORE_INFORMATION'
        ? 'Additional Information Required for Verification'
        : 'Verification Under Review';

    const notifMsg =
      params.notes || params.rejectionReason || `Your verification status was updated to ${params.decision}.`;

    profile.customerNotifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: params.decision,
      title: notifTitle,
      message: notifMsg,
      timestamp: new Date(),
    });

    // Update user record — activate only after admin APPROVED KYC
    const user = defaultAuthService.getUserById(params.targetUserId);
    if (user) {
      user.kycStatus = params.decision;
      user.updatedAt = new Date();
      defaultAuthService.syncCustomerActivationFromKyc(params.targetUserId);
    }

    // Log to durable audit trail
    defaultAuditService.logAction({
      action: 'KYC_REVIEWED',
      actorUserId: params.reviewerUserId,
      actorRole: params.reviewerRole,
      resourceType: 'KYC_PROFILE',
      resourceId: profile.id,
      previousState: prevStatus,
      newState: params.decision,
      reason: params.rejectionReason || params.notes || `Decision recorded as ${params.decision}`,
      details: {
        targetUserId: params.targetUserId,
        reviewerName: params.reviewerName,
        tier: profile.tier,
        reasonCode: profile.reasonCode,
        version: profile.version,
        verifiedCountryCode: profile.verifiedCountryCode,
        determinationScope: 'INTERNAL_ADMINISTRATIVE_ONLY',
        disclaimer: 'INTERNAL DETERMINATION ONLY — DOES NOT CONSTITUTE REGULATORY APPROVAL OR PROOF OF EXTERNAL IDSP CLEARANCE',
      },
    });

    if (params.decision === 'APPROVED') {
      try {
        await defaultDomesticBankAccountService.ensurePrimaryAccountAfterKycApproval({
          userId: params.targetUserId,
          kycProfile: profile,
          correlationId: `kyc_approve_${profile.id}_v${profile.version}`,
        });
      } catch (err) {
        defaultAuditService.logAction({
          action: 'CONFIG_CHANGED',
          actorUserId: 'system_domestic_account',
          actorRole: 'SYSTEM',
          resourceType: 'DOMESTIC_BANK_ACCOUNT',
          resourceId: profile.id,
          reason: 'Domestic account generation failed after KYC approval',
          details: {
            targetUserId: params.targetUserId,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    return profile;
  }

  /**
   * Secure identity document access control.
   * Prohibits unauthorized access to other customers' sensitive verification artifacts.
   */
  public getSecureDocumentAccess(params: {
    targetUserId: string;
    documentId: string;
    actorUserId: string;
    actorRole: UserRole;
  }): {
    accessGranted: boolean;
    document: DocumentReference;
    storageRef: string;
    secureToken: string;
    notice: string;
  } {
    const isOwner = params.actorUserId === params.targetUserId;
    const isStaff = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(params.actorRole);

    if (!isOwner && !isStaff) {
      throw new Error("Access denied: You do not have permission to access another customer's identity documents.");
    }

    const profile = this.profilesByUserId.get(params.targetUserId);
    if (!profile) throw new Error('KYC profile not found.');

    const doc = profile.documentRefs.find((d) => d.id === params.documentId);
    if (!doc) throw new Error('Document not found in verification profile.');

    return {
      accessGranted: true,
      document: doc,
      storageRef: doc.storageRef,
      secureToken: `sectok_kyc_doc_${Math.random().toString(36).substring(2, 10)}`,
      notice: 'CONFIDENTIAL IDENTITY ARTIFACT - Controlled Internal Access Only. Never expose publicly.',
    };
  }

  /**
   * Sanitizes profile for customer consumption (stripping internal reviewer notes,
   * full tax ID, and document preview payloads).
   */
  public sanitizeForCustomer(profile: KycProfileRecord): Omit<
    KycProfileRecord,
    'reviewerNotes' | 'taxIdFull'
  > & { documentRefs: Omit<DocumentReference, 'previewDataUrl'>[] } {
    const { reviewerNotes: _notes, taxIdFull: _tax, ...safeProfile } = profile;
    return {
      ...safeProfile,
      documentRefs: (profile.documentRefs || []).map(({ previewDataUrl: _p, ...doc }) => doc),
    };
  }

  public getAllProfilesForReview(reviewerRole: UserRole): KycProfileRecord[] {
    const allowedRoles: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(reviewerRole)) {
      throw new Error('Access denied.');
    }
    return Array.from(this.profilesByUserId.values());
  }

  /**
   * Attaches an external identity verification / screening result from an IDSP partner.
   * INVARIANT: External verification results DO NOT automatically approve a customer.
   * The submission remains SUBMITTED or UNDER_REVIEW pending human compliance review.
   * Timeouts, errors, or unverified signatures are marked UNRESOLVED.
   */
  public attachExternalVerificationResult(params: {
    userId: string;
    providerCode: string;
    externalCaseId: string;
    status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'INCONCLUSIVE' | 'UNRESOLVED';
    confidenceScore?: number;
    checksSummary?: {
      documentAuthenticity: boolean;
      facialMatch: boolean;
      sanctionsClear: boolean;
      pepClear: boolean;
    };
    signatureVerified: boolean;
    correlationId: string;
  }): KycProfileRecord {
    const profile = this.profilesByUserId.get(params.userId);
    if (!profile) {
      throw new Error(`Cannot attach external KYC result: profile not found for user "${params.userId}".`);
    }

    const effectiveStatus = !params.signatureVerified
      ? 'UNRESOLVED'
      : params.status;

    profile.externalVerification = {
      providerCode: params.providerCode,
      externalCaseId: params.externalCaseId,
      status: effectiveStatus,
      confidenceScore: params.confidenceScore,
      checksSummary: params.checksSummary,
      disclaimer: 'EXTERNAL ADVISORY INTELLIGENCE - REQUIRES FINAL COMPLIANCE OFFICER DETERMINATION',
      receivedAt: new Date(),
      callbackSignatureVerified: params.signatureVerified,
    };

    profile.updatedAt = new Date();

    // If case was SUBMITTED, transition to UNDER_REVIEW
    if (profile.status === 'SUBMITTED') {
      profile.status = 'UNDER_REVIEW';
    }

    defaultAuditService.logAction({
      action: 'KYC_REVIEWED',
      actorUserId: `system_provider_${params.providerCode}`,
      actorRole: 'SYSTEM',
      resourceType: 'KycProfile',
      resourceId: profile.id,
      financialTxId: undefined,
      details: {
        providerCode: params.providerCode,
        externalCaseId: params.externalCaseId,
        externalStatus: effectiveStatus,
        signatureVerified: params.signatureVerified,
        autoApprovalPrevented: true,
      },
    });

    return profile;
  }

  private validateTaxId(type: string, value: string, country: string): void {
    const clean = value.replace(/[\s.-]/g, '').toUpperCase();
    if (!clean) throw new Error('Tax identifier is required.');

    if (type === 'US_SSN') {
      if (!/^\d{9}$/.test(clean) && !/^\d{4}$/.test(clean)) {
        throw new Error('US SSN must be 9 digits (or last 4 digits for Tier 1).');
      }
      return;
    }
    if (type === 'US_ITIN') {
      if (!/^9\d{8}$/.test(clean)) {
        throw new Error('US ITIN must be 9 digits and start with 9.');
      }
      return;
    }
    if (type === 'BR_CPF') {
      if (!/^\d{11}$/.test(clean)) {
        throw new Error('Brazilian CPF must be 11 digits.');
      }
      return;
    }
    if (type === 'ES_DNI') {
      if (!/^\d{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
        throw new Error('Spanish DNI must be 8 digits followed by a check letter.');
      }
      return;
    }
    if (type === 'ES_NIE') {
      if (!/^[XYZ]\d{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
        throw new Error('Spanish NIE must start with X, Y, or Z, followed by 7 digits and a check letter.');
      }
      return;
    }

    const option = findTaxIdOption(country, type);
    if (!option) {
      throw new Error('Tax ID type is not valid for this country.');
    }
    if (!new RegExp(option.pattern).test(clean)) {
      throw new Error(option.patternHint);
    }
  }
}

export const defaultKycService = new KycService();
