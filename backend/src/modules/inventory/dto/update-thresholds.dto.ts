import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateThresholdsDto {
  @ApiProperty({ example: 50, description: 'Ngưỡng tồn tối thiểu' })
  @IsNumber({}, { message: 'Ngưỡng tối thiểu phải là số' })
  @Min(0, { message: 'Ngưỡng tối thiểu không được âm' })
  min_threshold!: number;

  @ApiProperty({ example: 500, description: 'Ngưỡng tồn tối đa' })
  @IsNumber({}, { message: 'Ngưỡng tối đa phải là số' })
  @Min(0, { message: 'Ngưỡng tối đa không được âm' })
  max_threshold!: number;
}
