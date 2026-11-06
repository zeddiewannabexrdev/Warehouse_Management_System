import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { UserRole } from '../../../common/constants/roles.constants';

export class QueryUserDto {
  @ApiProperty({ required: false, description: 'Từ khóa tìm kiếm (theo họ tên, email)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: ['HN', 'HCM', 'DN', 'ALL'], required: false, description: 'Lọc theo chi nhánh làm việc' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiProperty({ enum: UserRole, required: false, description: 'Lọc theo vai trò' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false, description: 'Lọc theo trạng thái hoạt động: active, inactive' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
