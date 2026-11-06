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

export class TransferItemDto {
  @ApiProperty({ example: 'MAT-STEEL-D20', description: 'Mã vật tư điều chuyển' })
  @IsString()
  @IsNotEmpty()
  material_code!: string;

  @ApiProperty({ example: 10, description: 'Số lượng điều chuyển (> 0)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Tấn', description: 'Đơn vị tính' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class DispatchStockTransferDto {
  @ApiPropertyOptional({ example: 'TRF-2026-002', description: 'Mã phiếu điều chuyển (Tự sinh nếu để trống)' })
  @IsOptional()
  @IsString()
  transfer_code?: string;

  @ApiProperty({ enum: ['HN', 'HCM', 'DN'], example: 'HN', description: 'Chi nhánh kho xuất nguồn' })
  @IsEnum(['HN', 'HCM', 'DN'])
  from_branch!: 'HN' | 'HCM' | 'DN';

  @ApiProperty({ enum: ['HN', 'HCM', 'DN'], example: 'HCM', description: 'Chi nhánh kho nhận đích' })
  @IsEnum(['HN', 'HCM', 'DN'])
  to_branch!: 'HN' | 'HCM' | 'DN';

  @ApiPropertyOptional({ example: 'WH-HN-01', description: 'Mã kho nguồn' })
  @IsOptional()
  @IsString()
  from_warehouse?: string;

  @ApiPropertyOptional({ example: 'WH-HCM-01', description: 'Mã kho đích' })
  @IsOptional()
  @IsString()
  to_warehouse?: string;

  @ApiPropertyOptional({
    example: 'Vận chuyển đường sắt container liên vận Bắc - Nam',
    description: 'Phương thức vận chuyển liên vùng',
  })
  @IsOptional()
  @IsString()
  transport_method?: string;

  @ApiProperty({ type: [TransferItemDto], description: 'Danh mục vật tư luân chuyển' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items!: TransferItemDto[];
}

export class QueryStockTransferDto {
  @ApiPropertyOptional({ enum: ['HN', 'HCM', 'DN', 'ALL'], description: 'Lọc theo chi nhánh liên quan' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ enum: ['IN_TRANSIT', 'RECEIVED', 'CANCELLED', 'ALL'], description: 'Trạng thái phiếu điều chuyển' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo mã phiếu hoặc mã vật tư' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ReturnItemDto {
  @ApiProperty({ example: 'MAT-STEEL-D20' })
  @IsString()
  @IsNotEmpty()
  material_code!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Nguyên vẹn' })
  @IsOptional()
  @IsString()
  condition?: string;
}

export class CreateMaterialReturnDto {
  @ApiPropertyOptional({ example: 'RET-2026-002' })
  @IsOptional()
  @IsString()
  return_code?: string;

  @ApiProperty({ enum: ['HN', 'HCM', 'DN'], example: 'HN' })
  @IsEnum(['HN', 'HCM', 'DN'])
  warehouse_branch!: 'HN' | 'HCM' | 'DN';

  @ApiPropertyOptional({ example: 'WH-HN-01' })
  @IsOptional()
  @IsString()
  warehouse_code?: string;

  @ApiPropertyOptional({ example: 'PRJ-EXPRESS-01', description: 'Mã dự án hoặc ObjectId công trình hoàn trả' })
  @IsOptional()
  @IsString()
  project_code?: string;

  @ApiProperty({ enum: ['EXCESS_MATERIAL', 'DEFECTIVE', 'WRONG_SPECIFICATION'], example: 'EXCESS_MATERIAL' })
  @IsEnum(['EXCESS_MATERIAL', 'DEFECTIVE', 'WRONG_SPECIFICATION'])
  reason!: 'EXCESS_MATERIAL' | 'DEFECTIVE' | 'WRONG_SPECIFICATION';

  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items!: ReturnItemDto[];
}
