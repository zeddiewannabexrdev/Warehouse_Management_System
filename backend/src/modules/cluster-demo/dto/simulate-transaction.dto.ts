import { IsString, IsNotEmpty, IsNumber, IsIn, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimulateTransactionDto {
  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'FAIL_ROLLBACK'] })
  @IsIn(['SUCCESS', 'FAIL_ROLLBACK'])
  mode!: 'SUCCESS' | 'FAIL_ROLLBACK';

  @ApiProperty({ example: 'HN', enum: ['HN', 'HCM'] })
  @IsIn(['HN', 'HCM'])
  warehouseBranch!: string;

  @ApiProperty({ example: 'MAT-STEEL-D20' })
  @IsNotEmpty()
  @IsString()
  materialCode!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 'INSUFFICIENT_STOCK', enum: ['INSUFFICIENT_STOCK', 'VALIDATION_ERROR', 'MID_TXN_ABORT'], required: false })
  @IsOptional()
  @IsIn(['INSUFFICIENT_STOCK', 'VALIDATION_ERROR', 'MID_TXN_ABORT'])
  errorType?: 'INSUFFICIENT_STOCK' | 'VALIDATION_ERROR' | 'MID_TXN_ABORT';
}
