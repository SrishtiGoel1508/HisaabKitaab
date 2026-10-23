import { describe, it, expect } from 'vitest';
import { inrToPaise, paiseToInr, formatINR, sumPaise, reconcileAmounts } from '../../src/server/utils/currency.js';

describe('Currency and Decimal-Safe Arithmetic', () => {
  it('converts float and string INR to integer paise accurately', () => {
    expect(inrToPaise(19.99)).toBe(1999);
    expect(inrToPaise('1234.50')).toBe(123450);
    expect(inrToPaise(0)).toBe(0);
    expect(inrToPaise(null)).toBeNull();
    expect(inrToPaise(undefined)).toBeNull();
  });

  it('avoids JavaScript floating point 0.1 + 0.2 inaccuracies', () => {
    // In raw JS: 0.1 + 0.2 = 0.30000000000000004
    const p1 = inrToPaise(0.1);
    const p2 = inrToPaise(0.2);
    const sum = sumPaise([p1, p2]);
    expect(sum).toBe(30); // Exactly 30 paise
    expect(paiseToInr(sum)).toBe(0.3);
  });

  it('formats integer paise into Indian currency notation', () => {
    expect(formatINR(123450)).toMatch(/₹\s?1,234\.50/);
    expect(formatINR(10000000)).toMatch(/₹\s?1,00,000\.00/);
    expect(formatINR(0)).toMatch(/₹\s?0\.00/);
    expect(formatINR(null)).toMatch(/₹\s?0\.00/);
  });

  it('reconciles line item sums with receipt totals', () => {
    const match = reconcileAmounts(50000, 50000);
    expect(match.isMatch).toBe(true);
    expect(match.diffPaise).toBe(0);

    const mismatch = reconcileAmounts(45000, 50000);
    expect(mismatch.isMatch).toBe(false);
    expect(mismatch.diffPaise).toBe(5000);
  });
});
