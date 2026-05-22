import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType, TransactionStatus, UserPackageStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PurchaseService } from '../modules/purchase/purchase.service';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { IUserRepository } from '../domain/interfaces/user.repository.interface';
import {
  IPackageRepository,
  PackageWithFeatures,
} from '../domain/interfaces/package.repository.interface';
import { ITransactionRepository } from '../domain/interfaces/transaction.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

// ── Mock factories ────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-001',
  email: 'test@example.com',
  passwordHash: 'hash',
  currentCredits: 50,
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPackage: PackageWithFeatures = {
  id: 'pkg-001',
  name: 'Pro',
  description: 'Pro plan',
  price: new Decimal(29.99),
  creditAmount: 500,
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  packageFeatures: [],
};

const mockTransaction = {
  id: 'tx-001',
  userId: mockUser.id,
  packageId: mockPackage.id,
  featureId: null,
  amount: 500,
  transactionType: TransactionType.CREDIT_IN,
  status: TransactionStatus.COMPLETED,
  description: 'Purchased package: Pro',
  balanceBefore: 50,
  balanceAfter: 550,
  referenceId: 'credit_in-user-001-pkg-001-123',
  createdAt: new Date(),
};

// ── Mock implementations ─────────────────────────────────────────────────────

const mockUserRepo: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  incrementCredits: jest.fn(),
  decrementCredits: jest.fn(),
  findWithActivePackages: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

const mockPackageRepo: jest.Mocked<IPackageRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findActiveById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  countActiveSubscribers: jest.fn(),
  findUserActivePackageWithFeature: jest.fn(),
  findUserActivePackage: jest.fn(),
};

const mockTxRepo: jest.Mocked<ITransactionRepository> = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  findAll: jest.fn(),
};

const mockPrisma = {
  $transaction: jest.fn(),
  userPackage: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('PurchaseService', () => {
  let service: PurchaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        { provide: INJECTION_TOKENS.USER_REPOSITORY, useValue: mockUserRepo },
        { provide: INJECTION_TOKENS.PACKAGE_REPOSITORY, useValue: mockPackageRepo },
        { provide: INJECTION_TOKENS.TRANSACTION_REPOSITORY, useValue: mockTxRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('purchasePackage()', () => {
    it('should throw NotFoundException when package does not exist', async () => {
      mockPackageRepo.findActiveById.mockResolvedValue(null);

      await expect(
        service.purchasePackage(mockUser.id, { packageId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user already owns the package', async () => {
      mockPackageRepo.findActiveById.mockResolvedValue(mockPackage);
      mockPackageRepo.findUserActivePackage.mockResolvedValue({ id: 'existing-up' });

      await expect(
        service.purchasePackage(mockUser.id, { packageId: mockPackage.id }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should execute $transaction when purchase is valid', async () => {
      mockPackageRepo.findActiveById.mockResolvedValue(mockPackage);
      mockPackageRepo.findUserActivePackage.mockResolvedValue(null);

      const updatedUser = { ...mockUser, currentCredits: 550 };
      const userPackage = {
        id: 'up-001',
        userId: mockUser.id,
        packageId: mockPackage.id,
        status: UserPackageStatus.ACTIVE,
        purchasedAt: new Date(),
        expiresAt: null,
      };

      mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(updatedUser),
          },
          userPackage: { create: jest.fn().mockResolvedValue(userPackage) },
          transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
        }),
      );

      const result = await service.purchasePackage(mockUser.id, { packageId: mockPackage.id });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.creditsAdded).toBe(mockPackage.creditAmount);
      expect(result.newBalance).toBe(550);
    });

    it('should roll back if $transaction throws', async () => {
      mockPackageRepo.findActiveById.mockResolvedValue(mockPackage);
      mockPackageRepo.findUserActivePackage.mockResolvedValue(null);
      mockPrisma.$transaction.mockRejectedValue(new Error('DB error'));

      await expect(
        service.purchasePackage(mockUser.id, { packageId: mockPackage.id }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('cancelPackage()', () => {
    const mockUserPackage = {
      id: 'up-001',
      userId: mockUser.id,
      packageId: mockPackage.id,
      status: 'ACTIVE' as const,
      purchasedAt: new Date(),
      expiresAt: null,
      package: mockPackage,
    };

    it('should throw NotFoundException when no active subscription exists', async () => {
      mockPrisma.userPackage.findFirst.mockResolvedValue(null);

      await expect(service.cancelPackage(mockUser.id, mockPackage.id)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.userPackage.update).not.toHaveBeenCalled();
    });

    it('should set status to CANCELLED when active subscription exists', async () => {
      mockPrisma.userPackage.findFirst.mockResolvedValue(mockUserPackage);
      mockPrisma.userPackage.update.mockResolvedValue({ ...mockUserPackage, status: 'CANCELLED' });

      const result = await service.cancelPackage(mockUser.id, mockPackage.id);

      expect(mockPrisma.userPackage.update).toHaveBeenCalledWith({
        where: { id: mockUserPackage.id },
        data: { status: 'CANCELLED' },
      });
      expect(result.message).toContain(mockPackage.name);
    });

    it('should return success message with package name', async () => {
      mockPrisma.userPackage.findFirst.mockResolvedValue(mockUserPackage);
      mockPrisma.userPackage.update.mockResolvedValue({ ...mockUserPackage, status: 'CANCELLED' });

      const result = await service.cancelPackage(mockUser.id, mockPackage.id);

      expect(result).toEqual({ message: `Successfully cancelled the ${mockPackage.name} package` });
    });
  });
});
