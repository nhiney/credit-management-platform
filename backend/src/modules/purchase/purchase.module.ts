import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { PackageRepository } from '../../infrastructure/database/repositories/package.repository';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Module({
  providers: [
    PurchaseService,
    { provide: INJECTION_TOKENS.PACKAGE_REPOSITORY, useClass: PackageRepository },
  ],
  controllers: [PurchaseController],
})
export class PurchaseModule {}
