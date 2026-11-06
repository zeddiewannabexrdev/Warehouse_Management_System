import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../../common/constants/roles.constants';

export class UpdateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn A (Cập nhật)', required: false, description: 'Họ và tên người dùng' })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi' })
  fullName?: string;

  @ApiProperty({ enum: UserRole, required: false, description: 'Vai trò trong hệ thống RBAC' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role?: UserRole;

  @ApiProperty({ enum: ['HN', 'HCM', 'DN', 'ALL'], required: false, description: 'Chi nhánh làm việc' })
  @IsOptional()
  @IsEnum(['HN', 'HCM', 'DN', 'ALL'], { message: 'Chi nhánh phải là HN, HCM, DN hoặc ALL' })
  branch?: 'HN' | 'HCM' | 'DN' | 'ALL';

  @ApiProperty({ example: '0987654321', required: false, description: 'Số điện thoại liên hệ' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: true, required: false, description: 'Trạng thái hoạt động tài khoản' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
