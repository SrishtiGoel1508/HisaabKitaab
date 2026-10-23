import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { naturalLanguageQueryService } from '../services/naturalLanguageQueryService.js';
import { config } from '../config/index.js';
import { NaturalLanguageQuerySchema } from '../../shared/schemas/receipt.js';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics/summary
   */
  public async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;
      const { startDate, endDate, preset } = req.query;

      const summary = await analyticsService.getSummary(businessId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        preset: preset as any,
      });

      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/analytics/categories
   */
  public async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;
      const { startDate, endDate, preset } = req.query;

      const summary = await analyticsService.getSummary(businessId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        preset: preset as any,
      });

      res.json(summary.categoryBreakdown);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/analytics/vendors
   */
  public async getVendors(req: Request, res: Response): Promise<void> {
    try {
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;
      const { startDate, endDate, preset } = req.query;

      const summary = await analyticsService.getSummary(businessId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        preset: preset as any,
      });

      res.json(summary.vendorBreakdown);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/v1/analytics/query
   */
  public async handleNaturalLanguageQuery(req: Request, res: Response): Promise<void> {
    try {
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;
      const parsed = NaturalLanguageQuerySchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid question format', details: parsed.error.format() });
        return;
      }

      const result = await naturalLanguageQueryService.handleQuery(
        businessId,
        parsed.data.question,
        parsed.data.startDate,
        parsed.data.endDate
      );

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
