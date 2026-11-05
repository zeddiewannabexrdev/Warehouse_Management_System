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
import { StockTransfersService } from './stock-transfers.service';
import {
  DispatchStockTransferDto,
  QueryStockTransferDto,
  CreateMaterialReturnDto,
} from './dto/stock-transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@ApiTags('Module A7: Điều phối & Luân chuyển Liên kho (Stock Transfers)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private readonly stockTransfersService: StockTransfersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách phiếu điều chuyển vật tư liên kho & Telemetry Cross-Zone Sharding',
    description:
      'Tra cứu trạng thái luân chuyển vật tư giữa Tổng kho Miền Bắc (ZONE_HN - Shard 1) và Tổng kho Miền Nam (ZONE_HCM - Shard 2).',
  })
  async getStockTransfers(
    @Query() query: QueryStockTransferDto,
    @BranchContext() effectiveBranch: string,
  ) {
    return await this.stockTransfersService.getStockTransfers({
      ...query,
      branch: query.branch || effectiveBranch,
    });
  }

  @Post('dispatch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Xuất điều chuyển vật tư liên kho từ Shard nguồn (Cross-Shard Outbound ACID Transaction)',
    description:
      'Thực thi giao dịch nguyên tử: Kiểm tra & trừ tồn kho khả dụng tại Shard nguồn (from_branch), tạo phiếu stock_transfers (IN_TRANSIT) và ghi material_audit_logs.',
  })
  async dispatchTransfer(@Body() dto: DispatchStockTransferDto, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Điều phối viên Tổng kho';
    return await this.stockTransfersService.dispatchTransfer(dto, actor);
  }

  @Post(':transferCode/receive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác nhận tiếp nhận vật tư tại Shard đích (Cross-Shard Inbound ACID Transaction)',
    description:
      'Thực thi giao dịch nguyên tử: Chuyển trạng thái phiếu sang RECEIVED, cộng tồn kho vào Shard đích (to_branch) và ghi material_audit_logs.',
  })
  @ApiParam({ name: 'transferCode', example: 'TRF-2026-001' })
  async receiveTransfer(@Param('transferCode') transferCode: string, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Thủ kho Chi nhánh Đích';
    return await this.stockTransfersService.receiveTransfer(transferCode.trim(), actor);
  }

  @Post(':transferCode/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hủy lệnh điều chuyển đang In-Transit & hoàn trả tồn kho về Shard nguồn',
  })
  @ApiParam({ name: 'transferCode', example: 'TRF-2026-001' })
  async cancelTransfer(@Param('transferCode') transferCode: string, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Điều phối viên Tổng kho';
    return await this.stockTransfersService.cancelTransfer(transferCode.trim(), actor);
  }

  @Get('returns')
  @ApiOperation({
    summary: 'Lấy danh sách phiếu thu hồi / hoàn trả vật tư từ công trình (material_returns)',
  })
  @ApiQuery({ name: 'branch', required: false, enum: ['HN', 'HCM', 'DN', 'ALL'] })
  async getMaterialReturns(@Query('branch') branch?: string) {
    return await this.stockTransfersService.getMaterialReturns(branch);
  }

  @Post('returns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo biên bản thu hồi vật tư thừa / hư hỏng từ công trường & hoàn nhập kho',
  })
  async createMaterialReturn(@Body() dto: CreateMaterialReturnDto, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Thủ kho Tiếp nhận';
    return await this.stockTransfersService.createMaterialReturn(dto, actor);
  }
}
