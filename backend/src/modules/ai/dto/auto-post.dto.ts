import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class AutoPostDto {
  @ApiProperty({ example: 'Excited to share our latest product update!' })
  @IsString()
  @MinLength(5)
  @MaxLength(280)
  content: string;
}
