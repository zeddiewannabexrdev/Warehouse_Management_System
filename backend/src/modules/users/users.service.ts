import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '@nestjs/config';
import { Collection, ObjectId, Filter } from 'mongodb';
import { UserEntity } from './user.entity';
import { UserRole } from '../../common/constants/roles.constants';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

export interface PaginatedUsersResult {
  items: Omit<UserEntity, 'passwordHash'>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
          phoneNumber: '0901234567',
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
          phoneNumber: '0912345678',
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
          phoneNumber: '0923456789',
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
          phoneNumber: '0934567890',
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
          phoneNumber: '0945678901',
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

  async findById(id: string, includePassword = false): Promise<UserEntity | null> {
    try {
      const projection = includePassword ? {} : { passwordHash: 0 };
      const user = await this.collection.findOne(
        { _id: new ObjectId(id) },
        { projection },
      );
      return user;
    } catch {
      return null;
    }
  }

  async listAll(): Promise<Omit<UserEntity, 'passwordHash'>[]> {
    const users = await this.collection
      .find({})
      .project({ passwordHash: 0 })
      .sort({ createdAt: -1 })
      .toArray();
    return users as unknown as Omit<UserEntity, 'passwordHash'>[];
  }

  async findAll(query: QueryUserDto): Promise<PaginatedUsersResult> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Filter<UserEntity> = {};

    if (query.search && query.search.trim()) {
      const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (query.branch && query.branch !== 'ALL') {
      filter.branch = query.branch as any;
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status === 'active') {
      filter.isActive = true;
    } else if (query.status === 'inactive') {
      filter.isActive = false;
    }

    const total = await this.collection.countDocuments(filter);
    const items = await this.collection
      .find(filter)
      .project({ passwordHash: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      items: items as unknown as Omit<UserEntity, 'passwordHash'>[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(dto: CreateUserDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new BadRequestException(`Email [${dto.email}] đã tồn tại trong hệ thống`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const newUser: UserEntity = {
      email: normalizedEmail,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role,
      branch: dto.branch,
      phoneNumber: dto.phoneNumber?.trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(newUser);
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return {
      ...userWithoutPassword,
      _id: result.insertedId,
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID [${id}]`);
    }

    const updateFields: Partial<UserEntity> = {
      updatedAt: new Date(),
    };

    if (dto.fullName !== undefined) updateFields.fullName = dto.fullName.trim();
    if (dto.role !== undefined) updateFields.role = dto.role;
    if (dto.branch !== undefined) updateFields.branch = dto.branch;
    if (dto.phoneNumber !== undefined) updateFields.phoneNumber = dto.phoneNumber.trim();
    if (dto.isActive !== undefined) updateFields.isActive = dto.isActive;

    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields },
    );

    const updatedUser = await this.findById(id);
    return updatedUser as Omit<UserEntity, 'passwordHash'>;
  }

  async toggleStatus(id: string, currentUserId: string): Promise<{ success: boolean; isActive: boolean; message: string }> {
    if (id === currentUserId) {
      throw new BadRequestException('Bạn không thể tự vô hiệu hóa tài khoản của chính mình');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID [${id}]`);
    }

    const newStatus = !user.isActive;
    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: newStatus, updatedAt: new Date() } },
    );

    return {
      success: true,
      isActive: newStatus,
      message: `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${user.fullName}`,
    };
  }

  async resetPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID [${id}]`);
    }

    const passToSet = newPassword || 'Wms@123456';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passToSet, salt);

    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { passwordHash, updatedAt: new Date() } },
    );

    return {
      success: true,
      message: `Đã đặt lại mật khẩu thành công cho ${user.fullName}`,
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(userId, true);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash, updatedAt: new Date() } },
    );

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  }
}
