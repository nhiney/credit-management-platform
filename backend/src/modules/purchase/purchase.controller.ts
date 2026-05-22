import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { PurchaseDto } from './dto/purchase.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('purchase')
@ApiBearerAuth('JWT')
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @ApiOperation({
    summary: 'Purchase a package',
    description:
      'Atomically adds credits to the user balance and records a CREDIT_IN transaction. Rolls back on any failure.',
  })
  @ApiResponse({ status: 201, description: 'Purchase successful' })
  @ApiResponse({ status: 400, description: 'Package already owned' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  purchase(@CurrentUser() user: { id: string }, @Body() dto: PurchaseDto) {
    return this.purchaseService.purchasePackage(user.id, dto);
  }

  @Delete(':packageId')
  @ApiOperation({ summary: 'Cancel an active package subscription' })
  @ApiResponse({ status: 200, description: 'Package cancelled' })
  @ApiResponse({ status: 404, description: 'Active subscription not found' })
  cancel(@CurrentUser() user: { id: string }, @Param('packageId') packageId: string) {
    return this.purchaseService.cancelPackage(user.id, packageId);
  }
}
