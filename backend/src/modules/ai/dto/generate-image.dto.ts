import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class GenerateImageDto {
  @ApiProperty({ example: 'A futuristic city at sunset, cyberpunk style' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt: string;
}
