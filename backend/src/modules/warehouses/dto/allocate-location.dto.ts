import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class AllocateLocationDto {
  @ApiProperty({ description: 'Mã vị trí ô kệ (ví dụ: HN-A1-R01-B01)', example: 'HN-A1-R01-B01' })
  @IsString()
  @IsNotEmpty()
  location_code!: string;

  @ApiProperty({ description: 'Chi nhánh tổng kho (HN, HCM)', example: 'HN' })
  @IsString()
  @IsNotEmpty()
  warehouse_branch!: string;

  @ApiProperty({ description: 'Mã vật tư cần xếp vào ô', example: 'MAT-STEEL-D20' })
  @IsString()
  @IsNotEmpty()
  material_code!: string;

  @ApiProperty({ description: 'Số lượng vật tư', example: 20 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Khối lượng chiếm dụng thực tế (kg)', example: 3100 })
  @IsNumber()
  @Min(1)
  occupied_weight_kg!: number;

  @ApiProperty({ description: 'Mã lô sản xuất / kiểm định', example: 'BATCH-2026-ALLOC-01' })
  @IsString()
  @IsOptional()
  batch_number?: string;
}
