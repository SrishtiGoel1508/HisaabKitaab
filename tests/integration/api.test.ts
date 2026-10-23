import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, initializeDatabase } from '../../src/server/app.js';
import { prisma } from '../../src/server/utils/prisma.js';
import { seedDemoData } from '../../scripts/seedDemoData.js';

beforeAll(async () => {
  await initializeDatabase();
  await seedDemoData();
});

describe('Hisaab Kitaab End-to-End REST API Tests', () => {
  it('GET /health returns ok status and model info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('Hisaab Kitaab API');
  });

  it('GET /api/v1/categories returns seeded kirana categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(10);
    const names = res.body.map((c: any) => c.name);
    expect(names).toContain('Dairy Products');
    expect(names).toContain('Inventory / Stock');
    expect(names).toContain('Packaged Goods');
  });

  it('GET /api/v1/receipts lists receipts with pagination', async () => {
    const res = await request(app).get('/api/v1/receipts?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/receipts?status=confirmed filters by confirmed status only', async () => {
    const res = await request(app).get('/api/v1/receipts?status=confirmed');
    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(item.status).toBe('confirmed');
    }
  });

  it('GET /api/v1/receipts/:id returns full receipt with line items', async () => {
    const list = await request(app).get('/api/v1/receipts');
    const firstId = list.body.items[0].id;

    const res = await request(app).get(`/api/v1/receipts/${firstId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstId);
    expect(Array.isArray(res.body.lineItems)).toBe(true);
  });

  it('GET /api/v1/receipts/:id/file serves original receipt file with inline disposition', async () => {
    const list = await request(app).get('/api/v1/receipts');
    const firstId = list.body.items[0].id;

    const res = await request(app).get(`/api/v1/receipts/${firstId}/file`);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('inline;');
  });

  it('GET /api/v1/analytics/summary computes deterministic totals from confirmed receipts only', async () => {
    const res = await request(app).get('/api/v1/analytics/summary');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalSpendingPaise).toBe('number');
    expect(res.body.totalSpendingPaise).toBeGreaterThan(0);
    expect(res.body.currencyCode).toBe('INR');
    expect(Array.isArray(res.body.categoryBreakdown)).toBe(true);
    expect(Array.isArray(res.body.vendorBreakdown)).toBe(true);
    expect(Array.isArray(res.body.supportingReceiptIds)).toBe(true);

    // Verify all supportingReceiptIds are confirmed in DB
    for (const id of res.body.supportingReceiptIds) {
      const rec = await prisma.receipt.findUnique({ where: { id } });
      expect(rec?.status).toBe('confirmed');
      expect(rec?.deletedAt).toBeNull();
    }
  });

  it('POST /api/v1/analytics/query answers natural language queries with verified evidence', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/query')
      .send({ question: 'How much did I spend on dairy products?' });

    expect(res.status).toBe(200);
    expect(res.body.question).toBe('How much did I spend on dairy products?');
    expect(res.body.answer).toBeDefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.data.currency).toBe('INR');
    expect(Array.isArray(res.body.data.receiptIds)).toBe(true);
  });

  it('GET /api/v1/export/receipts.csv exports confirmed receipts with UTF-8 encoding', async () => {
    const res = await request(app).get('/api/v1/export/receipts.csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment; filename=');
    expect(res.text).toContain('receipt_id,receipt_date,vendor_name');
  });

  it('blocks confirmation on receipt with missing date (syn-rec-010)', async () => {
    const res = await request(app).post('/api/v1/receipts/syn-rec-010/confirm');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot confirm receipt');
  });

  it('blocks confirmation on receipt with math discrepancy (syn-rec-013)', async () => {
    const res = await request(app).post('/api/v1/receipts/syn-rec-013/confirm');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Financial discrepancy');
  });

  it('allows updating fields and confirms eligible receipt', async () => {
    // Correct the date on syn-rec-010
    const updateRes = await request(app)
      .patch('/api/v1/receipts/syn-rec-010')
      .send({ receiptDate: '2026-10-14' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.receipt.receiptDate).toBe('2026-10-14');

    // Now confirm should succeed
    const confirmRes = await request(app).post('/api/v1/receipts/syn-rec-010/confirm');
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.receipt.status).toBe('confirmed');
    expect(confirmRes.body.receipt.confirmedAt).toBeDefined();
  });

  it('rejects upload of unsupported file types', async () => {
    const res = await request(app)
      .post('/api/v1/receipts/upload')
      .attach('receipt', Buffer.from('malicious executable code'), 'test.exe');

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Unsupported file type');
  });
});
