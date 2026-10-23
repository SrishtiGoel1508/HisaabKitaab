import { Decimal } from 'decimal.js';

/**
 * Converts an INR amount (e.g. 125.50 or "125.50") to integer paise (12550).
 * Uses Decimal to prevent floating point inaccuracy (e.g. 19.99 * 100 = 1998.9999999999998).
 */
export function inrToPaise(amount: number | string | null | undefined): number | null {
  if (amount === null || amount === undefined || amount === '') {
    return null;
  }
  try {
    const dec = new Decimal(amount);
    if (dec.isNaN()) return null;
    return dec.times(100).round().toNumber();
  } catch {
    return null;
  }
}

/**
 * Converts integer paise (e.g. 12550) to INR float (125.50).
 */
export function paiseToInr(paise: number | null | undefined): number | null {
  if (paise === null || paise === undefined) {
    return null;
  }
  try {
    return new Decimal(paise).dividedBy(100).toNumber();
  } catch {
    return null;
  }
}

/**
 * Formats integer paise into standard Indian Rupee notation (e.g. ₹1,23,456.50).
 */
export function formatINR(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) {
    return '₹0.00';
  }
  const inr = paiseToInr(paise) ?? 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(inr);
}

/**
 * Deterministically sums integer paise values, ignoring nulls.
 */
export function sumPaise(amounts: (number | null | undefined)[]): number {
  let sum = new Decimal(0);
  for (const amt of amounts) {
    if (typeof amt === 'number' && !isNaN(amt)) {
      sum = sum.plus(amt);
    }
  }
  return sum.toNumber();
}

/**
 * Compares two paise amounts and determines if they reconcile within tolerance (default: 0 paise difference).
 */
export function reconcileAmounts(
  lineItemsTotalPaise: number,
  receiptTotalPaise: number,
  tolerancePaise: number = 0
): { isMatch: boolean; diffPaise: number } {
  const diff = Math.abs(lineItemsTotalPaise - receiptTotalPaise);
  return {
    isMatch: diff <= tolerancePaise,
    diffPaise: diff,
  };
}
