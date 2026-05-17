import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { RequireFeatureGuard } from '../../common/guards/require-feature.guard';
import { PrepaidDeductionStrategy } from '../../infrastructure/database/strategies/prepaid-deduction.strategy';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { TransactionRepository } from '../../infrastructure/database/repositories/transaction.repository';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Module({
  providers: [
    AiService,
    RequireFeatureGuard,
    { provide: INJECTION_TOKENS.CREDIT_DEDUCTION_STRATEGY, useClass: PrepaidDeductionStrategy },
    UserRepository,
    TransactionRepository,
  ],
  controllers: [AiController],
})
export class AiModule {}
