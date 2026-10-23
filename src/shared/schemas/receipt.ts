import { z } from 'zod';

// Gemini Extraction Schema (structured JSON output from AI)
export const GeminiExtractedItemSchema = z.object({
  item_name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  line_total: z.number().nullable().optional(),
  suggested_category: z.string().nullable().optional(),
});

export const GeminiExtractionResultSchema = z.object({
  vendor_name: z.string().nullable().optional(),
  receipt_date: z.string().nullable().optional(), // Expected YYYY-MM-DD if discernable
  currency_code: z.string().default('INR'),
  subtotal: z.number().nullable().optional(),
  tax_amount: z.number().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  items: z.array(GeminiExtractedItemSchema).default([]),
  field_confidence: z.record(z.string(), z.number()).nullable().optional(),
  review_flags: z.array(z.string()).default([]),
  extraction_notes: z.string().nullable().optional(),
});

export type GeminiExtractionResult = z.infer<typeof GeminiExtractionResultSchema>;

// Update Receipt Request Schema
export const UpdateReceiptLineItemSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  unitPricePaise: z.number().int().nonnegative('Unit price must be non-negative').nullable().optional(),
  lineTotalPaise: z.number().int().nonnegative('Line total must be non-negative').nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export const UpdateReceiptSchema = z.object({
  vendorName: z.string().nullable().optional(),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').nullable().optional(),
  subtotalPaise: z.number().int().nonnegative().nullable().optional(),
  taxAmountPaise: z.number().int().nonnegative().nullable().optional(),
  totalAmountPaise: z.number().int().nonnegative('Total must be non-negative').nullable().optional(),
  currencyCode: z.string().default('INR'),
  lineItems: z.array(UpdateReceiptLineItemSchema).optional(),
});

export type UpdateReceiptInput = z.infer<typeof UpdateReceiptSchema>;

// Natural Language Query Request Schema
export const NaturalLanguageQuerySchema = z.object({
  question: z.string().min(2, 'Question must be at least 2 characters long').max(500),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type NaturalLanguageQueryInput = z.infer<typeof NaturalLanguageQuerySchema>;

// Filter Schema
export const ReceiptFilterSchema = z.object({
  status: z.enum(['all', 'draft', 'needs_review', 'confirmed']).optional().default('all'),
  vendor: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  duplicateStatus: z.enum(['all', 'none', 'suspected', 'confirmed_duplicate', 'dismissed']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
