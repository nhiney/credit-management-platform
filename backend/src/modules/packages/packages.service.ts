import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

const PACKAGE_INCLUDE = {
  packageFeatures: {
    include: { feature: true },
  },
} as const;

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.package.findMany({
      where: { isActive: true, deletedAt: null },
      include: PACKAGE_INCLUDE,
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.package.findFirst({
      where: { id, deletedAt: null },
      include: PACKAGE_INCLUDE,
    });

    if (!pkg) throw new NotFoundException(`Package with id '${id}' not found`);
    return pkg;
  }

  async create(dto: CreatePackageDto) {
    const { featureIds, ...data } = dto;

    return this.prisma.package.create({
      data: {
        ...data,
        packageFeatures: featureIds?.length
          ? { create: featureIds.map((featureId) => ({ featureId })) }
          : undefined,
      },
      include: PACKAGE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);

    const { featureIds, ...data } = dto;

    return this.prisma.package.update({
      where: { id },
      data: {
        ...data,
        packageFeatures: featureIds
          ? {
              deleteMany: {},
              create: featureIds.map((featureId) => ({ featureId })),
            }
          : undefined,
      },
      include: PACKAGE_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeSubscribers = await this.prisma.userPackage.count({
      where: { packageId: id, status: 'ACTIVE' },
    });

    if (activeSubscribers > 0) {
      throw new ConflictException(
        `Cannot delete — ${activeSubscribers} user(s) have this package active`,
      );
    }

    await this.prisma.package.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Package deleted successfully' };
  }
}
