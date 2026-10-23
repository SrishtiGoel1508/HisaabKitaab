import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SYNTHETIC_RECEIPTS, SyntheticReceiptDefinition } from './syntheticReceiptDefinitions.js';

export function renderReceiptSvg(rec: SyntheticReceiptDefinition): string {
  const isBlurry = rec.specialCondition === 'blurry';
  const isTorn = rec.specialCondition === 'missing_total';
  const isMissingDate = rec.specialCondition === 'missing_date';
  const isMathDiscrepancy = rec.specialCondition === 'math_discrepancy';

  const filterDef = isBlurry
    ? `<filter id="blurFilter"><feGaussianBlur stdDeviation="2.5" /></filter>`
    : '';

  const itemRows = rec.items
    .map((item, idx) => {
      const q = item.quantity !== null && item.quantity !== undefined ? `${item.quantity} ${item.unit || ''}` : '-';
      const r = item.unitPriceInr !== null && item.unitPriceInr !== undefined ? `₹${item.unitPriceInr.toFixed(2)}` : '-';
      const t = item.lineTotalInr !== null && item.lineTotalInr !== undefined ? `₹${item.lineTotalInr.toFixed(2)}` : '-';
      const y = 220 + idx * 30;

      return `
      <text x="30" y="${y}" font-size="12" fill="#333333">${idx + 1}. ${item.itemName.slice(0, 32)}</text>
      <text x="250" y="${y}" font-size="12" fill="#444444" text-anchor="middle">${q}</text>
      <text x="320" y="${y}" font-size="12" fill="#444444" text-anchor="end">${r}</text>
      <text x="410" y="${y}" font-size="12" fill="#222222" font-weight="600" text-anchor="end">${t}</text>
      `;
    })
    .join('\n');

  const itemsBottomY = 220 + rec.items.length * 30 + 15;
  const subtotalFormatted = rec.subtotalInr !== null ? `₹${rec.subtotalInr.toFixed(2)}` : '-';
  const taxFormatted = rec.taxAmountInr !== null ? `₹${rec.taxAmountInr.toFixed(2)}` : '₹0.00';
  const totalFormatted = rec.totalAmountInr !== null ? `₹${rec.totalAmountInr.toFixed(2)}` : '—';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 620" width="450" height="620">
  <defs>
    ${filterDef}
    <style>
      .mono { font-family: 'Courier New', Courier, monospace; }
      .sans { font-family: system-ui, -apple-system, sans-serif; }
    </style>
  </defs>

  <!-- Receipt Paper Background -->
  <rect x="10" y="10" width="430" height="600" rx="4" fill="#fcfcf9" stroke="#d5d5ce" stroke-width="1.5" />

  <g ${isBlurry ? 'filter="url(#blurFilter)"' : ''} class="mono">
    <!-- Header -->
    <text x="225" y="45" font-size="17" font-weight="bold" fill="#1b4d3e" text-anchor="middle">${(rec.vendorName || 'RETAIL STORE').toUpperCase()}</text>
    <text x="225" y="65" font-size="10" fill="#666666" text-anchor="middle">Wholesale &amp; Retail Groceries • Kirana Supply</text>
    <text x="225" y="80" font-size="10" fill="#666666" text-anchor="middle">GSTIN: 27AABCT3421M1Z8 • Ph: +91 98200 12345</text>

    <!-- Divider Line -->
    <line x1="25" y1="95" x2="425" y2="95" stroke="#444444" stroke-width="1" stroke-dasharray="3 3" />

    <!-- Metadata -->
    <text x="30" y="115" font-size="11" fill="#333333">INVOICE NO: INV-${rec.id.replace('syn-rec-', '2026-')}</text>
    <text x="410" y="115" font-size="11" fill="#333333" text-anchor="end">DATE: ${isMissingDate ? '<tspan fill="#d9534f">[DATE MISSING]</tspan>' : rec.receiptDate}</text>
    
    <text x="30" y="135" font-size="11" fill="#333333">BILL TO: Gupta Kirana &amp; General Store</text>
    <text x="410" y="135" font-size="11" fill="#333333" text-anchor="end">CASH / CREDIT MEMO</text>

    <!-- Table Header -->
    <rect x="25" y="150" width="400" height="25" fill="#f0ede5" />
    <text x="30" y="167" font-size="11" font-weight="bold" fill="#333333">ITEM DESCRIPTION</text>
    <text x="250" y="167" font-size="11" font-weight="bold" fill="#333333" text-anchor="middle">QTY</text>
    <text x="320" y="167" font-size="11" font-weight="bold" fill="#333333" text-anchor="end">RATE</text>
    <text x="410" y="167" font-size="11" font-weight="bold" fill="#333333" text-anchor="end">AMOUNT</text>

    <line x1="25" y1="180" x2="425" y2="180" stroke="#888888" stroke-width="0.8" />

    <!-- Line Items -->
    ${itemRows}

    <line x1="25" y1="${itemsBottomY}" x2="425" y2="${itemsBottomY}" stroke="#888888" stroke-width="0.8" />

    <!-- Subtotals & Taxes -->
    <text x="270" y="${itemsBottomY + 25}" font-size="11" fill="#555555">SUBTOTAL:</text>
    <text x="410" y="${itemsBottomY + 25}" font-size="11" fill="#333333" text-anchor="end">${subtotalFormatted}</text>

    <text x="270" y="${itemsBottomY + 45}" font-size="11" fill="#555555">GST / TAX:</text>
    <text x="410" y="${itemsBottomY + 45}" font-size="11" fill="#333333" text-anchor="end">${taxFormatted}</text>

    <line x1="250" y1="${itemsBottomY + 55}" x2="425" y2="${itemsBottomY + 55}" stroke="#444444" stroke-width="1.2" />

    <!-- Grand Total -->
    ${
      isTorn
        ? `
    <!-- Torn corner simulation -->
    <path d="M 230 ${itemsBottomY + 60} Q 280 ${itemsBottomY + 90} 340 ${itemsBottomY + 70} T 435 ${itemsBottomY + 80} L 435 605 L 230 605 Z" fill="#e8e8e0" />
    <text x="270" y="${itemsBottomY + 80}" font-size="14" font-weight="bold" fill="#d9534f">[TOTAL TORN OFF]</text>
    `
        : `
    <rect x="25" y="${itemsBottomY + 62}" width="400" height="32" fill="${isMathDiscrepancy ? '#fff0f0' : '#eaf6f0'}" rx="3" />
    <text x="35" y="${itemsBottomY + 83}" font-size="13" font-weight="bold" fill="${isMathDiscrepancy ? '#c53030' : '#1b4d3e'}">GRAND TOTAL (INR):</text>
    <text x="410" y="${itemsBottomY + 83}" font-size="14" font-weight="bold" fill="${isMathDiscrepancy ? '#c53030' : '#1b4d3e'}" text-anchor="end">${totalFormatted}</text>
    `
    }

    <!-- Footer -->
    <line x1="25" y1="540" x2="425" y2="540" stroke="#cccccc" stroke-width="0.8" />
    <text x="225" y="560" font-size="10" fill="#777777" text-anchor="middle">THANK YOU FOR YOUR BUSINESS • VISIT AGAIN!</text>
    <text x="225" y="575" font-size="9" fill="#999999" text-anchor="middle">Hisaab Kitaab Verified Source Document</text>
  </g>
</svg>`;
}

export async function generateFixtures(): Promise<void> {
  const fixturesDir = path.resolve(process.cwd(), 'data/synthetic-fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  console.log(`Generating ${SYNTHETIC_RECEIPTS.length} synthetic kirana receipts...`);

  for (const rec of SYNTHETIC_RECEIPTS) {
    const svgContent = renderReceiptSvg(rec);
    const filePath = path.join(fixturesDir, rec.filename);
    await fs.promises.writeFile(filePath, svgContent, 'utf-8');
  }

  console.log(`Successfully generated all synthetic receipt fixtures in ${fixturesDir}`);
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('generateSyntheticReceipts.ts')) {
  generateFixtures();
}
