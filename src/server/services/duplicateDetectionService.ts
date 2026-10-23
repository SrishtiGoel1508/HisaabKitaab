import { prisma } from '../utils/prisma.js';
import { formatINR } from '../utils/currency.js';

export interface DuplicateCheckInput {
  receiptId: string;
  businessId: string;
  fileHash: string;
  vendorName?: string | null;
  receiptDate?: string | null;
  totalAmountPaise?: number | null;
}

export interface DetectedDuplicateMatch {
  candidateReceiptId: string;
  similarityScore: number;
  matchReasons: string[];
}

export class DuplicateDetectionService {
  /**
   * Normalizes vendor names for comparison (lowercase, remove punctuation, whitespace, suffixes like pvt ltd, store, kirana).
   */
  public normalizeVendor(name?: string | null): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\b(pvt|ltd|limited|store|general|kirana|traders|agency|agencies|enterprises)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Simple Levenshtein distance based similarity between two strings (0.0 to 1.0).
   */
  public stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;
    if (!s1.length || !s2.length) return 0.0;

    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);
    return Math.max(0, 1 - distance / maxLength);
  }

  /**
   * Scans existing receipts in the business to detect potential duplicates of the given receipt.
   */
  public async detectDuplicates(input: DuplicateCheckInput): Promise<DetectedDuplicateMatch[]> {
    const { receiptId, businessId, fileHash, vendorName, receiptDate, totalAmountPaise } = input;

    // Fetch existing receipts (excluding the receipt itself, and excluding deleted receipts)
    const existingReceipts = await prisma.receipt.findMany({
      where: {
        businessId,
        id: { not: receiptId },
        deletedAt: null,
      },
      select: {
        id: true,
        fileHash: true,
        vendorName: true,
        receiptDate: true,
        totalAmountPaise: true,
        originalFilename: true,
        createdAt: true,
      },
    });

    const matches: DetectedDuplicateMatch[] = [];
    const normInputVendor = this.normalizeVendor(vendorName);

    for (const other of existingReceipts) {
      const reasons: string[] = [];
      let score = 0.0;

      // Level 1: Exact File SHA-256 Hash Match
      if (fileHash && other.fileHash && fileHash === other.fileHash) {
        reasons.push('Identical receipt document (exact SHA-256 file hash match)');
        score = 1.0;
      }

      // Level 2: Exact Metadata Match (Vendor, Date, Total)
      const normOtherVendor = this.normalizeVendor(other.vendorName);
      const vendorsMatch =
        normInputVendor && normOtherVendor && normInputVendor === normOtherVendor;
      const datesMatch = receiptDate && other.receiptDate && receiptDate === other.receiptDate;
      const totalsMatch =
        totalAmountPaise !== null &&
        totalAmountPaise !== undefined &&
        other.totalAmountPaise !== null &&
        other.totalAmountPaise !== undefined &&
        totalAmountPaise === other.totalAmountPaise;

      if (vendorsMatch && datesMatch && totalsMatch) {
        reasons.push(
          `Matching vendor ("${other.vendorName}"), date (${other.receiptDate}), and total amount (${formatINR(other.totalAmountPaise)})`
        );
        score = Math.max(score, 0.95);
      } else if (datesMatch && totalsMatch) {
        // Same date and exact total, but vendor could be slightly misspelled
        const vendorSim = normInputVendor && normOtherVendor
          ? this.stringSimilarity(normInputVendor, normOtherVendor)
          : 0;

        if (vendorSim > 0.6) {
          reasons.push(
            `Same date (${other.receiptDate}) and total (${formatINR(other.totalAmountPaise)}) with similar vendor ("${other.vendorName}" ~ "${vendorName}")`
          );
          score = Math.max(score, 0.85);
        } else {
          reasons.push(
            `Identical date (${other.receiptDate}) and amount (${formatINR(other.totalAmountPaise)}) from different vendor ("${other.vendorName || 'Unknown'}")`
          );
          score = Math.max(score, 0.70);
        }
      } else if (vendorsMatch && totalsMatch) {
        // Same vendor and total, check if dates are close (within 3 days)
        if (receiptDate && other.receiptDate) {
          const d1 = new Date(receiptDate).getTime();
          const d2 = new Date(other.receiptDate).getTime();
          const dayDiff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
          if (dayDiff <= 3) {
            reasons.push(
              `Same vendor ("${other.vendorName}") and total (${formatINR(other.totalAmountPaise)}) with dates only ${Math.round(dayDiff)} day(s) apart`
            );
            score = Math.max(score, 0.80);
          }
        }
      }

      if (reasons.length > 0) {
        matches.push({
          candidateReceiptId: other.id,
          similarityScore: score,
          matchReasons: reasons,
        });
      }
    }

    return matches;
  }

  /**
   * Persists duplicate candidates into the database in a transactional, idempotent manner.
   */
  public async recordDuplicateCandidates(
    receiptId: string,
    matches: DetectedDuplicateMatch[]
  ): Promise<void> {
    if (!matches.length) return;

    for (const match of matches) {
      try {
        await prisma.duplicateCandidate.upsert({
          where: {
            receiptId_candidateReceiptId: {
              receiptId,
              candidateReceiptId: match.candidateReceiptId,
            },
          },
          update: {
            similarityScore: match.similarityScore,
            matchReasons: JSON.stringify(match.matchReasons),
          },
          create: {
            receiptId,
            candidateReceiptId: match.candidateReceiptId,
            similarityScore: match.similarityScore,
            matchReasons: JSON.stringify(match.matchReasons),
            reviewStatus: 'pending',
          },
        });
      } catch (err) {
        console.warn(`Failed to insert duplicate candidate ${receiptId} -> ${match.candidateReceiptId}:`, err);
      }
    }

    // Update receipt's duplicateStatus to 'suspected' if not already confirmed or dismissed
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { duplicateStatus: 'suspected' },
    });
  }

  /**
   * Dismisses a duplicate candidate pair as a false positive.
   */
  public async dismissCandidate(candidateId: string): Promise<boolean> {
    const candidate = await prisma.duplicateCandidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) return false;

    await prisma.duplicateCandidate.update({
      where: { id: candidateId },
      data: {
        reviewStatus: 'dismissed',
        reviewedAt: new Date(),
      },
    });

    // Check if receipt has any other pending candidates
    const remainingPending = await prisma.duplicateCandidate.count({
      where: {
        receiptId: candidate.receiptId,
        reviewStatus: 'pending',
      },
    });

    if (remainingPending === 0) {
      await prisma.receipt.update({
        where: { id: candidate.receiptId },
        data: { duplicateStatus: 'dismissed' },
      });
    }

    return true;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
