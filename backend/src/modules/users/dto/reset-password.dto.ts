import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'Wms@123456',
    required: false,
    description: 'Mật khẩu mới (nếu bỏ trống, hệ thống sẽ gán mật khẩu mặc định: Wms@123456)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải từ 6 ký tự trở lên' })
  newPassword?: string;
}
