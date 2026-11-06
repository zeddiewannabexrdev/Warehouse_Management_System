import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, Matches, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Mã nhà cung cấp (ví dụ: SUP-HPG-01)', example: 'SUP-HPG-01' })
  @IsString()
  @IsNotEmpty()
  supplier_code!: string;

  @ApiProperty({ description: 'Tên đầy đủ công ty / doanh nghiệp', example: 'Công ty Cổ phần Tập đoàn Hòa Phát' })
  @IsString()
  @IsNotEmpty()
  company_name!: string;

  @ApiProperty({ description: 'Mã số thuế doanh nghiệp (10-13 chữ số)', example: '0900224567' })
  @IsString()
  @Matches(/^[0-9]{10,13}$/, { message: 'Mã số thuế phải gồm từ 10 đến 13 chữ số hợp lệ' })
  tax_id!: string;

  @ApiProperty({ description: 'Số điện thoại liên hệ', example: '02439747777' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'Email đại diện giao dịch', example: 'kinhdoanh@hoaphat.com.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  email!: string;

  @ApiPropertyOptional({ description: 'Địa chỉ trụ sở chính', example: 'KCN Phố Nối A, Xã Giai Phạm, Huyện Yên Mỹ, Hưng Yên' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Điểm đánh giá uy tín chất lượng (0 - 100)', example: 96.5, default: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rating_score?: number = 90;
}

export class QuerySupplierDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (tên, mã NCC, MST)' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Điểm đánh giá tối thiểu (0 - 100)' })
  @IsOptional()
  min_rating?: number;
}

