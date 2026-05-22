import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async generateImage(prompt: string, userId: string) {
    this.logger.log(`Generating image for user ${userId}: "${prompt}"`);

    // Simulates latency of an external AI call
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      prompt,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
      model: 'mock-diffusion-v2',
      generatedAt: new Date().toISOString(),
    };
  }

  async autoPost(content: string, userId: string) {
    this.logger.log(`Auto-posting for user ${userId}`);

    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      success: true,
      postId: `post_${Date.now()}`,
      content,
      scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      platforms: ['twitter', 'linkedin'],
    };
  }

  async analyzeData(data: string, userId: string) {
    this.logger.log(`Analyzing data for user ${userId}`);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const lines = data.split(/[,\n]/).filter(Boolean);
    return {
      success: true,
      summary: `Analyzed ${lines.length} data point(s).`,
      insights: [
        'Peak performance detected in the latest period.',
        'Growth trend of approximately 12% observed.',
        'Recommend focusing on top-performing segments.',
      ],
      sentiment: 'positive',
      confidence: 0.87,
      analyzedAt: new Date().toISOString(),
    };
  }
}
