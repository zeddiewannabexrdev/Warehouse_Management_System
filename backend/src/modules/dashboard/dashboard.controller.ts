import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Lấy dữ liệu tổng quan kho bãi và trạng thái kết nối CSDL Phân tán' })
  @ApiQuery({ name: 'branch', required: false, enum: ['HN', 'HCM', 'DN', 'ALL'] })
  async getOverview(@BranchContext() branch: string) {
    return await this.dashboardService.getOverview(branch);
  }
}
