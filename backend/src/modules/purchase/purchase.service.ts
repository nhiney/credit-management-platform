import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, TransactionStatus, UserPackageStatus } from '@prisma/client';
import { PurchaseDto } from './dto/purchase.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async purchasePackage(userId: string, dto: PurchaseDto) {
    const pkg = await this.prisma.package.findFirst({
      where: { id: dto.packageId, isActive: true, deletedAt: null },
      include: { packageFeatures: { include: { feature: true } } },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found or is no longer available');
    }

    const alreadyOwned = await this.prisma.userPackage.findFirst({
      where: { userId, packageId: pkg.id, status: UserPackageStatus.ACTIVE },
    });

    if (alreadyOwned) {
      throw new BadRequestException('You already own this package');
    }

    const referenceId = `purchase-${userId}-${pkg.id}-${uuidv4()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { currentCredits: { increment: pkg.creditAmount } },
      });

      const userPackage = await tx.userPackage.create({
        data: {
          userId,
          packageId: pkg.id,
          status: UserPackageStatus.ACTIVE,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          packageId: pkg.id,
          amount: pkg.creditAmount,
          transactionType: TransactionType.CREDIT_IN,
          status: TransactionStatus.COMPLETED,
          description: `Purchased package: ${pkg.name}`,
          balanceBefore: user.currentCredits,
          balanceAfter: updatedUser.currentCredits,
          referenceId,
        },
      });

      return { updatedUser, userPackage, transaction, pkg };
    });

    this.logger.log(
      `User ${userId} purchased '${pkg.name}' — +${pkg.creditAmount} credits`,
    );

    return {
      message: `Successfully purchased the ${result.pkg.name} package`,
      creditsAdded: pkg.creditAmount,
      newBalance: result.updatedUser.currentCredits,
      transaction: result.transaction,
    };
  }
}
