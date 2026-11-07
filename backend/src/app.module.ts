import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CoreModule } from './modules/core/core.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module';
import { StockTransfersModule } from './modules/stock-transfers/stock-transfers.module';
import { StocktakesModule } from './modules/stocktakes/stocktakes.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ClusterDemoModule } from './modules/cluster-demo/cluster-demo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    CoreModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    BranchesModule,
    DashboardModule,
    MaterialsModule,
    WarehousesModule,
    ProcurementModule,
    InventoryModule,
    StockMovementsModule,
    StockTransfersModule,
    StocktakesModule,
    ReportsModule,
    ClusterDemoModule,
  ],
})
export class AppModule {}
