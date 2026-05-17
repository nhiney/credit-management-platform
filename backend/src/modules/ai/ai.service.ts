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
}
