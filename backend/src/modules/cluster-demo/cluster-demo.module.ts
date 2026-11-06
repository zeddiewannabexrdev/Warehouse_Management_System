import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ClusterDemoController } from './cluster-demo.controller';
import { ClusterDemoService } from './cluster-demo.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ClusterDemoController],
  providers: [ClusterDemoService],
  exports: [ClusterDemoService],
})
export class ClusterDemoModule {}
