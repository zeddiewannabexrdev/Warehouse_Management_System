import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @ApiProperty({ description: 'Mã vật tư cần mua', example: 'MAT-STEEL-D20' })
  @IsString()
  @IsNotEmpty()
  material_code!: string;

  @ApiProperty({ description: 'Số lượng đặt mua', example: 50 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Đơn giá dự kiến (VNĐ/đơn vị)', example: 15500000 })
  @IsNumber()
  @Min(0)
  unit_price!: number;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ description: 'Mã đơn mua hàng PO (bỏ trống để hệ thống tự sinh mã theo chi nhánh)', example: 'PO-2026-HN-005' })
  @IsString()
  @IsOptional()
  po_code?: string;

  @ApiProperty({ description: 'ID định danh Nhà cung cấp (MongoDB ObjectId)', example: '672000000000000000000001' })
  @IsString()
  @IsNotEmpty()
  supplier_id!: string;

  @ApiProperty({ description: 'Chi nhánh kho tiếp nhận (HN, HCM, DN) - Shard Key', enum: ['HN', 'HCM', 'DN'], example: 'HN' })
  @IsEnum(['HN', 'HCM', 'DN'], { message: 'warehouse_branch phải thuộc một trong các chi nhánh: HN, HCM, DN' })
  warehouse_branch!: 'HN' | 'HCM' | 'DN';

  @ApiPropertyOptional({ description: 'Ngày dự kiến giao nhận', example: '2026-11-20' })
  @IsString()
  @IsOptional()
  expected_delivery_date?: string;

  @ApiProperty({ description: 'Danh sách các mặt hàng vật tư đặt mua', type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class QueryPurchaseOrderDto {
  @ApiPropertyOptional({ description: 'Chi nhánh nhận hàng (HN, HCM, DN). Nếu truyền sẽ kích hoạt Targeted Query đến 1 Shard; nếu bỏ trống sẽ kích hoạt Scatter-Gather toàn cụm' })
  @IsOptional()
  @IsString()
  warehouse_branch?: string;

  @ApiPropertyOptional({ description: 'Trạng thái đơn hàng', enum: ['DRAFT', 'APPROVED', 'DELIVERED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID Nhà cung cấp' })
  @IsOptional()
  @IsString()
  supplier_id?: string;
}

export class UpdatePOStatusDto {
  @ApiProperty({ description: 'Trạng thái cập nhật mới', enum: ['DRAFT', 'APPROVED', 'DELIVERED', 'CANCELLED'], example: 'APPROVED' })
  @IsEnum(['DRAFT', 'APPROVED', 'DELIVERED', 'CANCELLED'])
  status!: 'DRAFT' | 'APPROVED' | 'DELIVERED' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Ghi chú phê duyệt hoặc giao nhận' })
  @IsString()
  @IsOptional()
  notes?: string;
}

