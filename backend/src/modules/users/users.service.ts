import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findWithActivePackages(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userRepo.findAll(skip, limit),
      this.userRepo.count(),
    ]);
    this.logger.debug(`Admin listed users — page ${page}, total ${total}`);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
