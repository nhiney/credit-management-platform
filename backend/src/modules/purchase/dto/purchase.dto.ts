import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PurchaseDto {
  @ApiProperty({ description: 'UUID of the package to purchase' })
  @IsUUID('4')
  packageId: string;
}
