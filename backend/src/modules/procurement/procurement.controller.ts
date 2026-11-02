import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProcurementService } from './procurement.service';
import { CreateSupplierDto, QuerySupplierDto } from './dto/create-supplier.dto';
import {
  CreatePurchaseOrderDto,
  QueryPurchaseOrderDto,
  UpdatePOStatusDto,
} from './dto/create-purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Module A3: Quản lý Nhà cung cấp & Mua sắm (Procurement)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  // -------------------------------------------------------------
  // 1. NHÀ CUNG CẤP & ĐÁNH GIÁ SLA
  // -------------------------------------------------------------

  @Get('suppliers')
  @ApiOperation({
    summary: 'Danh sách Nhà cung cấp & Đánh giá SLA (Global Reference)',
    description: 'Tra cứu danh sách nhà cung cấp từ bảng toàn cục, tổng hợp hợp đồng và điểm đánh giá SLA.',
  })
  @ApiResponse({ status: 200, description: 'Danh sách nhà cung cấp trả về thành công' })
  async getSuppliers(@Query() query: QuerySupplierDto) {
    return this.procurementService.getSuppliers(query);
  }

  @Get('suppliers/:id')
  @ApiOperation({
    summary: 'Chi tiết Nhà cung cấp, Hợp đồng và Đơn PO đã cấp',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId của Nhà cung cấp' })
  async getSupplierById(@Param('id') id: string) {
    return this.procurementService.getSupplierById(id);
  }

  @Post('suppliers')
  @ApiOperation({
    summary: 'Thêm mới Đối tác Nhà cung cấp',
    description: 'Thêm mới hồ sơ nhà cung cấp vào bảng master suppliers trên Primary Shard.',
  })
  @ApiResponse({ status: 201, description: 'Tạo mới nhà cung cấp thành công' })
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(dto);
  }

  // -------------------------------------------------------------
  // 2. ĐƠN MUA HÀNG (PO) & ĐỊNH TUYẾN SHARD
  // -------------------------------------------------------------

  @Get('purchase-orders')
  @ApiOperation({
    summary: 'Danh sách Đơn mua hàng (PO) & Phân tích Định tuyến',
    description: 'Truy vấn có `warehouse_branch` sẽ kích hoạt Targeted Query; không có sẽ kích hoạt Scatter-Gather toàn cụm.',
  })
  @ApiResponse({ status: 200, description: 'Danh sách đơn hàng kèm telemetry routing_stats' })
  async getPurchaseOrders(@Query() query: QueryPurchaseOrderDto) {
    return this.procurementService.getPurchaseOrders(query);
  }

  @Post('purchase-orders')
  @ApiOperation({
    summary: 'Tạo Đơn mua hàng với Giao dịch Phân tán Đa tài liệu (ACID Transaction)',
    description: 'Mở MongoDB Client Session Transaction: cập nhật purchase_orders, kiểm tra hợp đồng, và ghi material_audit_logs với writeConcern majority.',
  })
  @ApiResponse({ status: 201, description: 'Giao dịch phân tán commit thành công' })
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    const userEmail = req?.user?.email || 'procurement.lead@wms.vn';
    return this.procurementService.createPurchaseOrder(dto, userEmail);
  }

  @Patch('purchase-orders/:id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái Đơn mua hàng (DRAFT, APPROVED, DELIVERED, CANCELLED)',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId của Đơn mua hàng' })
  async updatePOStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePOStatusDto,
    @Req() req: any,
  ) {
    const userEmail = req?.user?.email || 'procurement.lead@wms.vn';
    return this.procurementService.updatePOStatus(poId_clean(id), dto, userEmail);
  }

  // -------------------------------------------------------------
  // 3. PHÂN TÍCH TỔNG HỢP CHI TIÊU MUA SẮM
  // -------------------------------------------------------------

  @Get('analytics')
  @ApiOperation({
    summary: 'Báo cáo Tổng hợp Mua sắm & Hiệu suất Cung ứng',
    description: 'Thực thi pipeline phân tán $facet và $lookup tổng hợp chi tiêu theo nhà cung cấp và theo chi nhánh.',
  })
  async getProcurementAnalytics() {
    return this.procurementService.getProcurementAnalytics();
  }
}

function poId_clean(id: string): string {
  return id ? id.trim() : '';
}

