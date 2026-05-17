import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { RequireFeatureGuard } from '../../common/guards/require-feature.guard';

@Module({
  providers: [AiService, RequireFeatureGuard],
  controllers: [AiController],
})
export class AiModule {}
