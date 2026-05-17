import { Transaction, TransactionType, TransactionStatus } from '@prisma/client';
import { PrismaTransactionClient } from './user.repository.interface';

export interface CreateTransactionInput {
  userId: string;
  packageId?: string;
  featureId?: string;
  amount: number;
  transactionType: TransactionType;
  status?: TransactionStatus;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ITransactionRepository {
  create(data: CreateTransactionInput, tx: PrismaTransactionClient): Promise<Transaction>;
  findByUserId(userId: string, page: number, limit: number): Promise<PaginatedTransactions>;
  findAll(page: number, limit: number): Promise<PaginatedTransactions>;
}
