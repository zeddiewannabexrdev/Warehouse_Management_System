import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'MAT-STEEL-D25', description: 'Mã định danh vật tư duy nhất' })
  @IsString({ message: 'Mã vật tư phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã vật tư không được để trống' })
  material_code!: string;

  @ApiProperty({ example: 'Thép thanh vằn D25 CB500V Hòa Phát', description: 'Tên vật tư' })
  @IsString({ message: 'Tên vật tư phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên vật tư không được để trống' })
  name!: string;

  @ApiProperty({ example: 'CAT-STEEL', description: 'Mã nhóm vật tư (CAT-STEEL, CAT-CABLE, CAT-CEMENT, CAT-PAINT, ...)' })
  @IsString({ message: 'Mã nhóm vật tư phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã nhóm vật tư không được để trống' })
  category_code!: string;

  @ApiProperty({ example: 'Tấn', description: 'Đơn vị tính tiêu chuẩn' })
  @IsString({ message: 'Đơn vị tính phải là chuỗi' })
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  unit!: string;

  @ApiPropertyOptional({ example: 'Thép cốt bê tông chịu lực cao dùng cho móng công trình lớn', description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: {
      standard: 'TCVN 1651-2:2018',
      diameter_mm: 25,
      grade: 'CB500V',
      tensile_strength_mpa: 600,
      material: 'Thép hợp kim carbon',
    },
    description: 'Thông số kỹ thuật đa hình (Polymorphic Specifications) thay đổi theo nhóm vật tư',
  })
  @IsObject({ message: 'Thông số kỹ thuật (specifications) phải là một object' })
  @IsNotEmpty({ message: 'Thông số kỹ thuật không được để trống' })
  specifications!: Record<string, any>;

  @ApiProperty({ example: 16800000, description: 'Đơn giá định mức tiêu chuẩn (VNĐ)' })
  @IsNumber({}, { message: 'Đơn giá phải là số' })
  @Min(0, { message: 'Đơn giá không thể âm' })
  standard_price!: number;

  @ApiPropertyOptional({ example: '8934567890199', description: 'Mã vạch Barcode / QR' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: true, description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
