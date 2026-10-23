import { Router } from 'express';
import { receiptController } from '../controllers/receiptController.js';
import { upload } from '../middleware/uploadMiddleware.js';

export const receiptRoutes = Router();

// Upload multipart receipt
receiptRoutes.post('/upload', upload.single('receipt'), (req, res) => receiptController.uploadReceipt(req, res));

// List receipts with filtering
receiptRoutes.get('/', (req, res) => receiptController.getReceipts(req, res));

// Get receipt by ID
receiptRoutes.get('/:id', (req, res) => receiptController.getReceiptById(req, res));

// Update receipt fields & line items
receiptRoutes.patch('/:id', (req, res) => receiptController.updateReceipt(req, res));

// Explicitly confirm receipt
receiptRoutes.post('/:id/confirm', (req, res) => receiptController.confirmReceipt(req, res));

// Delete receipt
receiptRoutes.delete('/:id', (req, res) => receiptController.deleteReceipt(req, res));

// Controlled access to original uploaded receipt document
receiptRoutes.get('/:id/file', (req, res) => receiptController.getReceiptFile(req, res));

// Get candidate duplicates for receipt
receiptRoutes.get('/:id/duplicates', (req, res) => receiptController.getReceiptDuplicates(req, res));

// Dismiss candidate duplicate
receiptRoutes.post('/:id/duplicates/:candidateId/dismiss', (req, res) => receiptController.dismissDuplicate(req, res));
