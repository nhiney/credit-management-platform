import { Injectable } from '@nestjs/common';
import { Feature, TransactionType } from '@prisma/client';
import {
  ICreditDeductionStrategy,
  CreditDeductionResult,
} from '../../../domain/strategies/credit-deduction.strategy';
import { PrismaTransactionClient } from '../../../domain/interfaces/user.repository.interface';
import { TransactionFactory } from '../../../domain/factories/transaction.factory';
import { UserRepository } from '../repositories/user.repository';
import { TransactionRepository } from '../repositories/transaction.repository';

/**
 * Default strategy: deduct credits before the action executes.
 * If the update fails, the $transaction wrapper rolls everything back.
 */
@Injectable()
export class PrepaidDeductionStrategy implements ICreditDeductionStrategy {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly txRepo: TransactionRepository,
  ) {}

  async execute(
    userId: string,
    feature: Feature,
    currentBalance: number,
    tx: PrismaTransactionClient,
  ): Promise<CreditDeductionResult> {
    const updatedUser = await this.userRepo.decrementCredits(userId, feature.creditCost, tx);

    const txData = TransactionFactory.build({
      userId,
      type: TransactionType.CREDIT_OUT,
      amount: feature.creditCost,
      currentBalance,
      featureId: feature.id,
      description: `Used feature: ${feature.codeName}`,
      contextId: feature.codeName,
    });

    const transaction = await this.txRepo.create(txData, tx);

    return { updatedUser, transaction };
  }
}
