import { Package, PackageFeature, Feature, Prisma } from '@prisma/client';
import { PrismaTransactionClient } from './user.repository.interface';

export type PackageWithFeatures = Package & {
  packageFeatures: (PackageFeature & { feature: Feature })[];
};

export interface CreatePackageInput {
  name: string;
  description?: string;
  price: Prisma.Decimal | number;
  creditAmount: number;
  featureIds?: string[];
}

export interface IPackageRepository {
  findAll(): Promise<PackageWithFeatures[]>;
  findAllAdmin(): Promise<PackageWithFeatures[]>;
  findAllFeatures(): Promise<Feature[]>;
  findById(id: string): Promise<PackageWithFeatures | null>;
  findActiveById(id: string): Promise<PackageWithFeatures | null>;
  create(data: CreatePackageInput): Promise<PackageWithFeatures>;
  update(id: string, data: Partial<CreatePackageInput>): Promise<PackageWithFeatures>;
  softDelete(id: string): Promise<Package>;
  countActiveSubscribers(packageId: string): Promise<number>;
  findUserActivePackageWithFeature(
    userId: string,
    featureCode: string,
    tx?: PrismaTransactionClient,
  ): Promise<PackageWithFeatures | null>;
  findUserActivePackage(userId: string, packageId: string): Promise<unknown | null>;
}
