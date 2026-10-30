import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongoClient,
  Db,
  Collection,
  Document,
  ClientSession,
  TransactionOptions,
} from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureConnected();
  }

  async ensureConnected(): Promise<void> {
    if (this.isConnected && this.client && this.db) {
      return;
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Closing MongoDB connection on shutdown signal: ${signal || 'DEFAULT'}`);
    await this.disconnect();
  }

  async connect(): Promise<void> {
    const uri = this.configService.get<string>('mongodb.uri') || 'mongodb://localhost:27017/material_inventory_db';
    const dbName = this.configService.get<string>('mongodb.databaseName') || 'material_inventory_db';

    try {
      this.client = new MongoClient(uri, {
        maxPoolSize: 50,
        minPoolSize: 10,
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      
      await this.db.command({ ping: 1 });
      this.isConnected = true;
      this.logger.log(`Successfully connected to MongoDB database [${dbName}] via Mongos router`);
    } catch (error) {
      this.isConnected = false;
      this.logger.error(`Failed to connect to MongoDB: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      this.logger.log('Disconnected from MongoDB');
    }
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error('MongoDB client is not initialized or disconnected');
    }
    return this.client;
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB database instance is not connected');
    }
    return this.db;
  }

  getCollection<T extends Document = Document>(name: string): Collection<T> {
    return this.getDb().collection<T>(name);
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.db) return false;
      const res = await this.db.command({ ping: 1 });
      return res.ok === 1;
    } catch {
      return false;
    }
  }

  startSession(): ClientSession {
    return this.getClient().startSession();
  }

  async withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    const session = this.startSession();
    try {
      const defaultOptions: TransactionOptions = {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        ...options,
      };

      let result: T;
      await session.withTransaction(async () => {
        result = await operation(session);
      }, defaultOptions);

      return result!;
    } finally {
      await session.endSession();
    }
  }

  async getShardingStatus(): Promise<any> {
    try {
      const adminDb = this.getClient().db('admin');
      return await adminDb.command({ serverStatus: 1 });
    } catch (err) {
      return { status: 'STANDALONE_OR_NO_AUTH', error: (err as Error).message };
    }
  }
}
