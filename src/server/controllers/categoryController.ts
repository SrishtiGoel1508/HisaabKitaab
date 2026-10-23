import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { config } from '../config/index.js';
import { categorisationService } from '../services/categorisationService.js';
import { z } from 'zod';

const UpdateLineItemSchema = z.object({
  itemName: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  unitPricePaise: z.number().int().nonnegative().nullable().optional(),
  lineTotalPaise: z.number().int().nonnegative().nullable().optional(),
});

export class CategoryController {
  /**
   * GET /api/v1/categories
   */
  public async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;
      const categories = await categoryRepository.getCategories(businessId);
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * PATCH /api/v1/line-items/:id
   */
  public async updateLineItem(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const parsed = UpdateLineItemSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid update data', details: parsed.error.format() });
        return;
      }

      const existing = await prisma.receiptLineItem.findUnique({
        where: { id },
        include: { receipt: true },
      });

      if (!existing) {
        res.status(404).json({ error: 'Line item not found' });
        return;
      }

      // If categoryId provided, verify it exists
      if (parsed.data.categoryId) {
        const cat = await prisma.category.findUnique({
          where: { id: parsed.data.categoryId },
        });
        if (!cat) {
          res.status(400).json({ error: 'Invalid categoryId' });
          return;
        }
      }

      const updated = await prisma.receiptLineItem.update({
        where: { id },
        data: {
          ...parsed.data,
        },
        include: {
          category: true,
        },
      });

      // Invalidate category cache
      categorisationService.invalidateCache();

      res.json({
        message: 'Line item updated successfully',
        lineItem: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const categoryController = new CategoryController();
