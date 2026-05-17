import { TransactionType, TransactionStatus } from '@prisma/client';
import { CreateTransactionInput } from '../interfaces/transaction.repository.interface';

export interface BuildTransactionParams {
  userId: string;
  type: TransactionType;
  amount: number;
  currentBalance: number;
  packageId?: string;
  featureId?: string;
  description?: string;
  contextId?: string;
}

/**
 * Factory responsible for constructing Transaction data objects.
 *
 * Centralizes balance calculation and referenceId generation so neither
 * PurchaseService nor RequireFeatureGuard duplicate this logic.
 */
export class TransactionFactory {
  static build(params: BuildTransactionParams): CreateTransactionInput {
    const balanceBefore = params.currentBalance;
    const balanceAfter =
      params.type === TransactionType.CREDIT_IN
        ? balanceBefore + params.amount
        : balanceBefore - params.amount;

    const referenceId = params.contextId
      ? `${params.type.toLowerCase()}-${params.userId}-${params.contextId}-${Date.now()}`
      : undefined;

    return {
      userId: params.userId,
      packageId: params.packageId,
      featureId: params.featureId,
      amount: params.amount,
      transactionType: params.type,
      status: TransactionStatus.COMPLETED,
      description: params.description,
      balanceBefore,
      balanceAfter,
      referenceId,
    };
  }
}
