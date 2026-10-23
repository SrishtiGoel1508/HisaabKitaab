import { prisma } from '../utils/prisma.js';
import { analyticsService } from './analyticsService.js';
import { geminiService } from './geminiService.js';
import { formatINR, sumPaise } from '../utils/currency.js';
import { NaturalLanguageQueryResultDTO } from '../../shared/types/receipt.js';

interface ParsedIntent {
  intent:
    | 'TOTAL_SPENDING'
    | 'CATEGORY_SPENDING'
    | 'TOP_CATEGORIES'
    | 'TOP_VENDORS'
    | 'VENDOR_SPENDING'
    | 'LARGEST_PURCHASES'
    | 'MONTH_COMPARISON'
    | 'UNKNOWN';
  categoryKeyword?: string;
  vendorKeyword?: string;
  timeframe?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'all';
}

export class NaturalLanguageQueryService {
  /**
   * Deterministically parses the user's question into a constrained intent and parameters.
   */
  public parseIntent(question: string): ParsedIntent {
    const q = question.toLowerCase();

    // Timeframe detection
    let timeframe: 'today' | 'this_week' | 'this_month' | 'last_month' | 'all' = 'all';
    if (q.includes('today') || q.includes('aaj')) {
      timeframe = 'today';
    } else if (q.includes('this week') || q.includes('hafta')) {
      timeframe = 'this_week';
    } else if (q.includes('this month') || q.includes('current month') || q.includes('mahina')) {
      timeframe = 'this_month';
    } else if (q.includes('last month') || q.includes('pichle')) {
      timeframe = 'last_month';
    }

    // Largest / Highest purchases
    if (q.includes('largest') || q.includes('biggest') || q.includes('highest purchase') || q.includes('most expensive')) {
      return { intent: 'LARGEST_PURCHASES', timeframe };
    }

    // Compare months
    if (q.includes('compare') || q.includes('difference between') || q.includes('versus') || q.includes('vs')) {
      return { intent: 'MONTH_COMPARISON', timeframe };
    }

    // Top categories
    if (
      (q.includes('which category') || q.includes('top category') || q.includes('most spending') || q.includes('highest spending')) &&
      !q.includes('vendor')
    ) {
      return { intent: 'TOP_CATEGORIES', timeframe };
    }

    // Top vendors
    if (q.includes('which vendor') || q.includes('top vendor') || q.includes('frequently') || q.includes('most purchase from')) {
      return { intent: 'TOP_VENDORS', timeframe };
    }

    // Specific category spending check
    const categoryKeywords = [
      'dairy', 'milk', 'doodh',
      'inventory', 'stock', 'staples',
      'packaging', 'bags',
      'cleaning', 'soap', 'detergent',
      'personal care',
      'packaged goods', 'snacks', 'biscuits',
      'food', 'beverage', 'drinks',
      'utilities', 'electricity',
      'transport',
    ];

    for (const kw of categoryKeywords) {
      if (q.includes(kw)) {
        return { intent: 'CATEGORY_SPENDING', categoryKeyword: kw, timeframe };
      }
    }

    // Total spending
    if (q.includes('how much') || q.includes('total spend') || q.includes('total expense') || q.includes('spend') || q.includes('kharcha')) {
      return { intent: 'TOTAL_SPENDING', timeframe };
    }

    return { intent: 'TOTAL_SPENDING', timeframe };
  }

  /**
   * Executes deterministic query pipeline and synthesizes with Gemini.
   */
  public async handleQuery(
    businessId: string,
    question: string,
    customStartDate?: string,
    customEndDate?: string
  ): Promise<NaturalLanguageQueryResultDTO> {
    const parsed = this.parseIntent(question);
    const dateOptions = {
      startDate: customStartDate,
      endDate: customEndDate,
      preset: customStartDate ? undefined : parsed.timeframe,
    };

    const summary = await analyticsService.getSummary(businessId, dateOptions);

    let answerData: Record<string, any> = {};
    const limitations: string[] = [];

    switch (parsed.intent) {
      case 'CATEGORY_SPENDING': {
        const kw = parsed.categoryKeyword || '';
        // Find matching categories in breakdown
        const matches = summary.categoryBreakdown.filter(
          (c) =>
            c.categoryName.toLowerCase().includes(kw) ||
            kw.includes(c.categoryName.toLowerCase())
        );

        const totalCategoryPaise = sumPaise(matches.map((m) => m.totalPaise));
        const allReceiptIds = Array.from(new Set(matches.flatMap((m) => m.receiptIds)));

        answerData = {
          amountPaise: totalCategoryPaise,
          amountFormatted: formatINR(totalCategoryPaise),
          currency: 'INR',
          category: matches.map((m) => m.categoryName).join(', ') || kw,
          receiptCount: allReceiptIds.length,
          receiptIds: allReceiptIds,
          dateRange: {
            startDate: summary.startDate,
            endDate: summary.endDate,
          },
        };
        break;
      }

      case 'TOP_CATEGORIES': {
        const top3 = summary.categoryBreakdown.slice(0, 3).map((c) => ({
          label: c.categoryName,
          amountPaise: c.totalPaise,
          amountFormatted: formatINR(c.totalPaise),
          count: c.receiptCount,
        }));

        answerData = {
          amountPaise: summary.categoryBreakdown[0]?.totalPaise || 0,
          amountFormatted: formatINR(summary.categoryBreakdown[0]?.totalPaise || 0),
          currency: 'INR',
          category: summary.categoryBreakdown[0]?.categoryName || 'None',
          breakdown: top3,
          receiptCount: summary.confirmedReceiptCount,
          receiptIds: summary.supportingReceiptIds,
          dateRange: {
            startDate: summary.startDate,
            endDate: summary.endDate,
          },
        };
        break;
      }

      case 'TOP_VENDORS': {
        const top3 = summary.vendorBreakdown.slice(0, 3).map((v) => ({
          label: v.vendorName,
          amountPaise: v.totalPaise,
          amountFormatted: formatINR(v.totalPaise),
          count: v.receiptCount,
        }));

        answerData = {
          amountPaise: summary.vendorBreakdown[0]?.totalPaise || 0,
          amountFormatted: formatINR(summary.vendorBreakdown[0]?.totalPaise || 0),
          currency: 'INR',
          vendor: summary.vendorBreakdown[0]?.vendorName || 'None',
          breakdown: top3,
          receiptCount: summary.confirmedReceiptCount,
          receiptIds: summary.supportingReceiptIds,
          dateRange: {
            startDate: summary.startDate,
            endDate: summary.endDate,
          },
        };
        break;
      }

      case 'LARGEST_PURCHASES': {
        const largest = await analyticsService.getLargestPurchases(businessId, 5);
        const topItem = largest[0];

        answerData = {
          amountPaise: topItem?.totalAmountPaise || 0,
          amountFormatted: topItem?.totalFormatted || '₹0.00',
          currency: 'INR',
          vendor: topItem?.vendorName,
          breakdown: largest.map((l) => ({
            label: `${l.vendorName} (${l.receiptDate})`,
            amountPaise: l.totalAmountPaise,
            amountFormatted: l.totalFormatted,
            count: 1,
          })),
          receiptCount: largest.length,
          receiptIds: largest.map((l) => l.id),
        };
        break;
      }

      case 'TOTAL_SPENDING':
      default: {
        answerData = {
          amountPaise: summary.totalSpendingPaise,
          amountFormatted: formatINR(summary.totalSpendingPaise),
          currency: 'INR',
          receiptCount: summary.confirmedReceiptCount,
          receiptIds: summary.supportingReceiptIds,
          dateRange: {
            startDate: summary.startDate,
            endDate: summary.endDate,
          },
        };
        break;
      }
    }

    if (summary.confirmedReceiptCount === 0) {
      limitations.push('No confirmed receipts found in the specified date range.');
    }

    // Call Gemini with verified data for natural language explanation
    const aiExplanation = await geminiService.explainFinancialQuery(
      question,
      parsed.intent,
      answerData
    );

    return {
      question,
      answer: aiExplanation,
      intent: parsed.intent,
      data: {
        amountPaise: answerData.amountPaise,
        amountFormatted: answerData.amountFormatted,
        currency: answerData.currency || 'INR',
        category: answerData.category,
        vendor: answerData.vendor,
        receiptCount: answerData.receiptCount ?? 0,
        receiptIds: answerData.receiptIds ?? [],
        dateRange: answerData.dateRange,
        breakdown: answerData.breakdown,
      },
      limitations: limitations.length > 0 ? limitations : undefined,
    };
  }
}

export const naturalLanguageQueryService = new NaturalLanguageQueryService();
