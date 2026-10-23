import { prisma } from '../utils/prisma.js';
import { paiseToInr } from '../utils/currency.js';
import { DateFilterOptions } from './analyticsService.js';

export class CsvExportService {
  /**
   * Sanitizes a cell value to prevent CSV Formula Injection attacks.
   * If a value begins with =, +, -, @, \t, or \r, prefix with a single quote.
   */
  public sanitizeCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    let str = String(value);

    // Formula injection triggers: =, +, -, @, \t, \r
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }

    // RFC 4180 Escaping: if contains comma, quote, or newline, wrap in quotes and escape quotes
    if (/[",\n\r]/.test(str)) {
      str = `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * Generates CSV string for confirmed receipts belonging to businessId.
   */
  public async generateConfirmedReceiptsCsv(
    businessId: string,
    options: DateFilterOptions = {}
  ): Promise<string> {
    const dateClause: any = {};
    if (options.startDate) {
      dateClause.gte = options.startDate;
    }
    if (options.endDate) {
      dateClause.lte = options.endDate;
    }

    const receiptDateFilter = Object.keys(dateClause).length > 0 ? { receiptDate: dateClause } : {};

    const receipts = await prisma.receipt.findMany({
      where: {
        businessId,
        status: 'confirmed',
        deletedAt: null,
        ...receiptDateFilter,
      },
      include: {
        lineItems: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { receiptDate: 'asc' },
    });

    const headers = [
      'receipt_id',
      'receipt_date',
      'vendor_name',
      'item_name',
      'quantity',
      'unit',
      'unit_price_inr',
      'line_total_inr',
      'category',
      'receipt_total_inr',
      'currency_code',
      'status',
    ];

    const rows: string[] = [];
    rows.push(headers.join(','));

    for (const r of receipts) {
      const receiptTotalInr = paiseToInr(r.totalAmountPaise)?.toFixed(2) || '0.00';

      if (r.lineItems && r.lineItems.length > 0) {
        for (const item of r.lineItems) {
          const unitPriceInr = item.unitPricePaise ? paiseToInr(item.unitPricePaise)?.toFixed(2) : '';
          const lineTotalInr = item.lineTotalPaise ? paiseToInr(item.lineTotalPaise)?.toFixed(2) : '';
          const categoryName = item.category?.name || 'Uncategorized';

          const rowValues = [
            r.id,
            r.receiptDate || '',
            r.vendorName || '',
            item.itemName || '',
            item.quantity ?? '',
            item.unit || '',
            unitPriceInr,
            lineTotalInr,
            categoryName,
            receiptTotalInr,
            r.currencyCode,
            r.status,
          ];

          rows.push(rowValues.map((v) => this.sanitizeCellValue(v)).join(','));
        }
      } else {
        // Receipt without line items
        const rowValues = [
          r.id,
          r.receiptDate || '',
          r.vendorName || '',
          'All Items (Summary)',
          '',
          '',
          '',
          receiptTotalInr,
          'Uncategorized',
          receiptTotalInr,
          r.currencyCode,
          r.status,
        ];
        rows.push(rowValues.map((v) => this.sanitizeCellValue(v)).join(','));
      }
    }

    return rows.join('\r\n');
  }
}

export const csvExportService = new CsvExportService();
