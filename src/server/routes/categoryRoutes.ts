import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';

export const categoryRoutes = Router();

categoryRoutes.get('/', (req, res) => categoryController.getCategories(req, res));
categoryRoutes.patch('/line-items/:id', (req, res) => categoryController.updateLineItem(req, res));
