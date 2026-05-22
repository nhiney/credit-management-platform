import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PurchaseDto {
  @ApiProperty({ description: 'ID of the package to purchase' })
  @IsString()
  @IsNotEmpty()
  packageId: string;
}
