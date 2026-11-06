import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import {
  QueryStorageLocationDto,
  SearchEmptyLocationDto,
} from './dto/query-storage-location.dto';
import { AllocateLocationDto } from './dto/allocate-location.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Warehouses & Storage Locations (Bản đồ tổng kho & Ô kệ)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh mục các tổng kho theo chi nhánh (HN, HCM, DN) kèm Shard phân vùng',
  })
  @ApiQuery({ name: 'branch', required: false, enum: ['HN', 'HCM', 'DN', 'ALL'] })
  async getWarehouses(@Query('branch') branch?: string) {
    return await this.warehousesService.getWarehouses(branch);
  }

  @Get('locations')
  @ApiOperation({
    summary: 'Lấy danh sách mặt bằng ô kệ theo kho (MINH CHỨNG: TARGETED QUERY)',
    description: 'Truy vấn ô kệ của kho Long Biên (HN) hoặc Cát Lái (HCM). Mongos Router chỉ gửi lệnh tới đúng 1 Shard node vật lý.',
  })
  async getStorageLocations(@Query() query: QueryStorageLocationDto) {
    return await this.warehousesService.getStorageLocations(query);
  }

  @Get('locations/search-empty')
  @ApiOperation({
    summary: 'Tìm kiếm ô kệ trống trên toàn quốc (MINH CHỨNG: SCATTER-GATHER QUERY)',
    description: 'Tìm kiếm các ô kệ còn trống thỏa mãn tải trọng tối thiểu. Mongos Router phải phát tán lệnh song song tới cả Shard 1 và Shard 2 (SHARD_MERGE).',
  })
  async searchEmptyLocations(@Query() dto: SearchEmptyLocationDto) {
    return await this.warehousesService.searchEmptyLocations(dto);
  }

  @Post('locations/allocate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xếp dỡ vật tư vào ô kệ (MINH CHỨNG: ACID MULTI-DOCUMENT TRANSACTION)',
    description: 'Thực thi giao dịch phân tán nguyên tử: Khóa ô kệ + Cập nhật tồn kho khả dụng + Ghi nhật ký kiểm toán với Write Concern majority.',
  })
  @ApiResponse({ status: 200, description: 'Giao dịch ACID thành công' })
  async allocateLocation(@Body() dto: AllocateLocationDto, @Req() req: any) {
    const actor = req.user?.fullName || req.user?.email || 'Thủ kho phụ trách';
    return await this.warehousesService.allocateLocation(dto, actor);
  }
}

