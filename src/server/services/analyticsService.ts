import { prisma } from '../utils/prisma.js';
import { sumPaise, formatINR } from '../utils/currency.js';
import { AnalyticsSummaryDTO, CategorySpendingDTO, VendorSpendingDTO } from '../../shared/types/receipt.js';

export interface DateFilterOptions {
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null;   // YYYY-MM-DD
  preset?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'all';
}

export class AnalyticsService {
  /**
   * Resolves preset date filters to start/end YYYY-MM-DD bounds.
   */
  public resolveDateRange(options: DateFilterOptions): { startDate: string | null; endDate: string | null } {
    if (options.startDate || options.endDate) {
      return {
        startDate: options.startDate || null,
        endDate: options.endDate || null,
      };
    }

    const now = new Date();
    const toYMD = (d: Date) => d.toISOString().slice(0, 10);

    if (options.preset === 'today') {
      const today = toYMD(now);
      return { startDate: today, endDate: today };
    }

    if (options.preset === 'this_week') {
      // Start of week (Monday)
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return { startDate: toYMD(monday), endDate: toYMD(now) };
    }

    if (options.preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toYMD(startOfMonth), endDate: toYMD(now) };
    }

    if (options.preset === 'last_month') {
      const startOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLast = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toYMD(startOfLast), endDate: toYMD(endOfLast) };
    }

    return { startDate: null, endDate: null };
  }

  /**
   * Computes authoritative financial analytics from eligible confirmed receipts only.
   */
  public async getSummary(
    businessId: string,
    options: DateFilterOptions = {}
  ): Promise<AnalyticsSummaryDTO> {
    const { startDate, endDate } = this.resolveDateRange(options);

    // Build date filter clause
    const dateClause: any = {};
    if (startDate) {
      dateClause.gte = startDate;
    }
    if (endDate) {
      dateClause.lte = endDate;
    }

    const receiptDateFilter = Object.keys(dateClause).length > 0 ? { receiptDate: dateClause } : {};

    // 1. Fetch ALL eligible confirmed receipts
    const confirmedReceipts = await prisma.receipt.findMany({
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
      orderBy: { receiptDate: 'desc' },
    });

    // 2. Counts for other statuses (for dashboard KPIs)
    const [draftCount, needsReviewCount, duplicateCount] = await Promise.all([
      prisma.receipt.count({
        where: { businessId, status: 'draft', deletedAt: null },
      }),
      prisma.receipt.count({
        where: { businessId, status: 'needs_review', deletedAt: null },
      }),
      prisma.duplicateCandidate.count({
        where: {
          receipt: { businessId, deletedAt: null },
          reviewStatus: 'pending',
        },
      }),
    ]);

    // 3. Deterministic calculation of total confirmed spending
    const totalPaise = sumPaise(confirmedReceipts.map((r) => r.totalAmountPaise));
    const supportingReceiptIds = confirmedReceipts.map((r) => r.id);

    // 4. Category-wise Breakdown (Aggregating from confirmed line items)
    const categoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; totalPaise: number; receiptIds: Set<string> }
    >();

    for (const receipt of confirmedReceipts) {
      if (receipt.lineItems && receipt.lineItems.length > 0) {
        for (const item of receipt.lineItems) {
          const catId = item.categoryId || 'uncategorized';
          const catName = item.category?.name || 'Uncategorized';
          const itemPaise = item.lineTotalPaise ?? 0;

          const existing = categoryMap.get(catId) || {
            categoryId: catId,
            categoryName: catName,
            totalPaise: 0,
            receiptIds: new Set<string>(),
          };

          existing.totalPaise = sumPaise([existing.totalPaise, itemPaise]);
          existing.receiptIds.add(receipt.id);
          categoryMap.set(catId, existing);
        }
      } else {
        // Fallback for confirmed receipt without individual items: allocate to Uncategorized
        const catId = 'uncategorized';
        const existing = categoryMap.get(catId) || {
          categoryId: catId,
          categoryName: 'Uncategorized',
          totalPaise: 0,
          receiptIds: new Set<string>(),
        };
        existing.totalPaise = sumPaise([existing.totalPaise, receipt.totalAmountPaise ?? 0]);
        existing.receiptIds.add(receipt.id);
        categoryMap.set(catId, existing);
      }
    }

    const categoryBreakdown: CategorySpendingDTO[] = Array.from(categoryMap.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        totalPaise: c.totalPaise,
        receiptCount: c.receiptIds.size,
        receiptIds: Array.from(c.receiptIds),
      }))
      .sort((a, b) => b.totalPaise - a.totalPaise);

    // 5. Vendor-wise Breakdown
    const vendorMap = new Map<string, { totalPaise: number; receiptIds: Set<string> }>();

    for (const receipt of confirmedReceipts) {
      const vendor = (receipt.vendorName || 'Unknown Vendor').trim();
      const existing = vendorMap.get(vendor) || {
        totalPaise: 0,
        receiptIds: new Set<string>(),
      };
      existing.totalPaise = sumPaise([existing.totalPaise, receipt.totalAmountPaise ?? 0]);
      existing.receiptIds.add(receipt.id);
      vendorMap.set(vendor, existing);
    }

    const vendorBreakdown: VendorSpendingDTO[] = Array.from(vendorMap.entries())
      .map(([vendorName, v]) => ({
        vendorName,
        totalPaise: v.totalPaise,
        receiptCount: v.receiptIds.size,
        receiptIds: Array.from(v.receiptIds),
      }))
      .sort((a, b) => b.totalPaise - a.totalPaise);

    return {
      totalSpendingPaise: totalPaise,
      confirmedReceiptCount: confirmedReceipts.length,
      draftCount,
      needsReviewCount,
      duplicateCount,
      startDate,
      endDate,
      currencyCode: 'INR',
      categoryBreakdown,
      vendorBreakdown,
      supportingReceiptIds,
    };
  }

  /**
   * Fetches the largest confirmed purchases.
   */
  public async getLargestPurchases(businessId: string, limit: number = 5) {
    const receipts = await prisma.receipt.findMany({
      where: {
        businessId,
        status: 'confirmed',
        deletedAt: null,
      },
      orderBy: { totalAmountPaise: 'desc' },
      take: limit,
      select: {
        id: true,
        vendorName: true,
        receiptDate: true,
        totalAmountPaise: true,
        originalFilename: true,
      },
    });

    return receipts.map((r) => ({
      id: r.id,
      vendorName: r.vendorName || 'Unknown Vendor',
      receiptDate: r.receiptDate,
      totalAmountPaise: r.totalAmountPaise || 0,
      totalFormatted: formatINR(r.totalAmountPaise || 0),
    }));
  }
}

export const analyticsService = new AnalyticsService();
