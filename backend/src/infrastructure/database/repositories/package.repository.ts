import { Injectable } from '@nestjs/common';
import { Package } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IPackageRepository,
  PackageWithFeatures,
  CreatePackageInput,
} from '../../../domain/interfaces/package.repository.interface';
import { PrismaTransactionClient } from '../../../domain/interfaces/user.repository.interface';

const PACKAGE_INCLUDE = {
  packageFeatures: { include: { feature: true } },
} as const;

@Injectable()
export class PackageRepository implements IPackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PackageWithFeatures[]> {
    return this.prisma.package.findMany({
      where: { isActive: true, deletedAt: null },
      include: PACKAGE_INCLUDE,
      orderBy: { price: 'asc' },
    }) as Promise<PackageWithFeatures[]>;
  }

  async findById(id: string): Promise<PackageWithFeatures | null> {
    return this.prisma.package.findFirst({
      where: { id, deletedAt: null },
      include: PACKAGE_INCLUDE,
    }) as Promise<PackageWithFeatures | null>;
  }

  async findActiveById(id: string): Promise<PackageWithFeatures | null> {
    return this.prisma.package.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: PACKAGE_INCLUDE,
    }) as Promise<PackageWithFeatures | null>;
  }

  async create(data: CreatePackageInput): Promise<PackageWithFeatures> {
    const { featureIds, ...rest } = data;
    return this.prisma.package.create({
      data: {
        ...rest,
        packageFeatures: featureIds?.length
          ? { create: featureIds.map((featureId) => ({ featureId })) }
          : undefined,
      },
      include: PACKAGE_INCLUDE,
    }) as Promise<PackageWithFeatures>;
  }

  async update(id: string, data: Partial<CreatePackageInput>): Promise<PackageWithFeatures> {
    const { featureIds, ...rest } = data;
    return this.prisma.package.update({
      where: { id },
      data: {
        ...rest,
        packageFeatures: featureIds
          ? { deleteMany: {}, create: featureIds.map((featureId) => ({ featureId })) }
          : undefined,
      },
      include: PACKAGE_INCLUDE,
    }) as Promise<PackageWithFeatures>;
  }

  async softDelete(id: string): Promise<Package> {
    return this.prisma.package.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countActiveSubscribers(packageId: string): Promise<number> {
    return this.prisma.userPackage.count({
      where: { packageId, status: 'ACTIVE' },
    });
  }

  async findUserActivePackageWithFeature(
    userId: string,
    featureCode: string,
    tx?: PrismaTransactionClient,
  ): Promise<PackageWithFeatures | null> {
    const client = tx ?? this.prisma;
    const userPackage = await client.userPackage.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        package: {
          isActive: true,
          deletedAt: null,
          packageFeatures: { some: { feature: { codeName: featureCode } } },
        },
      },
      include: {
        package: { include: PACKAGE_INCLUDE },
      },
    });
    return (userPackage?.package as PackageWithFeatures) ?? null;
  }

  async findUserActivePackage(userId: string, packageId: string): Promise<unknown | null> {
    return this.prisma.userPackage.findFirst({
      where: { userId, packageId, status: 'ACTIVE' },
    });
  }
}
