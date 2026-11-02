import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Materials (Danh mục Vật tư & Lược đồ Đa hình)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('categories')
  @ApiOperation({
    summary: 'Lấy danh sách nhóm vật tư kèm schema template cho Polymorphic Form',
  })
  async getCategories() {
    return await this.materialsService.getCategories();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Thống kê tổng hợp số lượng và giá định mức theo nhóm vật tư',
  })
  async getStats() {
    return await this.materialsService.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách vật tư (Phân trang, lọc theo nhóm, tìm kiếm text index)',
  })
  async findAll(@Query() query: QueryMaterialDto) {
    return await this.materialsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết vật tư theo ID hoặc mã vật tư' })
  @ApiParam({ name: 'id', description: 'ObjectId hoặc material_code' })
  async findById(@Param('id') id: string) {
    return await this.materialsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo mới vật tư với cấu trúc thông số kỹ thuật đa hình (Polymorphic)',
  })
  @ApiResponse({ status: 201, description: 'Vật tư đã được tạo thành công' })
  async create(@Body() dto: CreateMaterialDto) {
    return await this.materialsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin và thông số kỹ thuật của vật tư' })
  @ApiParam({ name: 'id', description: 'ObjectId hoặc material_code' })
  async update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return await this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa vật tư khỏi hệ thống' })
  @ApiParam({ name: 'id', description: 'ObjectId hoặc material_code' })
  async delete(@Param('id') id: string) {
    return await this.materialsService.delete(id);
  }
}
