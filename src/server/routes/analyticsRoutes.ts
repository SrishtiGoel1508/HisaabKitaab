import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';

export const analyticsRoutes = Router();

analyticsRoutes.get('/summary', (req, res) => analyticsController.getSummary(req, res));
analyticsRoutes.get('/categories', (req, res) => analyticsController.getCategories(req, res));
analyticsRoutes.get('/vendors', (req, res) => analyticsController.getVendors(req, res));
analyticsRoutes.post('/query', (req, res) => analyticsController.handleNaturalLanguageQuery(req, res));
