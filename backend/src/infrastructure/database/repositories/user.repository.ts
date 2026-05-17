import { Injectable } from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IUserRepository,
  CreateUserInput,
  PrismaTransactionClient,
} from '../../../domain/interfaces/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tx?: PrismaTransactionClient): Promise<User | null> {
    const client = tx ?? this.prisma;
    return client.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? Role.USER,
        currentCredits: data.currentCredits ?? 0,
      },
    });
  }

  async incrementCredits(id: string, amount: number, tx: PrismaTransactionClient): Promise<User> {
    return tx.user.update({
      where: { id },
      data: { currentCredits: { increment: amount } },
    });
  }

  async decrementCredits(id: string, amount: number, tx: PrismaTransactionClient): Promise<User> {
    return tx.user.update({
      where: { id },
      data: { currentCredits: { decrement: amount } },
    });
  }

  async findWithActivePackages(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userPackages: {
          where: { status: 'ACTIVE' },
          include: {
            package: {
              include: { packageFeatures: { include: { feature: true } } },
            },
          },
        },
      },
    });
  }

  async findAll(skip: number, take: number): Promise<User[]> {
    return this.prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }
}
