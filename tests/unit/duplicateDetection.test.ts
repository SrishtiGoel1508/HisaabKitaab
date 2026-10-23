import { describe, it, expect } from 'vitest';
import { duplicateDetectionService } from '../../src/server/services/duplicateDetectionService.js';

describe('Duplicate Detection Service', () => {
  it('normalizes vendor names by stripping common legal and retail suffixes', () => {
    const n1 = duplicateDetectionService.normalizeVendor('Amul Dairy Distributors Pvt Ltd');
    const n2 = duplicateDetectionService.normalizeVendor('Amul Dairy Distributors & Agency');
    expect(n1).toContain('amul dairy distributors');
    expect(n2).toContain('amul dairy distributors');
  });

  it('calculates string similarity accurately', () => {
    const scoreExact = duplicateDetectionService.stringSimilarity('Parle Agencies', 'Parle Agencies');
    expect(scoreExact).toBe(1.0);

    const scoreTypo = duplicateDetectionService.stringSimilarity('Parle Agencies', 'Parle Agenci');
    expect(scoreTypo).toBeGreaterThan(0.7);

    const scoreDifferent = duplicateDetectionService.stringSimilarity('Amul Milk', 'Tata Tea');
    expect(scoreDifferent).toBeLessThan(0.3);
  });
});
