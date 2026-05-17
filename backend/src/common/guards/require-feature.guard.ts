import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { TransactionType, TransactionStatus, UserPackageStatus } from '@prisma/client';

@Injectable()
export class RequireFeatureGuard implements CanActivate {
  private readonly logger = new Logger(RequireFeatureGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureCode = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!featureCode) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const feature = await this.prisma.feature.findUnique({
      where: { codeName: featureCode },
    });

    if (!feature) {
      throw new ForbiddenException(`Feature '${featureCode}' is not defined`);
    }

    // Check if user has an active package that grants access to this feature
    const activeUserPackage = await this.prisma.userPackage.findFirst({
      where: {
        userId: user.id,
        status: UserPackageStatus.ACTIVE,
        package: {
          isActive: true,
          deletedAt: null,
          packageFeatures: {
            some: { featureId: feature.id },
          },
        },
      },
      include: { package: true },
    });

    if (!activeUserPackage) {
      throw new ForbiddenException(
        `Your current plan does not include access to '${featureCode}'. Please upgrade your package.`,
      );
    }

    if (user.currentCredits < feature.creditCost) {
      throw new UnprocessableEntityException(
        `Insufficient credits. This action requires ${feature.creditCost} credit(s), but you only have ${user.currentCredits}.`,
      );
    }

    // Deduct credits and log transaction atomically
    await this.prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.update({
        where: { id: user.id },
        data: { currentCredits: { decrement: feature.creditCost } },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          featureId: feature.id,
          amount: feature.creditCost,
          transactionType: TransactionType.CREDIT_OUT,
          status: TransactionStatus.COMPLETED,
          description: `Used feature: ${featureCode}`,
          balanceBefore: user.currentCredits,
          balanceAfter: freshUser.currentCredits,
        },
      });

      // Propagate updated credits so downstream handlers have fresh data
      request.user = { ...user, currentCredits: freshUser.currentCredits };
    });

    this.logger.log(
      `User ${user.email} used feature '${featureCode}' — ${feature.creditCost} credit(s) deducted`,
    );

    return true;
  }
}
