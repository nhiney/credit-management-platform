import { User, Role } from '@prisma/client';

export type PrismaTransactionClient = Omit<
  import('@prisma/client').PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role?: Role;
  currentCredits?: number;
}

export interface IUserRepository {
  findById(id: string, tx?: PrismaTransactionClient): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
  incrementCredits(id: string, amount: number, tx: PrismaTransactionClient): Promise<User>;
  decrementCredits(id: string, amount: number, tx: PrismaTransactionClient): Promise<User>;
  findWithActivePackages(id: string): Promise<(User & { userPackages: unknown[] }) | null>;
  findAll(skip: number, take: number): Promise<User[]>;
  count(): Promise<number>;
}
