import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { PackageRepository } from '../../infrastructure/database/repositories/package.repository';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Module({
  providers: [
    PackagesService,
    { provide: INJECTION_TOKENS.PACKAGE_REPOSITORY, useClass: PackageRepository },
  ],
  controllers: [PackagesController],
  exports: [PackagesService],
})
export class PackagesModule {}
