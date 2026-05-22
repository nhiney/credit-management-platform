import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { UserPackageStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IPackageRepository } from '../../domain/interfaces/package.repository.interface';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';
import { TransactionFactory } from '../../domain/factories/transaction.factory';
import { PurchaseDto } from './dto/purchase.dto';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    @Inject(INJECTION_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepo: IPackageRepository,
    private readonly prisma: PrismaService,
  ) {}

  async purchasePackage(userId: string, dto: PurchaseDto) {
    const pkg = await this.packageRepo.findActiveById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found or is no longer available');
    }

    const alreadyOwned = await this.packageRepo.findUserActivePackage(userId, pkg.id);
    if (alreadyOwned) {
      throw new BadRequestException('You already own this package');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { currentCredits: { increment: pkg.creditAmount } },
      });

      const userPackage = await tx.userPackage.create({
        data: { userId, packageId: pkg.id, status: UserPackageStatus.ACTIVE },
      });

      const txData = TransactionFactory.build({
        userId,
        type: TransactionType.CREDIT_IN,
        amount: pkg.creditAmount,
        currentBalance: user.currentCredits,
        packageId: pkg.id,
        description: `Purchased package: ${pkg.name}`,
        contextId: pkg.id,
      });

      const transaction = await tx.transaction.create({ data: txData });

      return { updatedUser, userPackage, transaction };
    });

    this.logger.log(`User ${userId} purchased '${pkg.name}' — +${pkg.creditAmount} credits`);

    return {
      message: `Successfully purchased the ${pkg.name} package`,
      creditsAdded: pkg.creditAmount,
      newBalance: result.updatedUser.currentCredits,
      transaction: result.transaction,
    };
  }

  async cancelPackage(userId: string, packageId: string) {
    const userPackage = await this.prisma.userPackage.findFirst({
      where: { userId, packageId, status: UserPackageStatus.ACTIVE },
      include: { package: true },
    });

    if (!userPackage) {
      throw new NotFoundException('Active subscription not found');
    }

    await this.prisma.userPackage.update({
      where: { id: userPackage.id },
      data: { status: UserPackageStatus.CANCELLED },
    });

    this.logger.log(`User ${userId} cancelled package '${userPackage.package.name}'`);

    return { message: `Successfully cancelled the ${userPackage.package.name} package` };
  }
}
