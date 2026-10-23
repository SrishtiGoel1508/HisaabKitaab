import { Request, Response } from 'express';
import { csvExportService } from '../services/csvExportService.js';
import { config } from '../config/index.js';

export class ExportController {
  /**
   * GET /api/v1/export/receipts.csv
   */
  public async exportReceiptsCsv(req: Request, res: Response): Promise<void> {
    try {
      const businessId = (req.headers['x-business-id'] as string) || config.demoBusinessId;
      const { startDate, endDate } = req.query;

      const csvContent = await csvExportService.generateConfirmedReceiptsCsv(businessId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });

      const filename = `hisaab_kitaab_confirmed_receipts_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // Send UTF-8 BOM so Excel opens it with proper Indian formatting and characters
      res.send('\uFEFF' + csvContent);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      res.status(500).json({ error: 'Failed to export receipts CSV' });
    }
  }
}

export const exportController = new ExportController();
