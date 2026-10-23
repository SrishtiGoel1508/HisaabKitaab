import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { inrToPaise } from '../utils/currency.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { duplicateDetectionService } from './duplicateDetectionService.js';
import { receiptValidationService } from './receiptValidationService.js';
import { SYNTHETIC_RECEIPTS } from '../../../scripts/syntheticReceiptDefinitions.js';
import { renderReceiptSvg } from '../../../scripts/generateSyntheticReceipts.js';
import { config } from '../config/index.js';

export async function seedDemoData(): Promise<void> {
  console.log('--- Seeding Hisaab Kitaab Demonstration Data ---');

  const businessId = config.demoBusinessId;
  const businessName = config.demoBusinessName;

  // 1. Ensure Business exists
  const business = await prisma.business.upsert({
    where: { id: businessId },
    update: { name: businessName },
    create: {
      id: businessId,
      name: businessName,
      currencyCode: 'INR',
    },
  });

  // 2. Ensure Categories exist
  await categoryRepository.seedDefaultCategories(business.id);
  const categories = await prisma.category.findMany({ where: { businessId } });
  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  // 3. Ensure uploads and synthetic fixture directories exist
  const uploadsDir = path.resolve(process.cwd(), 'data/uploads');
  const fixturesDir = path.resolve(process.cwd(), 'data/synthetic-fixtures');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });

  const createdReceiptIds: string[] = [];

  for (const rec of SYNTHETIC_RECEIPTS) {
    // Generate SVG content
    const svgContent = renderReceiptSvg(rec);
    const fixturePath = path.join(fixturesDir, rec.filename);
    await fs.promises.writeFile(fixturePath, svgContent, 'utf-8');

    // Also write to data/uploads with storageKey
    const storageKey = `synthetic/${rec.filename}`;
    const uploadFilePath = path.join(uploadsDir, storageKey);
    const parentDir = path.dirname(uploadFilePath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    await fs.promises.writeFile(uploadFilePath, svgContent, 'utf-8');

    const fileBuffer = Buffer.from(svgContent, 'utf-8');
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const subtotalPaise = inrToPaise(rec.subtotalInr);
    const taxAmountPaise = inrToPaise(rec.taxAmountInr);
    const totalAmountPaise = inrToPaise(rec.totalAmountInr);

    // Prepare line items
    const lineItemsData = rec.items.map((item) => {
      const catId = categoryMap.get(item.categoryName.toLowerCase()) || categoryMap.get('uncategorized') || null;
      return {
        itemName: item.itemName,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        unitPricePaise: inrToPaise(item.unitPriceInr),
        lineTotalPaise: inrToPaise(item.lineTotalInr),
        categoryId: catId,
      };
    });

    // Run deterministic validation
    const validation = receiptValidationService.validateReceipt({
      vendorName: rec.vendorName,
      receiptDate: rec.receiptDate,
      currencyCode: 'INR',
      subtotalPaise,
      taxAmountPaise,
      totalAmountPaise,
      lineItems: lineItemsData,
    });

    let finalStatus = rec.status;
    let confirmedAt: Date | null = null;
    if (finalStatus === 'confirmed') {
      confirmedAt = new Date(`${rec.receiptDate || '2026-10-01'}T10:00:00.000Z`);
    }

    // Upsert receipt record
    const existing = await prisma.receipt.findUnique({
      where: { id: rec.id },
    });

    if (existing) {
      await prisma.receiptLineItem.deleteMany({ where: { receiptId: rec.id } });
      await prisma.receipt.update({
        where: { id: rec.id },
        data: {
          originalFilename: rec.filename,
          storageKey,
          mimeType: 'image/svg+xml',
          fileSize: fileBuffer.length,
          fileHash,
          vendorName: rec.vendorName,
          receiptDate: rec.receiptDate,
          subtotalPaise,
          taxAmountPaise,
          totalAmountPaise,
          currencyCode: 'INR',
          status: finalStatus,
          reviewFlags: JSON.stringify(validation.flags),
          extractionNotes: rec.notes || null,
          confirmedAt,
          lineItems: {
            create: lineItemsData,
          },
        },
      });
    } else {
      await prisma.receipt.create({
        data: {
          id: rec.id,
          businessId,
          originalFilename: rec.filename,
          storageKey,
          mimeType: 'image/svg+xml',
          fileSize: fileBuffer.length,
          fileHash,
          vendorName: rec.vendorName,
          receiptDate: rec.receiptDate,
          subtotalPaise,
          taxAmountPaise,
          totalAmountPaise,
          currencyCode: 'INR',
          status: finalStatus,
          reviewFlags: JSON.stringify(validation.flags),
          extractionNotes: rec.notes || null,
          confirmedAt,
          lineItems: {
            create: lineItemsData,
          },
        },
      });
    }

    createdReceiptIds.push(rec.id);
  }

  // Run Duplicate Detection pass
  for (const recId of createdReceiptIds) {
    const rec = await prisma.receipt.findUnique({ where: { id: recId } });
    if (!rec) continue;

    const matches = await duplicateDetectionService.detectDuplicates({
      receiptId: rec.id,
      businessId,
      fileHash: rec.fileHash,
      vendorName: rec.vendorName,
      receiptDate: rec.receiptDate,
      totalAmountPaise: rec.totalAmountPaise,
    });

    if (matches.length > 0) {
      await duplicateDetectionService.recordDuplicateCandidates(rec.id, matches);
    }
  }

  console.log(`Successfully seeded ${createdReceiptIds.length} receipts.`);
}
