import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '@nestjs/config';
import { Collection, ObjectId } from 'mongodb';
import { UserEntity } from './user.entity';
import { UserRole } from '../../common/constants/roles.constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private collectionName = 'users';

  constructor(
    private readonly dbService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private get collection(): Collection<UserEntity> {
    return this.dbService.getCollection<UserEntity>(this.collectionName);
  }

  async onModuleInit(): Promise<void> {
    try {
      if (await this.dbService.isHealthy()) {
        await this.ensureIndexesAndSeed();
      }
    } catch (err) {
      this.logger.warn(`Could not initialize users seed: ${(err as Error).message}`);
    }
  }

  async ensureIndexesAndSeed(): Promise<void> {
    const col = this.collection;
    await col.createIndex({ email: 1 }, { unique: true });

    const count = await col.countDocuments();
    if (count === 0) {
      this.logger.log('Seeding initial system users for Multi-Branch RBAC');
      const adminEmail = this.configService.get<string>('seed.adminEmail') || 'admin@wms.enterprise.vn';
      const adminPassword = this.configService.get<string>('seed.adminPassword') || 'Admin@Distributed2026';
      const salt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash(adminPassword, salt);
      const defaultHash = await bcrypt.hash('Wms@123456', salt);

      const demoUsers: UserEntity[] = [
        {
          email: adminEmail,
          passwordHash: adminHash,
          fullName: 'Nguyễn Toàn Thắng (Tổng Giám đốc / Super Admin)',
          role: UserRole.SUPER_ADMIN,
          branch: 'ALL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          email: 'manager.hn@wms.enterprise.vn',
          passwordHash: defaultHash,
          fullName: 'Nguyễn Văn Hùng (Trưởng Tổng kho Miền Bắc - HN)',
          role: UserRole.MANAGER_HN,
          branch: 'HN',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          email: 'manager.hcm@wms.enterprise.vn',
          passwordHash: defaultHash,
          fullName: 'Lê Minh Trí (Trưởng Tổng kho Miền Nam - HCM)',
          role: UserRole.MANAGER_HCM,
          branch: 'HCM',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          email: 'qc.lead@wms.enterprise.vn',
          passwordHash: defaultHash,
          fullName: 'Trần Thị Thu Hà (Trưởng Ban Kiểm định KCS/QC)',
          role: UserRole.QC_INSPECTOR,
          branch: 'ALL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          email: 'auditor@wms.enterprise.vn',
          passwordHash: defaultHash,
          fullName: 'Vũ Quốc Bảo (Kiểm toán trưởng Chuỗi cung ứng)',
          role: UserRole.AUDITOR,
          branch: 'ALL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await col.insertMany(demoUsers);
      this.logger.log(`Initialized ${demoUsers.length} role-based accounts`);
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.collection.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserEntity | null> {
    try {
      return await this.collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  async listAll(): Promise<Omit<UserEntity, 'passwordHash'>[]> {
    const users = await this.collection
      .find({})
      .project({ passwordHash: 0 })
      .toArray();
    return users as unknown as Omit<UserEntity, 'passwordHash'>[];
  }
}
