import { describe, it, expect } from 'vitest';
import { receiptValidationService } from '../../src/server/services/receiptValidationService.js';

describe('Receipt Validation Service', () => {
  it('flags missing vendor as a warning and sets needs_review', () => {
    const res = receiptValidationService.validateReceipt({
      vendorName: null,
      receiptDate: '2026-10-15',
      totalAmountPaise: 10000,
    });

    expect(res.flags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'vendorName',
          severity: 'warning',
        }),
      ])
    );
    expect(res.computedStatus).toBe('needs_review');
  });

  it('flags missing or malformed receipt date', () => {
    const missingDateRes = receiptValidationService.validateReceipt({
      vendorName: 'Amul Wholesaler',
      receiptDate: null,
      totalAmountPaise: 5000,
    });
    expect(missingDateRes.flags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'receiptDate',
          reason: 'Receipt date is missing or unreadable',
        }),
      ])
    );

    const badDateRes = receiptValidationService.validateReceipt({
      vendorName: 'Amul Wholesaler',
      receiptDate: '15-10-2026', // wrong format, expects YYYY-MM-DD
      totalAmountPaise: 5000,
    });
    expect(badDateRes.flags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'receiptDate',
          severity: 'error',
        }),
      ])
    );
  });

  it('detects and flags arithmetic discrepancy between line items and total', () => {
    const res = receiptValidationService.validateReceipt({
      vendorName: 'Laxmi Traders',
      receiptDate: '2026-10-15',
      totalAmountPaise: 50000, // ₹500.00
      lineItems: [
        { itemName: 'Item A', lineTotalPaise: 20000 },
        { itemName: 'Item B', lineTotalPaise: 25000 }, // sum = 45000, diff = 5000
      ],
    });

    expect(res.discrepancyPaise).toBe(5000);
    expect(res.flags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'totalAmountPaise',
          severity: 'warning',
        }),
      ])
    );
    expect(res.computedStatus).toBe('needs_review');
  });

  it('blocks confirmation when critical fields are missing or unreconciled', () => {
    const invalidCheck = receiptValidationService.canConfirm({
      vendorName: '',
      receiptDate: '2026-10-15',
      totalAmountPaise: null,
    });
    expect(invalidCheck.eligible).toBe(false);
    expect(invalidCheck.blockers.length).toBeGreaterThan(0);

    const validCheck = receiptValidationService.canConfirm({
      vendorName: 'Valid Kirana Vendor',
      receiptDate: '2026-10-15',
      totalAmountPaise: 20000,
      lineItems: [{ itemName: 'Item 1', lineTotalPaise: 20000 }],
    });
    expect(validCheck.eligible).toBe(true);
    expect(validCheck.blockers.length).toBe(0);
  });
});
