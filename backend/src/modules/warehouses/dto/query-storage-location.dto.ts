import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStorageLocationDto {
  @ApiPropertyOptional({ description: 'Mã tổng kho (ví dụ: WH-HN-01, WH-HCM-01)' })
  @IsOptional()
  @IsString()
  warehouse_code?: string;

  @ApiPropertyOptional({ description: 'Chi nhánh tổng kho (HN, HCM, DN)', enum: ['HN', 'HCM', 'DN'] })
  @IsOptional()
  @IsEnum(['HN', 'HCM', 'DN'])
  branch?: string;

  @ApiPropertyOptional({ description: 'Trạng thái ô kệ', enum: ['EMPTY', 'OCCUPIED', 'OVERLOAD', 'MAINTENANCE'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Dãy kệ (Aisle - ví dụ: A1, B2, D1)' })
  @IsOptional()
  @IsString()
  aisle?: string;
}

export class SearchEmptyLocationDto {
  @ApiPropertyOptional({ description: 'Tải trọng tối thiểu yêu cầu (kg)', default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_weight_kg?: number = 1000;
}

