import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMaterialDto {
  @ApiPropertyOptional({ example: 1, description: 'Số trang', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Số lượng mục trên một trang', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'CAT-STEEL', description: 'Lọc theo nhóm vật tư' })
  @IsOptional()
  @IsString()
  category_code?: string;

  @ApiPropertyOptional({ example: 'Hòa Phát', description: 'Từ khóa tìm kiếm theo tên, mã hoặc barcode' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Lọc theo trạng thái hoạt động' })
  @IsOptional()
  @IsString()
  is_active?: string;

  @ApiPropertyOptional({ example: 'created_at', description: 'Trường sắp xếp' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'material_code';

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'], description: 'Hướng sắp xếp' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
