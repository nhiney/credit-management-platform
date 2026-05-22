import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { AutoPostDto } from './dto/auto-post.dto';
import { AnalyzeDataDto } from './dto/analyze-data.dto';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { RequireFeatureGuard } from '../../common/guards/require-feature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth('JWT')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @UseGuards(RequireFeatureGuard)
  @RequireFeature('generate_image')
  @ApiOperation({
    summary: 'Generate an AI image (costs 3 credits, requires Pro+)',
    description:
      'Deducts 3 credits atomically before invoking the AI service. ' +
      'Returns 403 if plan does not include generate_image, ' +
      '422 if insufficient credits.',
  })
  @ApiResponse({ status: 201, description: 'Image generated successfully' })
  @ApiResponse({ status: 403, description: 'Plan does not include this feature' })
  @ApiResponse({ status: 422, description: 'Insufficient credits' })
  generate(@Body() dto: GenerateImageDto, @CurrentUser() user: { id: string }) {
    return this.aiService.generateImage(dto.prompt, user.id);
  }

  @Post('auto-post')
  @UseGuards(RequireFeatureGuard)
  @RequireFeature('auto_post')
  @ApiOperation({
    summary: 'Auto-schedule a social media post (costs 1 credit, requires Basic+)',
  })
  @ApiResponse({ status: 201, description: 'Post scheduled successfully' })
  @ApiResponse({ status: 403, description: 'Plan does not include this feature' })
  @ApiResponse({ status: 422, description: 'Insufficient credits' })
  autoPost(@Body() dto: AutoPostDto, @CurrentUser() user: { id: string }) {
    return this.aiService.autoPost(dto.content, user.id);
  }

  @Post('analyze')
  @UseGuards(RequireFeatureGuard)
  @RequireFeature('analyze_data')
  @ApiOperation({
    summary: 'Analyze data with AI (costs 5 credits, requires Enterprise)',
  })
  @ApiResponse({ status: 201, description: 'Analysis completed' })
  @ApiResponse({ status: 403, description: 'Plan does not include this feature' })
  @ApiResponse({ status: 422, description: 'Insufficient credits' })
  analyze(@Body() dto: AnalyzeDataDto, @CurrentUser() user: { id: string }) {
    return this.aiService.analyzeData(dto.data, user.id);
  }
}
