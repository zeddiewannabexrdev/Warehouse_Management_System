import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryExplainDto {
  @ApiProperty({ example: 'targeted', enum: ['targeted', 'scatter-gather', 'custom'] })
  @IsIn(['targeted', 'scatter-gather', 'custom'])
  scenario!: 'targeted' | 'scatter-gather' | 'custom';

  @ApiProperty({ example: 'inventory_stocks', required: false })
  @IsOptional()
  @IsString()
  collectionName?: string;

  @ApiProperty({ example: 'HN', required: false })
  @IsOptional()
  @IsString()
  warehouseBranch?: string;

  @ApiProperty({ example: 'MAT-STEEL-D20', required: false })
  @IsOptional()
  @IsString()
  materialCode?: string;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  maxQuantity?: number;
}
