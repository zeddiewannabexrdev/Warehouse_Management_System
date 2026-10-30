import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái Backend Web API' })
  @SwaggerResponse({ status: 200, description: 'Backend is running' })
  checkAppHealth() {
    return this.healthService.getAppHealth();
  }

  @Public()
  @Get('database')
  @ApiOperation({ summary: 'Kiểm tra kết nối thực tế tới cụm MongoDB Sharded Cluster' })
  @SwaggerResponse({ status: 200, description: 'MongoDB connection state' })
  async checkDatabaseHealth() {
    return await this.healthService.getDatabaseHealth();
  }
}
