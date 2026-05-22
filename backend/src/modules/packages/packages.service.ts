import { Injectable, NotFoundException, ConflictException, Logger, Inject } from '@nestjs/common';
import { IPackageRepository } from '../../domain/interfaces/package.repository.interface';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    @Inject(INJECTION_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepo: IPackageRepository,
  ) {}

  async findAll() {
    return this.packageRepo.findAll();
  }

  async findAllAdmin() {
    return this.packageRepo.findAllAdmin();
  }

  async findAllFeatures() {
    return this.packageRepo.findAllFeatures();
  }

  async findOne(id: string) {
    const pkg = await this.packageRepo.findById(id);
    if (!pkg) throw new NotFoundException(`Package with id '${id}' not found`);
    return pkg;
  }

  async create(dto: CreatePackageDto) {
    const pkg = await this.packageRepo.create(dto);
    this.logger.log(`Package created: ${pkg.id} — ${pkg.name}`);
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);
    const pkg = await this.packageRepo.update(id, dto);
    this.logger.log(`Package updated: ${id}`);
    return pkg;
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeSubscribers = await this.packageRepo.countActiveSubscribers(id);
    if (activeSubscribers > 0) {
      throw new ConflictException(
        `Cannot delete — ${activeSubscribers} user(s) have this package active`,
      );
    }

    await this.packageRepo.softDelete(id);
    this.logger.log(`Package soft-deleted: ${id}`);
    return { message: 'Package deleted successfully' };
  }
}
