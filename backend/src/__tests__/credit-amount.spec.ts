import { CreditAmount } from '../domain/value-objects/credit-amount.value-object';

describe('CreditAmount', () => {
  describe('of()', () => {
    it('should create a valid CreditAmount', () => {
      const ca = CreditAmount.of(100);
      expect(ca.value).toBe(100);
    });

    it('should accept zero', () => {
      const ca = CreditAmount.of(0);
      expect(ca.value).toBe(0);
    });

    it('should throw for negative values', () => {
      expect(() => CreditAmount.of(-1)).toThrow('CreditAmount cannot be negative');
    });

    it('should throw for non-integer values', () => {
      expect(() => CreditAmount.of(1.5)).toThrow('CreditAmount must be an integer');
    });
  });

  describe('add()', () => {
    it('should return a new CreditAmount with the sum', () => {
      const result = CreditAmount.of(50).add(CreditAmount.of(30));
      expect(result.value).toBe(80);
    });

    it('should be immutable — original unchanged', () => {
      const original = CreditAmount.of(50);
      original.add(CreditAmount.of(10));
      expect(original.value).toBe(50);
    });
  });

  describe('subtract()', () => {
    it('should return a new CreditAmount with the difference', () => {
      const result = CreditAmount.of(100).subtract(CreditAmount.of(40));
      expect(result.value).toBe(60);
    });

    it('should throw when result would be negative', () => {
      expect(() => CreditAmount.of(10).subtract(CreditAmount.of(20))).toThrow('Cannot subtract');
    });

    it('should allow subtracting to exactly zero', () => {
      const result = CreditAmount.of(10).subtract(CreditAmount.of(10));
      expect(result.value).toBe(0);
    });
  });

  describe('isGreaterThanOrEqualTo()', () => {
    it('should return true when equal', () => {
      expect(CreditAmount.of(50).isGreaterThanOrEqualTo(CreditAmount.of(50))).toBe(true);
    });

    it('should return true when greater', () => {
      expect(CreditAmount.of(100).isGreaterThanOrEqualTo(CreditAmount.of(50))).toBe(true);
    });

    it('should return false when less', () => {
      expect(CreditAmount.of(10).isGreaterThanOrEqualTo(CreditAmount.of(50))).toBe(false);
    });
  });

  describe('isZero()', () => {
    it('should return true for zero', () => {
      expect(CreditAmount.of(0).isZero()).toBe(true);
    });

    it('should return false for non-zero', () => {
      expect(CreditAmount.of(1).isZero()).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for same value', () => {
      expect(CreditAmount.of(42).equals(CreditAmount.of(42))).toBe(true);
    });

    it('should return false for different values', () => {
      expect(CreditAmount.of(42).equals(CreditAmount.of(43))).toBe(false);
    });
  });
});
