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
  ],
})
export class AppModule {}
