import { ExecutionContext, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RequireFeatureGuard } from '../common/guards/require-feature.guard';
import { PrismaService } from '../prisma/prisma.service';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const mockFeature = {
  id: 'feat-001',
  codeName: 'generate_image',
  description: 'Generate AI image',
  creditCost: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser = {
  id: 'user-001',
  email: 'test@example.com',
  currentCredits: 10,
  role: 'USER' as const,
};

function buildMockContext(user = mockUser): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

// ── Mock Prisma ───────────────────────────────────────────────────────────────

const mockPrisma = {
  feature: { findUnique: jest.fn() },
  userPackage: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('RequireFeatureGuard', () => {
  let guard: RequireFeatureGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequireFeatureGuard, Reflector, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    guard = module.get<RequireFeatureGuard>(RequireFeatureGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return true and skip checks when no @RequireFeature decorator is present', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(buildMockContext());

    expect(result).toBe(true);
    expect(mockPrisma.feature.findUnique).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when feature code does not exist in DB', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('generate_image');
    mockPrisma.feature.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(buildMockContext())).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no active plan with the feature', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('generate_image');
    mockPrisma.feature.findUnique.mockResolvedValue(mockFeature);
    mockPrisma.userPackage.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(buildMockContext())).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('should throw UnprocessableEntityException when user has insufficient credits', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('generate_image');
    mockPrisma.feature.findUnique.mockResolvedValue(mockFeature); // creditCost = 3
    mockPrisma.userPackage.findFirst.mockResolvedValue({ id: 'up-001' });

    const poorUser = { ...mockUser, currentCredits: 2 }; // below creditCost

    await expect(guard.canActivate(buildMockContext(poorUser))).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('should deduct credits and return true when all checks pass', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('generate_image');
    mockPrisma.feature.findUnique.mockResolvedValue(mockFeature); // creditCost = 3
    mockPrisma.userPackage.findFirst.mockResolvedValue({ id: 'up-001' });

    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        user: { update: jest.fn().mockResolvedValue({ ...mockUser, currentCredits: 7 }) },
        transaction: { create: jest.fn().mockResolvedValue({ id: 'tx-001' }) },
      }),
    );

    const result = await guard.canActivate(buildMockContext({ ...mockUser, currentCredits: 10 }));

    expect(result).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should propagate DB errors from $transaction', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('generate_image');
    mockPrisma.feature.findUnique.mockResolvedValue(mockFeature);
    mockPrisma.userPackage.findFirst.mockResolvedValue({ id: 'up-001' });
    mockPrisma.$transaction.mockRejectedValue(new Error('deadlock detected'));

    await expect(guard.canActivate(buildMockContext())).rejects.toThrow('deadlock detected');
  });
});
