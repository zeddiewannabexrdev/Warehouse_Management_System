import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  getAppHealth() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: this.configService.get('nodeEnv'),
      version: '1.0.0',
    };
  }

  async getDatabaseHealth() {
    const isHealthy = await this.databaseService.isHealthy();
    const dbName = this.configService.get('mongodb.databaseName');
    
    let collectionsCount = 0;
    let topologyType = 'UNKNOWN';

    if (isHealthy) {
      try {
        const collections = await this.databaseService.getDb().listCollections().toArray();
        collectionsCount = collections.length;
        const topology = (this.databaseService.getClient() as any).topology;
        topologyType = topology?.description?.type || 'SHARDED_OR_REPLICA';
      } catch (e) {
        // Ignored
      }
    }

    return {
      backendStatus: 'UP',
      databaseStatus: isHealthy ? 'CONNECTED' : 'DISCONNECTED',
      databaseName: dbName,
      collectionsCount,
      topologyType,
      timestamp: new Date().toISOString(),
    };
  }
}
