import { Injectable, Logger, Inject } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/interfaces/transaction.repository.interface';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject(INJECTION_TOKENS.TRANSACTION_REPOSITORY)
    private readonly txRepo: ITransactionRepository,
  ) {}

  async findByUser(userId: string, page = 1, limit = 20) {
    return this.txRepo.findByUserId(userId, page, limit);
  }

  async findAll(page = 1, limit = 20) {
    this.logger.debug(`Admin listing all transactions — page ${page}`);
    return this.txRepo.findAll(page, limit);
  }
}
