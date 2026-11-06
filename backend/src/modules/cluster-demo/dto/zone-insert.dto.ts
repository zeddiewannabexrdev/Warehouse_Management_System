import { IsString, IsNotEmpty, IsIn, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ZoneInsertDto {
  @ApiProperty({ example: 'inventory_stocks', enum: ['inventory_stocks', 'goods_receipts'] })
  @IsIn(['inventory_stocks', 'goods_receipts'])
  collectionName!: 'inventory_stocks' | 'goods_receipts';

  @ApiProperty({ example: 'HN', enum: ['HN', 'HCM'] })
  @IsIn(['HN', 'HCM'])
  warehouseBranch!: 'HN' | 'HCM';

  @ApiProperty({ example: 'MAT-STEEL-D20' })
  @IsNotEmpty()
  @IsString()
  materialCode!: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 'WH-HN-01', required: false })
  @IsOptional()
  @IsString()
  warehouseCode?: string;

  @ApiProperty({ example: 'Nhập kho thử nghiệm Zone Sharding', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
