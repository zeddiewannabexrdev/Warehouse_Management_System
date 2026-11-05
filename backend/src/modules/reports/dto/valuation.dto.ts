import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CalculateValuationDto {
  @ApiPropertyOptional({ example: 'VAL-HN-2026-11', description: 'Mã báo cáo định giá (Tự sinh nếu để trống)' })
  @IsOptional()
  @IsString()
  valuation_code?: string;

  @ApiProperty({ example: '2026-11', description: 'Kỳ kế toán định giá (YYYY-MM)' })
  @IsString()
  @IsNotEmpty()
  period!: string;

  @ApiProperty({ enum: ['HN', 'HCM', 'DN'], example: 'HN', description: 'Chi nhánh kho cần định giá' })
  @IsEnum(['HN', 'HCM', 'DN'])
  warehouse_branch!: 'HN' | 'HCM' | 'DN';

  @ApiProperty({
    enum: ['FIFO', 'WEIGHTED_AVERAGE', 'SPECIFIC_IDENTIFICATION'],
    example: 'FIFO',
    description: 'Phương pháp kế toán định giá vốn tồn kho',
  })
  @IsEnum(['FIFO', 'WEIGHTED_AVERAGE', 'SPECIFIC_IDENTIFICATION'])
  valuation_method!: 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_IDENTIFICATION';
}

export class QueryReportsDto {
  @ApiPropertyOptional({ enum: ['HN', 'HCM', 'DN', 'ALL'], description: 'Lọc theo chi nhánh tổng kho' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    enum: ['FIFO', 'WEIGHTED_AVERAGE', 'SPECIFIC_IDENTIFICATION'],
    description: 'Phương pháp tính toán chi tiết tồn kho',
  })
  @IsOptional()
  @IsString()
  valuation_method?: string;
}
