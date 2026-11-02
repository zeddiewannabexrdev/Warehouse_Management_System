import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';

export interface MaterialCategoryDefinition {
  category_code: string;
  name: string;
  description: string;
  storage_condition: string;
  specification_template: {
    field: string;
    label: string;
    type: 'string' | 'number' | 'select';
    unit?: string;
    options?: string[];
    placeholder?: string;
    required: boolean;
  }[];
}

const DEFAULT_CATEGORIES: MaterialCategoryDefinition[] = [
  {
    category_code: 'CAT-STEEL',
    name: 'Thép và Kim loại kết cấu',
    description: 'Thép thanh vằn, thép hình I/H, tôn tấm cuộn',
    storage_condition: 'DRY_VENTILATED',
    specification_template: [
      { field: 'standard', label: 'Tiêu chuẩn kỹ thuật', type: 'string', placeholder: 'TCVN 1651-2:2018', required: true },
      { field: 'diameter_mm', label: 'Đường kính thanh', type: 'number', unit: 'mm', required: true },
      { field: 'grade', label: 'Mác thép', type: 'string', placeholder: 'CB400V / CB500V', required: true },
      { field: 'tensile_strength_mpa', label: 'Giới hạn độ bền kéo', type: 'number', unit: 'MPa', required: false },
      { field: 'material', label: 'Vật liệu hợp kim', type: 'string', placeholder: 'Thép hợp kim thấp carbon', required: false },
    ],
  },
  {
    category_code: 'CAT-CABLE',
    name: 'Thiết bị Điện & Cáp truyền tải',
    description: 'Dây cáp điện trung/hạ thế, cáp chống cháy, tủ điện',
    storage_condition: 'DRY_VENTILATED',
    specification_template: [
      { field: 'voltage_kv', label: 'Điện áp định mức', type: 'number', unit: 'kV', required: true },
      { field: 'conductor', label: 'Ruột dẫn điện', type: 'string', placeholder: 'Đồng 99.99% / Nhôm', required: true },
      { field: 'cores', label: 'Số lõi dẫn', type: 'number', required: true },
      { field: 'cross_section_sqmm', label: 'Tiết diện lõi', type: 'number', unit: 'mm²', required: true },
      { field: 'standard', label: 'Tiêu chuẩn sản xuất', type: 'string', placeholder: 'IEC 60502-2', required: true },
      { field: 'material', label: 'Vật liệu cách điện', type: 'string', placeholder: 'XLPE / PVC', required: false },
    ],
  },
  {
    category_code: 'CAT-CEMENT',
    name: 'Xi măng & Phụ gia bê tông',
    description: 'Xi măng bao PCB40, xỉ hạt lò cao, tro bay',
    storage_condition: 'DRY_VENTILATED',
    specification_template: [
      { field: 'standard', label: 'Tiêu chuẩn mác', type: 'string', placeholder: 'TCVN 6260:2020', required: true },
      { field: 'strength_grade', label: 'Mác cường độ', type: 'string', placeholder: 'PCB40 / PCB50', required: true },
      { field: 'curing_days', label: 'Thời gian bảo dưỡng', type: 'number', unit: 'ngày', required: false },
      { field: 'package_weight_kg', label: 'Khối lượng đóng bao', type: 'number', unit: 'kg', required: true },
    ],
  },
  {
    category_code: 'CAT-PAINT',
    name: 'Hóa chất & Sơn công nghiệp',
    description: 'Sơn Epoxy chống rỉ, dung môi pha, chất tẩy dầu',
    storage_condition: 'HAZARDOUS',
    specification_template: [
      { field: 'base', label: 'Gốc nhựa', type: 'string', placeholder: 'Epoxy Resin polyamide', required: true },
      { field: 'solid_volume_pct', label: 'Hàm lượng chất rắn', type: 'number', unit: '%', required: false },
      { field: 'pot_life_hours', label: 'Thời gian đóng rắn', type: 'number', unit: 'giờ', required: false },
      { field: 'voc_g_l', label: 'Hàm lượng VOC bay hơi', type: 'number', unit: 'g/L', required: false },
      { field: 'standard', label: 'Tiêu chuẩn bảo vệ', type: 'string', placeholder: 'ISO 12944 C5-M', required: false },
    ],
  },
];

const INITIAL_MOCK_MATERIALS: any[] = [
  {
    _id: new ObjectId('672000000000000000000001'),
    material_code: 'MAT-STEEL-D20',
    name: 'Thép thanh vằn D20 CB400V Hòa Phát',
    category_code: 'CAT-STEEL',
    unit: 'Tấn',
    description: 'Thép cốt bê tông chịu lực cao cho móng và dầm cầu vượt',
    specifications: {
      standard: 'TCVN 1651-2:2018',
      diameter_mm: 20,
      grade: 'CB400V',
      tensile_strength_mpa: 570,
      material: 'Thép hợp kim thấp carbon',
    },
    standard_price: 15500000,
    barcode: '8934567890123',
    is_active: true,
    created_at: new Date('2026-10-15T08:00:00Z'),
  },
  {
    _id: new ObjectId('672000000000000000000002'),
    material_code: 'MAT-STEEL-D25',
    name: 'Thép thanh vằn D25 CB500V Hòa Phát',
    category_code: 'CAT-STEEL',
    unit: 'Tấn',
    description: 'Thép cường độ siêu cao cho cọc khoan nhồi cao ốc',
    specifications: {
      standard: 'TCVN 1651-2:2018',
      diameter_mm: 25,
      grade: 'CB500V',
      tensile_strength_mpa: 630,
      material: 'Thép hợp kim tôi cứng',
    },
    standard_price: 16800000,
    barcode: '8934567890124',
    is_active: true,
    created_at: new Date('2026-10-16T09:30:00Z'),
  },
  {
    _id: new ObjectId('672000000000000000000003'),
    material_code: 'MAT-CABLE-3X120',
    name: 'Cáp đồng trung thế 24kV treo CADIVI 3x120 mm2',
    category_code: 'CAT-CABLE',
    unit: 'Mét',
    description: 'Cáp ngầm trung thế cách điện XLPE, giáp băng kim loại',
    specifications: {
      voltage_kv: 24,
      conductor: 'Đồng 99.99%',
      cores: 3,
      cross_section_sqmm: 120,
      standard: 'IEC 60502-2',
      material: 'Đồng cách điện XLPE',
    },
    standard_price: 485000,
    barcode: '8934567890456',
    is_active: true,
    created_at: new Date('2026-10-18T10:15:00Z'),
  },
  {
    _id: new ObjectId('672000000000000000000004'),
    material_code: 'MAT-CEM-PCB40',
    name: 'Xi măng Poóc lăng hỗn hợp Vicem Hoàng Thạch PCB40',
    category_code: 'CAT-CEMENT',
    unit: 'Bao (50kg)',
    description: 'Xi măng cường độ cao đóng bao 50kg chống thấm tốt',
    specifications: {
      standard: 'TCVN 6260:2020',
      strength_grade: 'PCB40',
      curing_days: 28,
      package_weight_kg: 50,
    },
    standard_price: 92000,
    barcode: '8934567890789',
    is_active: true,
    created_at: new Date('2026-10-20T14:00:00Z'),
  },
  {
    _id: new ObjectId('672000000000000000000005'),
    material_code: 'MAT-PAINT-EPX01',
    name: 'Sơn Epoxy lót 2 thành phần chống rỉ Jotun Penguard Primer',
    category_code: 'CAT-PAINT',
    unit: 'Thùng (20L)',
    description: 'Sơn bảo vệ kết cấu thép ngâm nước và chịu môi trường biển khắc nghiệt',
    specifications: {
      base: 'Epoxy Resin polyamide',
      solid_volume_pct: 72,
      pot_life_hours: 8,
      voc_g_l: 250,
      standard: 'ISO 12944 C5-M',
    },
    standard_price: 3200000,
    barcode: '8934567890999',
    is_active: true,
    created_at: new Date('2026-10-22T11:45:00Z'),
  },
];

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);
  private memoryMaterials: any[] = [...INITIAL_MOCK_MATERIALS];

  constructor(private readonly dbService: DatabaseService) {}

  async getCategories(): Promise<MaterialCategoryDefinition[]> {
    try {
      if (await this.dbService.isHealthy()) {
        const catCol = this.dbService.getCollection('material_categories');
        const dbCats = await catCol.find({}).toArray();
        if (dbCats.length > 0) {
          return dbCats.map((c: any) => {
            const def = DEFAULT_CATEGORIES.find((d) => d.category_code === c.category_code);
            return {
              category_code: c.category_code,
              name: c.name,
              description: c.description || '',
              storage_condition: c.storage_condition || 'NORMAL',
              specification_template: def?.specification_template || [],
            };
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Could not load categories from MongoDB: ${(error as Error).message}`);
    }
    return DEFAULT_CATEGORIES;
  }

  async findAll(query: QueryMaterialDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    try {
      if (await this.dbService.isHealthy()) {
        const col = this.dbService.getCollection('materials');
        const count = await col.countDocuments();

        // If collection has data in MongoDB, perform query
        if (count > 0) {
          const filter: any = {};

          if (query.category_code) {
            filter.category_code = query.category_code;
          }

          if (query.is_active !== undefined && query.is_active !== '') {
            filter.is_active = String(query.is_active) === 'true';
          }

          if (query.search && query.search.trim() !== '') {
            const searchRegex = new RegExp(query.search.trim(), 'i');
            filter.$or = [
              { material_code: { $regex: searchRegex } },
              { name: { $regex: searchRegex } },
              { barcode: { $regex: searchRegex } },
              { description: { $regex: searchRegex } },
            ];
          }

          const sortField = query.sortBy || 'material_code';
          const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
          const sortObj: any = { [sortField]: sortOrder };

          const [items, total] = await Promise.all([
            col.find(filter).sort(sortObj).skip(skip).limit(limit).toArray(),
            col.countDocuments(filter),
          ]);

          return {
            items,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
            dataSource: 'MONGODB_SHARDED_CLUSTER',
          };
        }
      }
    } catch (error) {
      this.logger.warn(`Error querying materials in MongoDB: ${(error as Error).message}`);
    }

    // In-memory fallback
    let filtered = [...this.memoryMaterials];

    if (query.category_code) {
      filtered = filtered.filter((m) => m.category_code === query.category_code);
    }

    if (query.is_active !== undefined && query.is_active !== '') {
      const activeBool = query.is_active === 'true';
      filtered = filtered.filter((m) => m.is_active === activeBool);
    }

    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.material_code.toLowerCase().includes(s) ||
          m.name.toLowerCase().includes(s) ||
          (m.barcode && m.barcode.toLowerCase().includes(s)) ||
          (m.description && m.description.toLowerCase().includes(s)),
      );
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      dataSource: 'IN_MEMORY_FALLBACK',
    };
  }

  async findById(id: string) {
    try {
      if (await this.dbService.isHealthy()) {
        const col = this.dbService.getCollection('materials');
        let query: any = { material_code: id };
        if (ObjectId.isValid(id)) {
          query = { $or: [{ _id: new ObjectId(id) }, { material_code: id }] };
        }
        const item = await col.findOne(query);
        if (item) {
          return item;
        }
      }
    } catch (error) {
      this.logger.warn(`Error finding material: ${(error as Error).message}`);
    }

    const memItem = this.memoryMaterials.find(
      (m) => m.material_code === id || (m._id && m._id.toString() === id),
    );

    if (!memItem) {
      throw new NotFoundException(`Không tìm thấy vật tư có mã hoặc ID: ${id}`);
    }

    return memItem;
  }

  async create(dto: CreateMaterialDto) {
    try {
      if (await this.dbService.isHealthy()) {
        const col = this.dbService.getCollection('materials');
        const existing = await col.findOne({ material_code: dto.material_code });
        if (existing) {
          throw new ConflictException(`Mã vật tư "${dto.material_code}" đã tồn tại trên hệ thống`);
        }

        const doc = {
          ...dto,
          is_active: dto.is_active ?? true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = await col.insertOne(doc as any);
        return {
          _id: result.insertedId,
          ...doc,
        };
      }
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.warn(`Could not insert into MongoDB, fallback to memory: ${(error as Error).message}`);
    }

    const existingMem = this.memoryMaterials.find((m) => m.material_code === dto.material_code);
    if (existingMem) {
      throw new ConflictException(`Mã vật tư "${dto.material_code}" đã tồn tại`);
    }

    const newDoc = {
      _id: new ObjectId(),
      ...dto,
      is_active: dto.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.memoryMaterials.unshift(newDoc);
    return newDoc;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    try {
      if (await this.dbService.isHealthy()) {
        const col = this.dbService.getCollection('materials');
        let query: any = { material_code: id };
        if (ObjectId.isValid(id)) {
          query = { $or: [{ _id: new ObjectId(id) }, { material_code: id }] };
        }

        const updateDoc = {
          ...dto,
          updated_at: new Date(),
        };

        const result = await col.findOneAndUpdate(
          query,
          { $set: updateDoc },
          { returnDocument: 'after' },
        );

        if (result) {
          return result;
        }
      }
    } catch (error) {
      this.logger.warn(`Error updating in MongoDB: ${(error as Error).message}`);
    }

    const index = this.memoryMaterials.findIndex(
      (m) => m.material_code === id || (m._id && m._id.toString() === id),
    );

    if (index === -1) {
      throw new NotFoundException(`Không tìm thấy vật tư có mã hoặc ID: ${id}`);
    }

    this.memoryMaterials[index] = {
      ...this.memoryMaterials[index],
      ...dto,
      updated_at: new Date(),
    };

    return this.memoryMaterials[index];
  }

  async delete(id: string) {
    try {
      if (await this.dbService.isHealthy()) {
        const col = this.dbService.getCollection('materials');
        let query: any = { material_code: id };
        if (ObjectId.isValid(id)) {
          query = { $or: [{ _id: new ObjectId(id) }, { material_code: id }] };
        }

        const result = await col.deleteOne(query);
        if (result.deletedCount > 0) {
          return { message: `Đã xóa thành công vật tư ${id}` };
        }
      }
    } catch (error) {
      this.logger.warn(`Error deleting from MongoDB: ${(error as Error).message}`);
    }

    const index = this.memoryMaterials.findIndex(
      (m) => m.material_code === id || (m._id && m._id.toString() === id),
    );

    if (index === -1) {
      throw new NotFoundException(`Không tìm thấy vật tư có mã hoặc ID: ${id}`);
    }

    this.memoryMaterials.splice(index, 1);
    return { message: `Đã xóa thành công vật tư ${id}` };
  }

  async getStats() {
    try {
      if (await this.dbService.isHealthy()) {
        const col = this.dbService.getCollection('materials');
        const pipeline = [
          {
            $group: {
              _id: '$category_code',
              count: { $sum: 1 },
              avgPrice: { $avg: '$standard_price' },
              minPrice: { $min: '$standard_price' },
              maxPrice: { $max: '$standard_price' },
            },
          },
          {
            $lookup: {
              from: 'material_categories',
              localField: '_id',
              foreignField: 'category_code',
              as: 'catInfo',
            },
          },
          {
            $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              category_code: '$_id',
              category_name: { $ifNull: ['$catInfo.name', '$_id'] },
              count: 1,
              avgPrice: { $round: ['$avgPrice', 0] },
              minPrice: 1,
              maxPrice: 1,
            },
          },
        ];

        const stats = await col.aggregate(pipeline).toArray();
        if (stats.length > 0) {
          return stats;
        }
      }
    } catch (error) {
      this.logger.warn(`Error calculating material stats in MongoDB: ${(error as Error).message}`);
    }

    // In-memory stats
    const groupMap = new Map<string, any>();
    this.memoryMaterials.forEach((m) => {
      const cat = m.category_code;
      if (!groupMap.has(cat)) {
        const catDef = DEFAULT_CATEGORIES.find((c) => c.category_code === cat);
        groupMap.set(cat, {
          category_code: cat,
          category_name: catDef ? catDef.name : cat,
          count: 0,
          totalPrice: 0,
          minPrice: m.standard_price,
          maxPrice: m.standard_price,
        });
      }
      const entry = groupMap.get(cat);
      entry.count += 1;
      entry.totalPrice += m.standard_price;
      entry.minPrice = Math.min(entry.minPrice, m.standard_price);
      entry.maxPrice = Math.max(entry.maxPrice, m.standard_price);
    });

    return Array.from(groupMap.values()).map((e) => ({
      category_code: e.category_code,
      category_name: e.category_name,
      count: e.count,
      avgPrice: Math.round(e.totalPrice / e.count),
      minPrice: e.minPrice,
      maxPrice: e.maxPrice,
    }));
  }
}
