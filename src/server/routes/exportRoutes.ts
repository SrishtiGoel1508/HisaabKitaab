import { Router } from 'express';
import { exportController } from '../controllers/exportController.js';

export const exportRoutes = Router();

export const setupExportRoutes = () => {
  exportRoutes.get('/receipts.csv', (req, res) => exportController.exportReceiptsCsv(req, res));
  return exportRoutes;
};

setupExportRoutes();
