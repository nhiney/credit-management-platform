import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsPositive, IsArray, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageDto {
  @ApiProperty({ example: 'Pro' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Ideal for growing teams' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  creditAmount: number;

  @ApiPropertyOptional({ example: ['uuid-feature-1', 'uuid-feature-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  featureIds?: string[];
}
