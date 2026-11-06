import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClusterDemoService } from './cluster-demo.service';
import { QueryExplainDto } from './dto/query-explain.dto';
import { SimulateTransactionDto } from './dto/simulate-transaction.dto';
import { ZoneInsertDto } from './dto/zone-insert.dto';

@ApiTags('Cluster Demo Suite')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cluster')
export class ClusterDemoController {
  constructor(private readonly clusterDemoService: ClusterDemoService) {}

  @Get('topology')
  @ApiOperation({ summary: 'B10: Trực quan hóa cấu trúc cụm phân tán và trạng thái các node' })
  async getTopology() {
    return this.clusterDemoService.getTopology();
  }

  @Get('distribution')
  @ApiOperation({ summary: 'B10: Thống kê phân bổ dữ liệu Shard Distribution giữa Shard 1 và Shard 2' })
  async getDistribution(@Query('collection') collection?: string) {
    return this.clusterDemoService.getDistribution(collection);
  }

  @Post('explain')
  @ApiOperation({ summary: 'B11: Phân tích định tuyến truy vấn Targeted vs Scatter-Gather và Explain plan' })
  async explainQuery(@Body() dto: QueryExplainDto) {
    return this.clusterDemoService.explainQuery(dto);
  }

  @Post('transaction/simulate')
  @ApiOperation({ summary: 'B12: Mô phỏng giao dịch phân tán ACID và cơ chế Rollback an toàn' })
  async simulateTransaction(@Body() dto: SimulateTransactionDto) {
    return this.clusterDemoService.simulateTransaction(dto);
  }

  @Get('zone-sharding/tags')
  @ApiOperation({ summary: 'B13: Danh sách các Zone Tags cấu hình định tuyến địa lý' })
  async getZoneTags() {
    return this.clusterDemoService.getZoneTags();
  }

  @Post('zone-sharding/insert')
  @ApiOperation({ summary: 'B13: Ghi dữ liệu kiểm chứng Zone Sharding (HN -> Shard 1, HCM -> Shard 2)' })
  async insertZoneDocument(@Body() dto: ZoneInsertDto) {
    return this.clusterDemoService.insertZoneDocument(dto);
  }

  @Get('zone-sharding/inspect')
  @ApiOperation({ summary: 'B13: Trích xuất bằng chứng vị trí lưu trữ vật lý của tài liệu' })
  async inspectDocumentLocation(
    @Query('collection') collection: string,
    @Query('branch') branch: string,
    @Query('code') code: string,
  ) {
    return this.clusterDemoService.inspectDocumentLocation(collection || 'inventory_stocks', branch, code);
  }

  // ==========================================
  // MODULE 14: HIGH AVAILABILITY & REPLICA SET
  // ==========================================
  @Get('ha/status')
  @ApiOperation({ summary: 'B14: Trạng thái các Replica Set (ConfigRS, Shard1RS, Shard2RS) và cơ chế HA' })
  async getHaStatus() {
    return this.clusterDemoService.getHaStatus();
  }

  @Post('ha/simulate-failover')
  @ApiOperation({ summary: 'B14: Mô phỏng kịch bản ngắt Primary và bầu chọn thủ lĩnh mới (Stepdown & Election)' })
  async simulateFailover(@Body('replicaSet') replicaSet: string) {
    return this.clusterDemoService.simulateFailover(replicaSet || 'shard1ReplSet');
  }

  @Get('ha/ping')
  @ApiOperation({ summary: 'B14: Đo lường round-trip latency và replication lag giữa các node' })
  async pingNodes() {
    return this.clusterDemoService.pingNodes();
  }

  // ==========================================
  // MODULE 15: AUDIT LOGGING & TTL EXPIRATION
  // ==========================================
  @Get('audit/logs')
  @ApiOperation({ summary: 'B15: Danh sách nhật ký kiểm toán phân tán với bộ lọc đa chiều' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('branch') branch?: string,
    @Query('search') search?: string,
  ) {
    return this.clusterDemoService.getAuditLogs({ page, limit, action, branch, search });
  }

  @Get('audit/ttl-status')
  @ApiOperation({ summary: 'B15: Trạng thái chỉ mục TTL Index và chính sách tự động xóa sau 90 ngày' })
  async getTtlStatus() {
    return this.clusterDemoService.getTtlStatus();
  }

  @Post('audit/simulate-event')
  @ApiOperation({ summary: 'B15: Tạo bản ghi kiểm toán thử nghiệm kiểm chứng TTL Index' })
  async simulateAuditEvent(
    @Body() body: { action: string; details: string; branch: string; resource: string },
    @CurrentUser() user: any,
  ) {
    return this.clusterDemoService.simulateAuditEvent(body, user);
  }

  @Post('audit/update-ttl')
  @ApiOperation({ summary: 'B15: Cập nhật chu kỳ ngày lưu trữ của TTL Index' })
  async updateTtl(@Body('days') days: number) {
    return this.clusterDemoService.updateTtl(days || 90);
  }
}
