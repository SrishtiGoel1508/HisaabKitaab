import { prisma } from '../utils/prisma.js';
import { ReceiptDTO, ReviewFlag } from '../../shared/types/receipt.js';
import { UpdateReceiptInput } from '../../shared/schemas/receipt.js';
import { receiptValidationService } from '../services/receiptValidationService.js';
import { duplicateDetectionService } from '../services/duplicateDetectionService.js';

export interface CreateReceiptParams {
  businessId: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  vendorName?: string | null;
  receiptDate?: string | null;
  subtotalPaise?: number | null;
  taxAmountPaise?: number | null;
  totalAmountPaise?: number | null;
  currencyCode?: string;
  status?: string;
  fieldConfidence?: Record<string, number> | null;
  reviewFlags?: ReviewFlag[];
  extractionNotes?: string | null;
  lineItems?: Array<{
    itemName: string;
    quantity?: number | null;
    unit?: string | null;
    unitPricePaise?: number | null;
    lineTotalPaise?: number | null;
    categoryId?: string | null;
  }>;
}

export class ReceiptRepository {
  /**
   * Helper to format Prisma receipt model to DTO.
   */
  public toDTO(receipt: any): ReceiptDTO {
    let reviewFlags: ReviewFlag[] = [];
    if (receipt.reviewFlags) {
      try {
        reviewFlags = JSON.parse(receipt.reviewFlags);
      } catch {
        reviewFlags = [];
      }
    }

    let fieldConfidence = null;
    if (receipt.fieldConfidence) {
      try {
        fieldConfidence = JSON.parse(receipt.fieldConfidence);
      } catch {
        fieldConfidence = null;
      }
    }

    return {
      id: receipt.id,
      businessId: receipt.businessId,
      originalFilename: receipt.originalFilename,
      storageKey: receipt.storageKey,
      mimeType: receipt.mimeType,
      fileSize: receipt.fileSize,
      fileHash: receipt.fileHash,
      vendorName: receipt.vendorName,
      receiptDate: receipt.receiptDate,
      subtotalPaise: receipt.subtotalPaise,
      taxAmountPaise: receipt.taxAmountPaise,
      totalAmountPaise: receipt.totalAmountPaise,
      currencyCode: receipt.currencyCode,
      status: receipt.status as any,
      fieldConfidence,
      reviewFlags,
      extractionNotes: receipt.extractionNotes,
      duplicateStatus: receipt.duplicateStatus as any,
      duplicateOfReceiptId: receipt.duplicateOfReceiptId,
      createdAt: receipt.createdAt.toISOString(),
      updatedAt: receipt.updatedAt.toISOString(),
      confirmedAt: receipt.confirmedAt ? receipt.confirmedAt.toISOString() : null,
      lineItems: (receipt.lineItems || []).map((item: any) => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPricePaise: item.unitPricePaise,
        lineTotalPaise: item.lineTotalPaise,
        categoryId: item.categoryId,
        categoryName: item.category?.name || null,
      })),
      duplicateCandidates: (receipt.candidateDuplicates || []).map((c: any) => {
        let matchReasons: string[] = [];
        try {
          matchReasons = JSON.parse(c.matchReasons);
        } catch {
          matchReasons = [c.matchReasons];
        }
        return {
          id: c.id,
          candidateReceiptId: c.candidateReceiptId,
          similarityScore: c.similarityScore,
          matchReasons,
          reviewStatus: c.reviewStatus,
          createdAt: c.createdAt.toISOString(),
          candidateReceipt: c.candidateReceipt
            ? {
                id: c.candidateReceipt.id,
                vendorName: c.candidateReceipt.vendorName,
                receiptDate: c.candidateReceipt.receiptDate,
                totalAmountPaise: c.candidateReceipt.totalAmountPaise,
                status: c.candidateReceipt.status,
                originalFilename: c.candidateReceipt.originalFilename,
              }
            : undefined,
        };
      }),
    };
  }

  /**
   * Transactional receipt creation with line items.
   */
  public async createReceipt(params: CreateReceiptParams): Promise<ReceiptDTO> {
    const { lineItems = [], ...receiptData } = params;

    const created = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          businessId: receiptData.businessId,
          originalFilename: receiptData.originalFilename,
          storageKey: receiptData.storageKey,
          mimeType: receiptData.mimeType,
          fileSize: receiptData.fileSize,
          fileHash: receiptData.fileHash,
          vendorName: receiptData.vendorName || null,
          receiptDate: receiptData.receiptDate || null,
          subtotalPaise: receiptData.subtotalPaise ?? null,
          taxAmountPaise: receiptData.taxAmountPaise ?? null,
          totalAmountPaise: receiptData.totalAmountPaise ?? null,
          currencyCode: receiptData.currencyCode || 'INR',
          status: receiptData.status || 'draft',
          fieldConfidence: receiptData.fieldConfidence ? JSON.stringify(receiptData.fieldConfidence) : null,
          reviewFlags: receiptData.reviewFlags ? JSON.stringify(receiptData.reviewFlags) : null,
          extractionNotes: receiptData.extractionNotes || null,
          lineItems: {
            create: lineItems.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity ?? null,
              unit: item.unit ?? null,
              unitPricePaise: item.unitPricePaise ?? null,
              lineTotalPaise: item.lineTotalPaise ?? null,
              categoryId: item.categoryId ?? null,
            })),
          },
        },
        include: {
          lineItems: {
            include: { category: true },
          },
          candidateDuplicates: {
            include: { candidateReceipt: true },
          },
        },
      });

      return receipt;
    });

    return this.toDTO(created);
  }

  /**
   * Finds receipt by ID with line items and duplicate candidate relations.
   */
  public async findById(id: string): Promise<ReceiptDTO | null> {
    const receipt = await prisma.receipt.findFirst({
      where: { id, deletedAt: null },
      include: {
        lineItems: {
          include: { category: true },
        },
        candidateDuplicates: {
          include: { candidateReceipt: true },
        },
      },
    });

    if (!receipt) return null;
    return this.toDTO(receipt);
  }

  /**
   * Lists receipts with filtering and pagination.
   */
  public async listReceipts(
    businessId: string,
    filters: {
      status?: string;
      vendor?: string;
      startDate?: string;
      endDate?: string;
      duplicateStatus?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const where: any = {
      businessId,
      deletedAt: null,
    };

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters.vendor && filters.vendor.trim()) {
      where.vendorName = {
        contains: filters.vendor.trim(),
      };
    }

    if (filters.duplicateStatus && filters.duplicateStatus !== 'all') {
      where.duplicateStatus = filters.duplicateStatus;
    }

    if (filters.startDate || filters.endDate) {
      where.receiptDate = {};
      if (filters.startDate) where.receiptDate.gte = filters.startDate;
      if (filters.endDate) where.receiptDate.lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.receipt.count({ where }),
      prisma.receipt.findMany({
        where,
        include: {
          lineItems: {
            include: { category: true },
          },
          candidateDuplicates: {
            include: { candidateReceipt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: items.map((i) => this.toDTO(i)),
    };
  }

  /**
   * Updates receipt fields and line items transactionally.
   * If a confirmed receipt is materially edited, it resets status to draft or needs_review.
   */
  public async updateReceipt(id: string, input: UpdateReceiptInput): Promise<ReceiptDTO> {
    const existing = await prisma.receipt.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Receipt not found: ${id}`);
    }

    // Run deterministic validation on the updated input
    const validation = receiptValidationService.validateReceipt({
      vendorName: input.vendorName !== undefined ? input.vendorName : existing.vendorName,
      receiptDate: input.receiptDate !== undefined ? input.receiptDate : existing.receiptDate,
      currencyCode: input.currencyCode || existing.currencyCode,
      totalAmountPaise: input.totalAmountPaise !== undefined ? input.totalAmountPaise : existing.totalAmountPaise,
      subtotalPaise: input.subtotalPaise !== undefined ? input.subtotalPaise : existing.subtotalPaise,
      taxAmountPaise: input.taxAmountPaise !== undefined ? input.taxAmountPaise : existing.taxAmountPaise,
      lineItems: input.lineItems || existing.lineItems.map((li) => ({
        itemName: li.itemName,
        lineTotalPaise: li.lineTotalPaise,
        quantity: li.quantity,
        unitPricePaise: li.unitPricePaise,
        categoryId: li.categoryId,
      })),
    });

    // Determine status transition rule (Section 11: Material edits invalidate prior confirmation)
    let newStatus = validation.computedStatus;
    let confirmedAt = existing.confirmedAt;

    if (existing.status === 'confirmed') {
      const isMaterialChange =
        (input.vendorName !== undefined && input.vendorName !== existing.vendorName) ||
        (input.receiptDate !== undefined && input.receiptDate !== existing.receiptDate) ||
        (input.totalAmountPaise !== undefined && input.totalAmountPaise !== existing.totalAmountPaise) ||
        input.lineItems !== undefined;

      if (isMaterialChange) {
        newStatus = validation.hasBlockingErrors ? 'needs_review' : 'draft';
        confirmedAt = null; // Reconfirmation required
      } else {
        newStatus = 'confirmed';
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If line items supplied, replace existing line items
      if (input.lineItems) {
        await tx.receiptLineItem.deleteMany({
          where: { receiptId: id },
        });

        await tx.receiptLineItem.createMany({
          data: input.lineItems.map((item) => ({
            receiptId: id,
            itemName: item.itemName,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            unitPricePaise: item.unitPricePaise ?? null,
            lineTotalPaise: item.lineTotalPaise ?? null,
            categoryId: item.categoryId ?? null,
          })),
        });
      }

      const receipt = await tx.receipt.update({
        where: { id },
        data: {
          vendorName: input.vendorName !== undefined ? input.vendorName : existing.vendorName,
          receiptDate: input.receiptDate !== undefined ? input.receiptDate : existing.receiptDate,
          subtotalPaise: input.subtotalPaise !== undefined ? input.subtotalPaise : existing.subtotalPaise,
          taxAmountPaise: input.taxAmountPaise !== undefined ? input.taxAmountPaise : existing.taxAmountPaise,
          totalAmountPaise: input.totalAmountPaise !== undefined ? input.totalAmountPaise : existing.totalAmountPaise,
          currencyCode: input.currencyCode || existing.currencyCode,
          status: newStatus,
          confirmedAt,
          reviewFlags: JSON.stringify(validation.flags),
        },
        include: {
          lineItems: {
            include: { category: true },
          },
          candidateDuplicates: {
            include: { candidateReceipt: true },
          },
        },
      });

      return receipt;
    });

    return this.toDTO(updated);
  }

  /**
   * Explicitly confirms an eligible receipt.
   * Enforces Section 11: dedicated confirmation endpoint, strict precondition checks.
   */
  public async confirmReceipt(id: string): Promise<ReceiptDTO> {
    const existing = await prisma.receipt.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Receipt not found: ${id}`);
    }

    const check = receiptValidationService.canConfirm({
      vendorName: existing.vendorName,
      receiptDate: existing.receiptDate,
      totalAmountPaise: existing.totalAmountPaise,
      currencyCode: existing.currencyCode,
      lineItems: existing.lineItems.map((li) => ({
        itemName: li.itemName,
        lineTotalPaise: li.lineTotalPaise,
      })),
    });

    if (!check.eligible) {
      throw new Error(`Cannot confirm receipt: ${check.blockers.join('; ')}`);
    }

    const confirmed = await prisma.receipt.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
      include: {
        lineItems: {
          include: { category: true },
        },
        candidateDuplicates: {
          include: { candidateReceipt: true },
        },
      },
    });

    return this.toDTO(confirmed);
  }

  /**
   * Soft deletes a receipt.
   */
  public async deleteReceipt(id: string): Promise<boolean> {
    const existing = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!existing) return false;

    await prisma.receipt.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }
}

export const receiptRepository = new ReceiptRepository();
