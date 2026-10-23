import { z } from 'zod';

export type ReceiptStatus = 'draft' | 'needs_review' | 'confirmed';
export type DuplicateStatus = 'none' | 'suspected' | 'confirmed_duplicate' | 'dismissed';
export type DuplicateReviewStatus = 'pending' | 'dismissed' | 'confirmed';

export interface ReviewFlag {
  field: string;
  reason: string;
  severity: 'warning' | 'error';
}

export interface ReceiptLineItemDTO {
  id?: string;
  itemName: string;
  quantity?: number | null;
  unit?: string | null;
  unitPricePaise?: number | null;
  lineTotalPaise?: number | null;
  categoryId?: string | null;
  categoryName?: string | null;
}

export interface DuplicateCandidateDTO {
  id: string;
  candidateReceiptId: string;
  candidateReceipt?: {
    id: string;
    vendorName: string | null;
    receiptDate: string | null;
    totalAmountPaise: number | null;
    status: string;
    originalFilename: string;
  };
  similarityScore: number;
  matchReasons: string[];
  reviewStatus: DuplicateReviewStatus;
  createdAt: string;
}

export interface ReceiptDTO {
  id: string;
  businessId: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  vendorName: string | null;
  receiptDate: string | null;
  subtotalPaise: number | null;
  taxAmountPaise: number | null;
  totalAmountPaise: number | null;
  currencyCode: string;
  status: ReceiptStatus;
  fieldConfidence?: Record<string, number> | null;
  reviewFlags: ReviewFlag[];
  extractionNotes?: string | null;
  duplicateStatus: DuplicateStatus;
  duplicateOfReceiptId?: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  lineItems: ReceiptLineItemDTO[];
  duplicateCandidates?: DuplicateCandidateDTO[];
}

export interface CategoryDTO {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Analytics and summary DTOs
export interface CategorySpendingDTO {
  categoryId: string;
  categoryName: string;
  totalPaise: number;
  receiptCount: number;
  receiptIds: string[];
}

export interface VendorSpendingDTO {
  vendorName: string;
  totalPaise: number;
  receiptCount: number;
  receiptIds: string[];
}

export interface AnalyticsSummaryDTO {
  totalSpendingPaise: number;
  confirmedReceiptCount: number;
  draftCount: number;
  needsReviewCount: number;
  duplicateCount: number;
  startDate: string | null;
  endDate: string | null;
  currencyCode: string;
  categoryBreakdown: CategorySpendingDTO[];
  vendorBreakdown: VendorSpendingDTO[];
  supportingReceiptIds: string[];
}

export interface NaturalLanguageQueryResultDTO {
  question: string;
  answer: string;
  intent: string;
  data: {
    amountPaise?: number;
    amountFormatted?: string;
    currency: string;
    category?: string;
    vendor?: string;
    receiptCount: number;
    receiptIds: string[];
    dateRange?: {
      startDate: string | null;
      endDate: string | null;
    };
    breakdown?: Array<{
      label: string;
      amountPaise: number;
      amountFormatted: string;
      count: number;
    }>;
  };
  limitations?: string[];
}
