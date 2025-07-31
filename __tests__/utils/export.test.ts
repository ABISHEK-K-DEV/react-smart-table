import { sanitizeForExport, validateFile } from '../../src/utils/export';

// Mock File class since it's not available in Node.js environment
global.File = class MockFile {
  name: string;
  size: number;
  type: string;

  constructor(parts: any[], name: string, options: { type: string }) {
    this.name = name;
    this.size = parts[0]?.length || 0;
    this.type = options.type;
  }
} as any;

describe('export utilities', () => {
  describe('sanitizeForExport', () => {
    it('should handle null and undefined values', () => {
      expect(sanitizeForExport(null)).toBe('');
      expect(sanitizeForExport(undefined)).toBe('');
    });

    it('should convert values to strings', () => {
      expect(sanitizeForExport(123)).toBe('123');
      expect(sanitizeForExport(true)).toBe('true');
    });

    it('should prevent CSV injection by escaping formula triggers', () => {
      expect(sanitizeForExport('=SUM(A1:B1)')).toBe("'=SUM(A1:B1)");
      expect(sanitizeForExport('+SUM(A1:B1)')).toBe("'+SUM(A1:B1)");
      expect(sanitizeForExport('-SUM(A1:B1)')).toBe("'-SUM(A1:B1)");
      expect(sanitizeForExport('@Command')).toBe("'@Command");
    });

    it('should sanitize dangerous characters', () => {
      const input = 'Line 1\nLine 2\tTabbed\rReturn';
      expect(sanitizeForExport(input)).not.toContain('\n');
      expect(sanitizeForExport(input)).not.toContain('\t');
      expect(sanitizeForExport(input)).not.toContain('\r');
    });

    it('should limit string length', () => {
      const longString = 'a'.repeat(40000);
      expect(sanitizeForExport(longString).length).toBeLessThanOrEqual(32767);
    });
  });

  describe('validateFile', () => {
    it('should accept valid CSV files', () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      expect(() => validateFile(file)).not.toThrow();
    });

    it('should accept Excel CSV files', () => {
      const file = new File(['content'], 'test.csv', { type: 'application/vnd.ms-excel' });
      expect(() => validateFile(file)).not.toThrow();
    });

    it('should reject files that are too large', () => {
      const hugeContent = 'a'.repeat(51 * 1024 * 1024); // 51MB
      const file = new File([hugeContent], 'huge.csv', { type: 'text/csv' });
      expect(() => validateFile(file)).toThrow(/size exceeds/);
    });

    it('should reject files with invalid types', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/octet-stream' });
      expect(() => validateFile(file)).toThrow(/Invalid file type/);
    });

    it('should accept CSV files with no explicit mime type but .csv extension', () => {
      const file = new File(['content'], 'data.csv', { type: '' });
      expect(() => validateFile(file)).not.toThrow();
    });
  });
});
