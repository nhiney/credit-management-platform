import { User, Feature, Transaction } from '@prisma/client';
import { PrismaTransactionClient } from '../interfaces/user.repository.interface';

export interface CreditDeductionResult {
  updatedUser: User;
  transaction: Transaction;
}

/**
 * Strategy interface for credit-deduction algorithms.
 *
 * The default implementation is PrepaidDeductionStrategy (deduct-first).
 * Alternative strategies (PostpaidStrategy, FreeTrialStrategy) can be
 * registered via DI without modifying RequireFeatureGuard.
 */
export interface ICreditDeductionStrategy {
  execute(
    userId: string,
    feature: Feature,
    currentBalance: number,
    tx: PrismaTransactionClient,
  ): Promise<CreditDeductionResult>;
}
