import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { INJECTION_TOKENS } from '../../common/constants/injection-tokens';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'fallback-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: INJECTION_TOKENS.USER_REPOSITORY, useClass: UserRepository },
  ],
  controllers: [AuthController],
  exports: [JwtModule, { provide: INJECTION_TOKENS.USER_REPOSITORY, useClass: UserRepository }],
})
export class AuthModule {}
