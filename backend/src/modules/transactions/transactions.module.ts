import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionRepository } from '../../infrastructure/database/repositories/transaction.repository';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Module({
  providers: [
    TransactionsService,
    { provide: INJECTION_TOKENS.TRANSACTION_REPOSITORY, useClass: TransactionRepository },
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
