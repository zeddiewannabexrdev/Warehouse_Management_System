import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class MovementBranchDto {
  @ApiProperty({ enum: ['HN', 'HCM', 'DN'] })
  @IsIn(['HN', 'HCM', 'DN'])
  branch!: string;

  @ApiProperty({ example: 'GI-HN-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;
}

export class MovementQueryDto {
  @ApiPropertyOptional({ enum: ['HN', 'HCM', 'DN', 'ALL'] })
  @IsOptional()
  @IsIn(['HN', 'HCM', 'DN', 'ALL'])
  branch?: string;

  @ApiPropertyOptional({ example: 'WH-HN-01' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  warehouse_code?: string;

  @ApiPropertyOptional({ example: 'MAT-STEEL-D20' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  material_code?: string;

  @ApiPropertyOptional({ description: 'Tìm chuỗi trong mục đích xuất (chỉ phiếu xuất)' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  purpose?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-11-07',
    description: 'Bao gồm hết ngày nếu không có giờ; UTC',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 1000000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

class CreateMovementDto {
  @ApiProperty({ enum: ['HN', 'HCM', 'DN'] })
  @IsIn(['HN', 'HCM', 'DN'])
  warehouse_branch!: string;

  @ApiProperty({ example: 'WH-HN-01' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  warehouse_code!: string;
}

export class ReceiptItemDto {
  @ApiProperty({ example: 'MAT-STEEL-D20' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  material_code!: string;

  @ApiProperty({ example: 10, minimum: 0, exclusiveMinimum: true })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  @Max(Number.MAX_SAFE_INTEGER)
  quantity!: number;

  @ApiProperty({ example: 15000000, minimum: 0, description: 'Đơn giá, tối đa 2 chữ số thập phân' })
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  unit_price!: number;
}

export class CreateReceiptDto extends CreateMovementDto {
  @ApiProperty({
    example: 'GR-HN-001',
    description: 'Duy nhất trong chi nhánh; giữ nguyên khi thử lại',
  })
  @Transform(trim)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/)
  receipt_code!: string;

  @ApiProperty({
    example: '2026-11-07T09:00:00.000Z',
    description:
      'Ngày ISO hợp lệ, phải phân tích được thành Date; không hỗ trợ dạng ngày compact hoặc tuần ISO',
  })
  @IsDateString({ strict: true })
  receipt_date!: string;

  @ApiPropertyOptional({ description: 'ObjectId nhà cung cấp có sẵn' })
  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @ApiProperty({ type: [ReceiptItemDto], minItems: 1, maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items!: ReceiptItemDto[];
}

export class CreateIssueDto extends CreateMovementDto {
  @ApiProperty({
    example: 'GI-HN-001',
    description: 'Duy nhất trong chi nhánh; giữ nguyên khi thử lại',
  })
  @Transform(trim)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/)
  issue_code!: string;

  @ApiProperty({
    example: '2026-11-07T10:00:00.000Z',
    description:
      'Ngày ISO hợp lệ, phải phân tích được thành Date; không hỗ trợ dạng ngày compact hoặc tuần ISO',
  })
  @IsDateString({ strict: true })
  issue_date!: string;

  @ApiProperty({ example: 'MAT-STEEL-D20' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  material_code!: string;

  @ApiProperty({ example: 5, minimum: 0, exclusiveMinimum: true })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  @Max(Number.MAX_SAFE_INTEGER)
  quantity!: number;

  @ApiProperty({ example: 'Cấp phát cho công trình A' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  purpose!: string;
}
