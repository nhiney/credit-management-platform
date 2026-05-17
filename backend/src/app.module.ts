import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PackagesModule } from './modules/packages/packages.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AiModule } from './modules/ai/ai.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PackagesModule,
    PurchaseModule,
    TransactionsModule,
    AiModule,
  ],
  providers: [
    // Apply JWT guard globally — use @Public() to opt-out specific routes
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
