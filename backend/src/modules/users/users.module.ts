import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Module({
  providers: [
    UsersService,
    { provide: INJECTION_TOKENS.USER_REPOSITORY, useClass: UserRepository },
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
