import { Request, Response } from 'express';
import { storageService } from '../services/storageService.js';
import { geminiService } from '../services/geminiService.js';
import { receiptValidationService } from '../services/receiptValidationService.js';
import { categorisationService } from '../services/categorisationService.js';
import { duplicateDetectionService } from '../services/duplicateDetectionService.js';
import { receiptRepository } from '../repositories/receiptRepository.js';
import { config } from '../config/index.js';
import { inrToPaise } from '../utils/currency.js';
import { UpdateReceiptSchema, ReceiptFilterSchema } from '../../shared/schemas/receipt.js';
import { ReviewFlag } from '../../shared/types/receipt.js';

export class ReceiptController {
  /**
   * POST /api/v1/receipts/upload
   * Handles multipart upload, saves file, extracts data with Gemini, validates, detects duplicates.
   */
  public async uploadReceipt(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No receipt file provided in request' });
        return;
      }

      const file = req.file;
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;

      // 1. Save file to persistent storage
      const stored = await storageService.saveFile(file.buffer, file.originalname, file.mimetype);

      // 2. Create initial recoverable draft record
      let receipt = await receiptRepository.createReceipt({
        businessId,
        originalFilename: stored.originalFilename,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        fileHash: stored.fileHash,
        status: 'draft',
      });

      // 3. Extract receipt data with Gemini
      const extraction = await geminiService.extractReceiptData(
        file.buffer,
        file.mimetype,
        stored.originalFilename
      );

      if (extraction.success && extraction.data) {
        const ext = extraction.data;

        // Map line items with category resolution and paise conversion
        const processedItems = await Promise.all(
          ext.items.map(async (item) => {
            const categoryId = await categorisationService.resolveCategoryId(
              businessId,
              item.suggested_category,
              item.item_name
            );

            return {
              itemName: item.item_name,
              quantity: item.quantity ?? null,
              unit: item.unit ?? null,
              unitPricePaise: inrToPaise(item.unit_price),
              lineTotalPaise: inrToPaise(item.line_total),
              categoryId,
            };
          })
        );

        const subtotalPaise = inrToPaise(ext.subtotal);
        const taxAmountPaise = inrToPaise(ext.tax_amount);
        const totalAmountPaise = inrToPaise(ext.total_amount);

        // Run deterministic validation
        const validation = receiptValidationService.validateReceipt({
          vendorName: ext.vendor_name,
          receiptDate: ext.receipt_date,
          currencyCode: ext.currency_code || 'INR',
          subtotalPaise,
          taxAmountPaise,
          totalAmountPaise,
          lineItems: processedItems,
        });

        // Add any extra extraction notes from Gemini as flags if present
        const combinedFlags: ReviewFlag[] = [...validation.flags];
        for (const flagStr of ext.review_flags || []) {
          if (!combinedFlags.some((f) => f.reason.toLowerCase() === flagStr.toLowerCase())) {
            combinedFlags.push({
              field: 'general',
              reason: flagStr,
              severity: 'warning',
            });
          }
        }

        // Update receipt in DB
        receipt = await receiptRepository.updateReceipt(receipt.id, {
          vendorName: ext.vendor_name || null,
          receiptDate: ext.receipt_date || null,
          subtotalPaise,
          taxAmountPaise,
          totalAmountPaise,
          currencyCode: ext.currency_code || 'INR',
          lineItems: processedItems,
        });

        // Run duplicate detection
        const duplicateMatches = await duplicateDetectionService.detectDuplicates({
          receiptId: receipt.id,
          businessId,
          fileHash: stored.fileHash,
          vendorName: ext.vendor_name,
          receiptDate: ext.receipt_date,
          totalAmountPaise,
        });

        if (duplicateMatches.length > 0) {
          await duplicateDetectionService.recordDuplicateCandidates(receipt.id, duplicateMatches);
          // Refetch to include candidate duplicate relations
          const refreshed = await receiptRepository.findById(receipt.id);
          if (refreshed) receipt = refreshed;
        }

        res.status(201).json({
          message: 'Receipt uploaded and processed successfully',
          receipt,
        });
      } else {
        // Gemini extraction failed or is offline: receipt remains recoverable in draft/needs_review
        const failureFlags: ReviewFlag[] = [
          {
            field: 'extraction',
            reason: extraction.error || 'Gemini extraction unavailable. Please enter details manually.',
            severity: 'warning',
          },
        ];

        receipt = await receiptRepository.updateReceipt(receipt.id, {
          currencyCode: 'INR',
          lineItems: [],
        });

        res.status(201).json({
          message: 'Receipt uploaded. AI extraction was unavailable; ready for manual review.',
          receipt: {
            ...receipt,
            reviewFlags: failureFlags,
            status: 'needs_review',
          },
          warning: extraction.error,
        });
      }
    } catch (err: any) {
      console.error('Upload handler error:', err);
      res.status(500).json({ error: err.message || 'Failed to process receipt upload' });
    }
  }

  /**
   * GET /api/v1/receipts
   */
  public async getReceipts(req: Request, res: Response): Promise<void> {
    try {
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;
      const parsedFilters = ReceiptFilterSchema.safeParse(req.query);

      if (!parsedFilters.success) {
        res.status(400).json({ error: 'Invalid query filters', details: parsedFilters.error.format() });
        return;
      }

      const result = await receiptRepository.listReceipts(businessId, parsedFilters.data);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/receipts/:id
   */
  public async getReceiptById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const receipt = await receiptRepository.findById(id);

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      res.json(receipt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * PATCH /api/v1/receipts/:id
   */
  public async updateReceipt(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const parsed = UpdateReceiptSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const updated = await receiptRepository.updateReceipt(id, parsed.data);
      res.json({
        message: 'Receipt updated successfully',
        receipt: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * POST /api/v1/receipts/:id/confirm
   */
  public async confirmReceipt(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const confirmed = await receiptRepository.confirmReceipt(id);

      res.json({
        message: 'Receipt confirmed successfully and added to official bookkeeping records',
        receipt: confirmed,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * DELETE /api/v1/receipts/:id
   */
  public async deleteReceipt(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const success = await receiptRepository.deleteReceipt(id);

      if (!success) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      res.json({ message: 'Receipt deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/receipts/:id/file
   * Controlled access to original receipt file with correct MIME type.
   */
  public async getReceiptFile(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const receipt = await receiptRepository.findById(id);

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      const buffer = await storageService.getFileBuffer(receipt.storageKey);
      res.setHeader('Content-Type', receipt.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${receipt.originalFilename}"`);
      res.send(buffer);
    } catch (err: any) {
      res.status(404).json({ error: 'File not found or inaccessible' });
    }
  }

  /**
   * GET /api/v1/receipts/:id/duplicates
   */
  public async getReceiptDuplicates(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const receipt = await receiptRepository.findById(id);

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      res.json(receipt.duplicateCandidates || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/v1/receipts/:id/duplicates/:candidateId/dismiss
   */
  public async dismissDuplicate(req: Request, res: Response): Promise<void> {
    try {
      const candidateId = String(req.params.candidateId);
      const success = await duplicateDetectionService.dismissCandidate(candidateId);

      if (!success) {
        res.status(404).json({ error: 'Duplicate candidate not found' });
        return;
      }

      res.json({ message: 'Duplicate candidate dismissed successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const receiptController = new ReceiptController();
