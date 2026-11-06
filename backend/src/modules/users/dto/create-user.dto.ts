import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/constants/roles.constants';

export class CreateUserDto {
  @ApiProperty({ example: 'nguyen.van.a@wms.enterprise.vn', description: 'Email đăng nhập hệ thống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @ApiProperty({ example: 'Wms@123456', description: 'Mật khẩu ban đầu' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên người dùng' })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER_HN, description: 'Vai trò trong hệ thống RBAC' })
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role!: UserRole;

  @ApiProperty({ enum: ['HN', 'HCM', 'DN', 'ALL'], example: 'HN', description: 'Chi nhánh làm việc gắn với Shard cụm phân tán' })
  @IsEnum(['HN', 'HCM', 'DN', 'ALL'], { message: 'Chi nhánh phải là HN, HCM, DN hoặc ALL' })
  branch!: 'HN' | 'HCM' | 'DN' | 'ALL';

  @ApiProperty({ example: '0987654321', required: false, description: 'Số điện thoại liên hệ' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
