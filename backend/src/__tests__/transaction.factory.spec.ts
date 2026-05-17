import { TransactionType, TransactionStatus } from '@prisma/client';
import {
  TransactionFactory,
  BuildTransactionParams,
} from '../domain/factories/transaction.factory';

describe('TransactionFactory', () => {
  const baseParams: BuildTransactionParams = {
    userId: 'user-123',
    type: TransactionType.CREDIT_IN,
    amount: 100,
    currentBalance: 50,
    packageId: 'pkg-456',
    description: 'Purchased Pro package',
    contextId: 'pkg-456',
  };

  describe('build()', () => {
    it('should compute balanceAfter correctly for CREDIT_IN', () => {
      const result = TransactionFactory.build(baseParams);

      expect(result.balanceBefore).toBe(50);
      expect(result.balanceAfter).toBe(150); // 50 + 100
    });

    it('should compute balanceAfter correctly for CREDIT_OUT', () => {
      const params: BuildTransactionParams = {
        ...baseParams,
        type: TransactionType.CREDIT_OUT,
        amount: 3,
        currentBalance: 50,
      };

      const result = TransactionFactory.build(params);

      expect(result.balanceBefore).toBe(50);
      expect(result.balanceAfter).toBe(47); // 50 - 3
    });

    it('should set status to COMPLETED', () => {
      const result = TransactionFactory.build(baseParams);

      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should generate a referenceId when contextId is provided', () => {
      const result = TransactionFactory.build(baseParams);

      expect(result.referenceId).toBeDefined();
      expect(result.referenceId).toMatch(/^credit_in-user-123-pkg-456-\d+$/);
    });

    it('should not generate a referenceId when contextId is absent', () => {
      const params: BuildTransactionParams = { ...baseParams, contextId: undefined };
      const result = TransactionFactory.build(params);

      expect(result.referenceId).toBeUndefined();
    });

    it('should pass through userId, amount, and description', () => {
      const result = TransactionFactory.build(baseParams);

      expect(result.userId).toBe('user-123');
      expect(result.amount).toBe(100);
      expect(result.description).toBe('Purchased Pro package');
    });

    it('should not mutate the input params object', () => {
      const paramsCopy = { ...baseParams };
      TransactionFactory.build(baseParams);

      expect(baseParams).toEqual(paramsCopy);
    });
  });
});
