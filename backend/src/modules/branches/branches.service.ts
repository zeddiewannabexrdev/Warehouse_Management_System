import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface BranchInfo {
  code: string;
  name: string;
  region: string;
  assignedShard: string;
  zoneTag: string;
  address: string;
  manager: string;
  isSharded: boolean;
}

@Injectable()
export class BranchesService {
  constructor(private readonly dbService: DatabaseService) {}

  async getBranches(): Promise<BranchInfo[]> {
    const defaultBranches: BranchInfo[] = [
      {
        code: 'HN',
        name: 'Tổng kho Vật tư Miền Bắc (Long Biên)',
        region: 'Miền Bắc',
        assignedShard: 'shard1 (port 27018)',
        zoneTag: 'ZONE_HN',
        address: 'Cụm Công nghiệp Sài Đồng, Long Biên, Hà Nội',
        manager: 'Nguyễn Văn Hùng',
        isSharded: true,
      },
      {
        code: 'HCM',
        name: 'Tổng kho Vật tư Miền Nam (Cát Lái)',
        region: 'Miền Nam',
        assignedShard: 'shard2 (port 27020)',
        zoneTag: 'ZONE_HCM',
        address: 'Khu cảng Cát Lái, P. Thạnh Mỹ Lợi, TP. Thủ Đức, TP.HCM',
        manager: 'Lê Minh Trí',
        isSharded: true,
      },
      {
        code: 'DN',
        name: 'Kho Vật tư Khu vực Miền Trung (Hòa Cầm)',
        region: 'Miền Trung',
        assignedShard: 'Primary Shard',
        zoneTag: 'UNTAGGED',
        address: 'KCN Hòa Cầm, Cẩm Lệ, TP. Đà Nẵng',
        manager: 'Phan Đình Hoàng',
        isSharded: false,
      },
    ];

    try {
      if (await this.dbService.isHealthy()) {
        const warehousesCol = this.dbService.getCollection('warehouses');
        const count = await warehousesCol.countDocuments();
        if (count > 0) {
          const warehouses = await warehousesCol.find({}).toArray();
          return warehouses.map((wh: any) => {
            const def = defaultBranches.find((b) => b.code === wh.branch);
            return {
              code: wh.branch,
              name: wh.name,
              region: wh.branch === 'HN' ? 'Miền Bắc' : wh.branch === 'HCM' ? 'Miền Nam' : 'Miền Trung',
              assignedShard: wh.branch === 'HN' ? 'shard1 (ZONE_HN)' : wh.branch === 'HCM' ? 'shard2 (ZONE_HCM)' : 'Primary Shard',
              zoneTag: wh.branch === 'HN' ? 'ZONE_HN' : wh.branch === 'HCM' ? 'ZONE_HCM' : 'UNTAGGED',
              address: wh.address,
              manager: wh.manager,
              isSharded: wh.branch === 'HN' || wh.branch === 'HCM',
            };
          });
        }
      }
    } catch {
      // Fallback to static branches
    }

    return defaultBranches;
  }
}
