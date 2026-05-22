import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AnalyzeDataDto {
  @ApiProperty({ example: 'Q1 revenue: $120k, Q2: $145k, Q3: $98k, Q4: $210k' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  data: string;
}
