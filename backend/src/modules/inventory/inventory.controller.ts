import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { UpdateThresholdsDto } from './dto/update-thresholds.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BranchGuard } from '../../common/guards/branch.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constants';
import { AuthenticatedUser } from '../../common/interfaces/user-payload.interface';

const INVENTORY_READERS = [UserRole.MANAGER_HN, UserRole.MANAGER_HCM, UserRole.AUDITOR];

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stocks')
  @Roles(...INVENTORY_READERS)
  @ApiOperation({ summary: 'Tồn kho theo chi nhánh (Targeted Query theo shard key)' })
  @ApiQuery({ name: 'branch', required: false, enum: ['HN', 'HCM', 'DN', 'ALL'] })
  @ApiQuery({ name: 'q', required: false })
  getStocks(@BranchContext() branch: string, @Query('q') keyword?: string) {
    return this.inventoryService.getStocks(branch, typeof keyword === 'string' ? keyword : undefined);
  }

  @Get('low-stock')
  @Roles(...INVENTORY_READERS)
  @ApiOperation({ summary: 'Cảnh báo vật tư dưới ngưỡng tối thiểu' })
  @ApiQuery({ name: 'branch', required: false, enum: ['HN', 'HCM', 'DN', 'ALL'] })
  getLowStock(@BranchContext() branch: string) {
    return this.inventoryService.getLowStock(branch);
  }

  @Get('summary')
  @Roles(...INVENTORY_READERS)
  @ApiOperation({ summary: 'Tổng hợp giá trị tồn và số cảnh báo' })
  @ApiQuery({ name: 'branch', required: false, enum: ['HN', 'HCM', 'DN', 'ALL'] })
  getSummary(@BranchContext() branch: string) {
    return this.inventoryService.getSummary(branch);
  }

  @Put('stocks/:branch/:materialCode/thresholds')
  @Roles(UserRole.MANAGER_HN, UserRole.MANAGER_HCM)
  @ApiOperation({ summary: 'Cập nhật ngưỡng tối thiểu và tối đa' })
  updateThresholds(
    @Param('branch') branch: string,
    @Param('materialCode') materialCode: string,
    @Body() dto: UpdateThresholdsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.updateThresholds(branch, materialCode, dto, user);
  }
}
