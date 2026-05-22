import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PackagesService } from '../modules/packages/packages.service';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import {
  IPackageRepository,
  PackageWithFeatures,
} from '../domain/interfaces/package.repository.interface';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockFeature = {
  id: 'feat-001',
  codeName: 'auto_post',
  description: 'Auto post',
  creditCost: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPackage: PackageWithFeatures = {
  id: 'pkg-001',
  name: 'Basic',
  description: 'Basic plan',
  price: new Decimal(9.99),
  creditAmount: 100,
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  packageFeatures: [
    { id: 'pf-001', packageId: 'pkg-001', featureId: 'feat-001', feature: mockFeature },
  ],
};

const inactivePkg: PackageWithFeatures = {
  ...mockPackage,
  id: 'pkg-inactive',
  name: 'Legacy',
  isActive: false,
};

// ── Mock repo ─────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<IPackageRepository> = {
  findAll: jest.fn(),
  findAllAdmin: jest.fn(),
  findAllFeatures: jest.fn(),
  findById: jest.fn(),
  findActiveById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  countActiveSubscribers: jest.fn(),
  findUserActivePackageWithFeature: jest.fn(),
  findUserActivePackage: jest.fn(),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('PackagesService', () => {
  let service: PackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackagesService,
        { provide: INJECTION_TOKENS.PACKAGE_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PackagesService>(PackagesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return only active packages', async () => {
      mockRepo.findAll.mockResolvedValue([mockPackage]);

      const result = await service.findAll();

      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockPackage]);
    });
  });

  // ── findAllAdmin ────────────────────────────────────────────────────────────

  describe('findAllAdmin()', () => {
    it('should return all packages including inactive', async () => {
      mockRepo.findAllAdmin.mockResolvedValue([mockPackage, inactivePkg]);

      const result = await service.findAllAdmin();

      expect(mockRepo.findAllAdmin).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result.some((p) => !p.isActive)).toBe(true);
    });
  });

  // ── findAllFeatures ─────────────────────────────────────────────────────────

  describe('findAllFeatures()', () => {
    it('should return all available features', async () => {
      mockRepo.findAllFeatures.mockResolvedValue([mockFeature]);

      const result = await service.findAllFeatures();

      expect(mockRepo.findAllFeatures).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockFeature]);
    });

    it('should return empty array when no features exist', async () => {
      mockRepo.findAllFeatures.mockResolvedValue([]);

      const result = await service.findAllFeatures();

      expect(result).toHaveLength(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('should return package when found', async () => {
      mockRepo.findById.mockResolvedValue(mockPackage);

      const result = await service.findOne(mockPackage.id);

      expect(result).toEqual(mockPackage);
    });

    it('should throw NotFoundException when package does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('should soft-delete package with no active subscribers', async () => {
      mockRepo.findById.mockResolvedValue(mockPackage);
      mockRepo.countActiveSubscribers.mockResolvedValue(0);
      mockRepo.softDelete.mockResolvedValue({
        ...mockPackage,
        deletedAt: new Date(),
        isActive: false,
      });

      const result = await service.remove(mockPackage.id);

      expect(mockRepo.softDelete).toHaveBeenCalledWith(mockPackage.id);
      expect(result.message).toBe('Package deleted successfully');
    });

    it('should throw ConflictException when package has active subscribers', async () => {
      mockRepo.findById.mockResolvedValue(mockPackage);
      mockRepo.countActiveSubscribers.mockResolvedValue(3);

      await expect(service.remove(mockPackage.id)).rejects.toThrow(
        /Cannot delete — 3 user\(s\) have this package active/,
      );
      expect(mockRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
