import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StocktakesService } from './stocktakes.service';
import { SubmitStocktakeDto, QueryStocktakeDto } from './dto/stocktake.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@ApiTags('Module A8: Kiểm kê Kho & Đối soát Dữ liệu (Stocktakes)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('stocktakes')
export class StocktakesController {
  constructor(private readonly stocktakesService: StocktakesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách biên bản kiểm kê & đối soát số liệu thực tế',
  })
  async getStocktakes(
    @Query() query: QueryStocktakeDto,
    @BranchContext() effectiveBranch: string,
  ) {
    return await this.stocktakesService.getStocktakes({
      ...query,
      branch: query.branch || effectiveBranch,
    });
  }

  @Get('snapshot')
  @ApiOperation({
    summary: 'Chụp nhanh (Targeted Snapshot) số dư tồn kho trên Shard của chi nhánh để lập bảng kiểm đếm',
  })
  @ApiQuery({ name: 'branch', required: false, enum: ['HN', 'HCM', 'DN'] })
  async getBranchStockSnapshot(
    @Query('branch') branch?: string,
    @BranchContext() effectiveBranch?: string,
  ) {
    return await this.stocktakesService.getBranchStockSnapshot(branch || effectiveBranch);
  }

  @Get('quality-batches')
  @ApiOperation({
    summary: 'Tra cứu lô hàng sản xuất (CO/CQ) và biên bản kiểm định KCS (quality_inspections)',
  })
  async getQualityAndBatches() {
    return await this.stocktakesService.getQualityAndBatches();
  }

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Nạp biên bản kiểm đếm thực tế & tự động tính toán độ lệch (variance)',
    description:
      'Tự động đối chiếu actual_qty với system_qty trên Shard. Nếu khớp 100% -> BALANCED; nếu có chênh lệch -> DISCREPANCY_FOUND.',
  })
  async submitStocktake(@Body() dto: SubmitStocktakeDto, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Kiểm toán viên Nội bộ';
    return await this.stocktakesService.submitStocktake(dto, actor);
  }

  @Post(':stocktakeCode/reconcile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Duyệt điều chỉnh cân đối tồn kho bằng Giao dịch Phân tán ACID (Data Reconciliation)',
    description:
      'Cập nhật số dư inventory_stocks trên Shard tương ứng về actual_qty, chuyển biên bản sang ADJUSTED và ghi material_audit_logs nguyên tử.',
  })
  @ApiParam({ name: 'stocktakeCode', example: 'ST-HN-2026-10' })
  async reconcileStocktake(@Param('stocktakeCode') stocktakeCode: string, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Trưởng ban Kiểm kê';
    return await this.stocktakesService.reconcileStocktake(stocktakeCode.trim(), actor);
  }
}
