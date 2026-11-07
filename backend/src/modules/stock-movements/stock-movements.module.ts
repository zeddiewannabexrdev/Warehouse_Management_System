import { Module } from '@nestjs/common';
import { GoodsIssuesController, GoodsReceiptsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';

@Module({
  controllers: [GoodsReceiptsController, GoodsIssuesController],
  providers: [StockMovementsService],
})
export class StockMovementsModule {}
