import { Injectable } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ITransactionRepository,
  CreateTransactionInput,
  PaginatedTransactions,
} from '../../../domain/interfaces/transaction.repository.interface';
import { PrismaTransactionClient } from '../../../domain/interfaces/user.repository.interface';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTransactionInput, tx: PrismaTransactionClient): Promise<Transaction> {
    return tx.transaction.create({ data });
  }

  async findByUserId(userId: string, page: number, limit: number): Promise<PaginatedTransactions> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        include: {
          package: { select: { id: true, name: true } },
          feature: { select: { id: true, codeName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findAll(page: number, limit: number): Promise<PaginatedTransactions> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        include: {
          user: { select: { id: true, email: true } },
          package: { select: { id: true, name: true } },
          feature: { select: { id: true, codeName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
