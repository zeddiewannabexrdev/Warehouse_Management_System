import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StocktakeItemInputDto {
  @ApiProperty({ example: 'MAT-STEEL-D20', description: 'Mã vật tư kiểm đếm' })
  @IsString()
  @IsNotEmpty()
  material_code!: string;

  @ApiProperty({ example: 85, description: 'Số lượng đếm thực tế tại kệ (>= 0)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actual_qty!: number;

  @ApiPropertyOptional({ example: 'Khớp 100% thẻ kho', description: 'Ghi chú / giải trình chênh lệch' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class SubmitStocktakeDto {
  @ApiPropertyOptional({ example: 'ST-HN-2026-11', description: 'Mã biên bản kiểm kê (Tự sinh nếu để trống)' })
  @IsOptional()
  @IsString()
  stocktake_code?: string;

  @ApiProperty({ enum: ['HN', 'HCM', 'DN'], example: 'HN', description: 'Chi nhánh kho kiểm kê' })
  @IsEnum(['HN', 'HCM', 'DN'])
  warehouse_branch!: 'HN' | 'HCM' | 'DN';

  @ApiPropertyOptional({ example: 'WH-HN-01', description: 'Mã kho vật lý' })
  @IsOptional()
  @IsString()
  warehouse_code?: string;

  @ApiPropertyOptional({ example: 'Ban Kiểm toán Nội bộ - Đỗ Thu Hương', description: 'Kiểm toán viên phụ trách' })
  @IsOptional()
  @IsString()
  auditor?: string;

  @ApiProperty({ type: [StocktakeItemInputDto], description: 'Danh sách mặt hàng kiểm đếm thực tế' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StocktakeItemInputDto)
  items!: StocktakeItemInputDto[];
}

export class QueryStocktakeDto {
  @ApiPropertyOptional({ enum: ['HN', 'HCM', 'DN', 'ALL'], description: 'Lọc theo chi nhánh kho' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    enum: ['BALANCED', 'DISCREPANCY_FOUND', 'ADJUSTED', 'ALL'],
    description: 'Lọc theo trạng thái đối soát',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
