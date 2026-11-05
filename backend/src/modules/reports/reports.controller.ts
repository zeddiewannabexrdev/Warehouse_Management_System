import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CalculateValuationDto, QueryReportsDto } from './dto/valuation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@ApiTags('Module A9: Báo cáo Thống kê Phân tán & Định giá Tồn kho (Distributed Reports & Valuations)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('distributed-analytics')
  @ApiOperation({
    summary: 'Thực thi bộ Aggregation Pipelines Phân tán ($facet, $lookup, Cảnh báo Tồn kho)',
    description:
      'Chạy các câu truy vấn nâng cao từ 04_advanced_queries.js trên cụm Sharded Cluster, kèm Telemetry so sánh SINGLE_SHARD vs SHARD_MERGE.',
  })
  async getDistributedAnalytics(
    @Query() query: QueryReportsDto,
    @BranchContext() effectiveBranch: string,
  ) {
    return await this.reportsService.getDistributedAnalytics({
      ...query,
      branch: query.branch || effectiveBranch,
    });
  }

  @Get('valuations')
  @ApiOperation({
    summary: 'Lấy báo cáo Định giá Vốn Hàng tồn kho (FIFO / Bình quân gia quyền / Đích danh)',
  })
  async getValuations(
    @Query() query: QueryReportsDto,
    @BranchContext() effectiveBranch: string,
  ) {
    return await this.reportsService.getValuations({
      ...query,
      branch: query.branch || effectiveBranch,
    });
  }

  @Post('valuations/calculate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tính toán & chốt kỳ Định giá Tồn kho mới từ dữ liệu Shard chi nhánh',
  })
  async calculateAndSaveValuation(@Body() dto: CalculateValuationDto, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Kế toán trưởng Vật tư';
    return await this.reportsService.calculateAndSaveValuation(dto, actor);
  }
}
