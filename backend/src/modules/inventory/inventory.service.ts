import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Document } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedUser } from '../../common/interfaces/user-payload.interface';
import { UpdateThresholdsDto } from './dto/update-thresholds.dto';

// Cùng ngưỡng với truy vấn 3 trong scripts/04_advanced_queries.js
const ALERT_LEVEL = {
  $switch: {
    branches: [
      { case: { $lte: ['$quantity', { $divide: ['$min_threshold', 2] }] }, then: 'URGENT' },
      { case: { $lt: ['$quantity', '$min_threshold'] }, then: 'LOW' },
      {
        case: { $and: [{ $gt: ['$max_threshold', null] }, { $gt: ['$quantity', '$max_threshold'] }] },
        then: 'OVER',
      },
    ],
    default: 'OK',
  },
};

@Injectable()
export class InventoryService {
  constructor(private readonly dbService: DatabaseService) {}

  // Lọc theo chi nhánh là tiền tố shard key, nên mongos chỉ hỏi đúng shard của vùng đó
  private loadStocks(branch?: string): Promise<Document[]> {
    const match = branch && branch !== 'ALL' ? { warehouse_branch: branch } : {};
    return this.dbService
      .getCollection('inventory_stocks')
      .aggregate([
        { $match: match },
        { $lookup: { from: 'materials', localField: 'material_code', foreignField: 'material_code', as: 'material' } },
        { $unwind: { path: '$material', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            material_name: '$material.name',
            standard_price: '$material.standard_price',
            alert: ALERT_LEVEL,
            stock_value: { $multiply: ['$quantity', { $ifNull: ['$material.standard_price', 0] }] },
          },
        },
        { $project: { material: 0 } },
        { $sort: { warehouse_branch: 1, material_code: 1 } },
      ])
      .toArray();
  }

  async getStocks(branch?: string, keyword?: string): Promise<Document[]> {
    const rows = await this.loadStocks(branch);
    if (!keyword) return rows;
    const needle = keyword.toLowerCase();
    return rows.filter((row) => `${row.material_code} ${row.material_name || ''}`.toLowerCase().includes(needle));
  }

  async getLowStock(branch?: string): Promise<Document[]> {
    const rows = await this.loadStocks(branch);
    return rows.filter((row) => row.alert === 'URGENT' || row.alert === 'LOW');
  }

  async getSummary(branch?: string) {
    const rows = await this.loadStocks(branch);
    return {
      total_items: rows.length,
      total_value: rows.reduce((sum, row) => sum + row.stock_value, 0),
      urgent: rows.filter((row) => row.alert === 'URGENT').length,
      low: rows.filter((row) => row.alert === 'LOW').length,
      over: rows.filter((row) => row.alert === 'OVER').length,
      by_branch: ['HN', 'HCM', 'DN']
        .map((code) => {
          const branchRows = rows.filter((row) => row.warehouse_branch === code);
          return {
            branch: code,
            items: branchRows.length,
            value: branchRows.reduce((sum, row) => sum + row.stock_value, 0),
          };
        })
        .filter((row) => row.items > 0),
    };
  }

  async updateThresholds(
    branch: string,
    materialCode: string,
    dto: UpdateThresholdsDto,
    user: AuthenticatedUser,
  ) {
    if (dto.max_threshold < dto.min_threshold) {
      throw new BadRequestException('Ngưỡng tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu');
    }

    // Cập nhật ngưỡng và ghi nhật ký kiểm toán cùng lúc, lỗi ở bước nào thì hủy cả hai
    await this.dbService.withTransaction(async (session) => {
      const result = await this.dbService.getCollection('inventory_stocks').updateOne(
        { warehouse_branch: branch, material_code: materialCode },
        {
          $set: {
            min_threshold: dto.min_threshold,
            max_threshold: dto.max_threshold,
            last_updated: new Date(),
          },
        },
        { session },
      );
      if (result.matchedCount === 0) {
        throw new NotFoundException('Không tìm thấy dòng tồn kho');
      }
      await this.dbService.getCollection('material_audit_logs').insertOne(
        {
          log_code: `AUD-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          action: 'ADJUST_STOCK',
          actor: user.email,
          collection_name: 'inventory_stocks',
          document_id: `${branch}/${materialCode}`,
          details: {
            event: 'UPDATE_THRESHOLDS',
            min_threshold: dto.min_threshold,
            max_threshold: dto.max_threshold,
          },
          timestamp: new Date(),
        },
        { session },
      );
    });
    return { updated: true };
  }
}
