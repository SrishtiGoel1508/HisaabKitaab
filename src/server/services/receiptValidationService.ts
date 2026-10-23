import { ReviewFlag, ReceiptStatus } from '../../shared/types/receipt.js';
import { sumPaise, reconcileAmounts } from '../utils/currency.js';

export interface ValidationInput {
  vendorName?: string | null;
  receiptDate?: string | null;
  currencyCode?: string | null;
  totalAmountPaise?: number | null;
  subtotalPaise?: number | null;
  taxAmountPaise?: number | null;
  lineItems?: Array<{
    itemName: string;
    lineTotalPaise?: number | null;
    quantity?: number | null;
    unitPricePaise?: number | null;
    categoryId?: string | null;
  }>;
}

export interface ValidationResult {
  flags: ReviewFlag[];
  hasBlockingErrors: boolean;
  computedStatus: ReceiptStatus;
  itemsSumPaise: number;
  discrepancyPaise: number;
}

export class ReceiptValidationService {
  /**
   * Evaluates receipt fields and line items deterministically to detect missing info or arithmetic discrepancies.
   */
  public validateReceipt(input: ValidationInput): ValidationResult {
    const flags: ReviewFlag[] = [];
    let hasBlockingErrors = false;

    // 1. Vendor check
    if (!input.vendorName || input.vendorName.trim() === '') {
      flags.push({
        field: 'vendorName',
        reason: 'Vendor or supplier name could not be identified',
        severity: 'warning',
      });
      hasBlockingErrors = true;
    }

    // 2. Receipt date check
    if (!input.receiptDate || input.receiptDate.trim() === '') {
      flags.push({
        field: 'receiptDate',
        reason: 'Receipt date is missing or unreadable',
        severity: 'warning',
      });
      hasBlockingErrors = true;
    } else {
      // Validate YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(input.receiptDate)) {
        flags.push({
          field: 'receiptDate',
          reason: 'Receipt date is not in valid YYYY-MM-DD format',
          severity: 'error',
        });
        hasBlockingErrors = true;
      } else {
        const parsed = new Date(input.receiptDate);
        if (isNaN(parsed.getTime())) {
          flags.push({
            field: 'receiptDate',
            reason: 'Receipt date is an invalid calendar date',
            severity: 'error',
          });
          hasBlockingErrors = true;
        }
      }
    }

    // 3. Currency check
    if (input.currencyCode && input.currencyCode.toUpperCase() !== 'INR') {
      flags.push({
        field: 'currencyCode',
        reason: `Unsupported currency '${input.currencyCode}'. Only INR is currently supported.`,
        severity: 'error',
      });
      hasBlockingErrors = true;
    }

    // 4. Total Amount check
    if (input.totalAmountPaise === null || input.totalAmountPaise === undefined) {
      flags.push({
        field: 'totalAmountPaise',
        reason: 'Total amount is missing or unreadable',
        severity: 'warning',
      });
      hasBlockingErrors = true;
    } else if (input.totalAmountPaise < 0) {
      flags.push({
        field: 'totalAmountPaise',
        reason: 'Total amount cannot be negative',
        severity: 'error',
      });
      hasBlockingErrors = true;
    }

    // 5. Line items check
    const items = input.lineItems || [];
    if (items.length === 0) {
      flags.push({
        field: 'lineItems',
        reason: 'No individual line items identified on the receipt',
        severity: 'warning',
      });
    }

    // 6. Arithmetic Reconciliation Check
    const itemTotals = items.map((i) => i.lineTotalPaise);
    const itemsSumPaise = sumPaise(itemTotals);
    let discrepancyPaise = 0;

    if (items.length > 0 && input.totalAmountPaise !== null && input.totalAmountPaise !== undefined) {
      const recon = reconcileAmounts(itemsSumPaise, input.totalAmountPaise);
      discrepancyPaise = recon.diffPaise;

      if (!recon.isMatch) {
        flags.push({
          field: 'totalAmountPaise',
          reason: `Sum of line items (₹${(itemsSumPaise / 100).toFixed(2)}) does not match printed total (₹${(input.totalAmountPaise / 100).toFixed(2)}). Discrepancy: ₹${(recon.diffPaise / 100).toFixed(2)}.`,
          severity: 'warning',
        });
        // Discrepancy is a warning that prevents direct confirmation until reviewed
        hasBlockingErrors = true;
      }
    }

    // Determine initial status based on validation
    const computedStatus: ReceiptStatus = hasBlockingErrors ? 'needs_review' : 'draft';

    return {
      flags,
      hasBlockingErrors,
      computedStatus,
      itemsSumPaise,
      discrepancyPaise,
    };
  }

  /**
   * Checks whether a receipt is eligible for official confirmation.
   * Section 11: "Require the vendor, receipt date, and total to be resolved before official confirmation... Require unresolved financial discrepancies to be corrected before confirmation."
   */
  public canConfirm(input: ValidationInput): { eligible: boolean; blockers: string[] } {
    const blockers: string[] = [];

    if (!input.vendorName || input.vendorName.trim() === '') {
      blockers.push('Vendor name is required for confirmation');
    }

    if (!input.receiptDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.receiptDate)) {
      blockers.push('Valid receipt date (YYYY-MM-DD) is required for confirmation');
    }

    if (input.totalAmountPaise === null || input.totalAmountPaise === undefined || input.totalAmountPaise < 0) {
      blockers.push('Valid total amount is required for confirmation');
    }

    const items = input.lineItems || [];
    if (items.length > 0 && input.totalAmountPaise !== null && input.totalAmountPaise !== undefined) {
      const itemsSumPaise = sumPaise(items.map((i) => i.lineTotalPaise));
      const recon = reconcileAmounts(itemsSumPaise, input.totalAmountPaise);
      if (!recon.isMatch) {
        blockers.push(
          `Financial discrepancy: Line items sum to ₹${(itemsSumPaise / 100).toFixed(2)} but total is ₹${(input.totalAmountPaise / 100).toFixed(2)}`
        );
      }
    }

    return {
      eligible: blockers.length === 0,
      blockers,
    };
  }
}

export const receiptValidationService = new ReceiptValidationService();
