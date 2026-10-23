import { describe, it, expect } from 'vitest';
import { csvExportService } from '../../src/server/services/csvExportService.js';

describe('CSV Export Service & Security', () => {
  it('prevents spreadsheet formula injection on dangerous prefixes', () => {
    // Formula triggers: =, +, -, @, \t, \r
    expect(csvExportService.sanitizeCellValue('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(csvExportService.sanitizeCellValue('+cmd|/c calc')).toBe("'+cmd|/c calc");
    expect(csvExportService.sanitizeCellValue('-20% discount')).toBe("'-20% discount");
    expect(csvExportService.sanitizeCellValue('@IMPORT')).toBe("'@IMPORT");
  });

  it('correctly escapes values containing commas and quotation marks', () => {
    const escaped = csvExportService.sanitizeCellValue('Gupta Kirana, "Wholesale" Store');
    expect(escaped).toBe('"Gupta Kirana, ""Wholesale"" Store"');
  });

  it('safely handles null and numbers', () => {
    expect(csvExportService.sanitizeCellValue(null)).toBe('');
    expect(csvExportService.sanitizeCellValue(undefined)).toBe('');
    expect(csvExportService.sanitizeCellValue(450.5)).toBe('450.5');
  });
});
