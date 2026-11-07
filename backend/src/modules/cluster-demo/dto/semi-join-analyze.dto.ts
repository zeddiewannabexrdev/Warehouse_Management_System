import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SemiJoinAnalyzeDto {
  @ApiProperty({
    example: 'HCM',
    enum: ['HCM', 'HN', 'ALL'],
    required: false,
    description: 'Chi nhánh mục tiêu đại diện cho Shard phân tán (HCM = Shard 2:27020, HN = Shard 1:27018)',
  })
  @IsOptional()
  @IsIn(['HCM', 'HN', 'ALL'])
  targetBranch?: 'HCM' | 'HN' | 'ALL';

  @ApiProperty({
    example: 0,
    required: false,
    description: 'Ngưỡng tồn kho tối thiểu cần truy vấn tại Shard',
  })
  @IsOptional()
  @IsNumber()
  minQuantity?: number;

  @ApiProperty({
    example: '',
    required: false,
    description: 'Từ khóa lọc mã hoặc tên vật tư',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
