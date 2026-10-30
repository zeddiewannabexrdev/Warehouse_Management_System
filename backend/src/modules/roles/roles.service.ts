import { Injectable } from '@nestjs/common';
import { UserRole } from '../../common/constants/roles.constants';
import { PermissionAction, AppResource } from '../../common/constants/permissions.constants';

export interface RoleDefinition {
  code: UserRole;
  name: string;
  description: string;
  branchRestriction: string;
  permissions: {
    resource: AppResource;
    actions: PermissionAction[];
  }[];
}

@Injectable()
export class RolesService {
  private readonly roles: RoleDefinition[] = [
    {
      code: UserRole.SUPER_ADMIN,
      name: 'Tổng Giám đốc / Super Admin',
      description: 'Toàn quyền điều hành kho bãi, xem toàn quốc và quản trị hệ thống phân tán',
      branchRestriction: 'ALL',
      permissions: Object.values(AppResource).map((resource) => ({
        resource,
        actions: Object.values(PermissionAction),
      })),
    },
    {
      code: UserRole.MANAGER_HN,
      name: 'Trưởng Tổng kho Miền Bắc (Hà Nội)',
      description: 'Quản trị nhập xuất tồn tại Tổng kho Miền Bắc (ZONE_HN - Shard 1)',
      branchRestriction: 'HN',
      permissions: [
        {
          resource: AppResource.INVENTORY,
          actions: [PermissionAction.READ, PermissionAction.UPDATE],
        },
        {
          resource: AppResource.GOODS_RECEIPTS,
          actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
        },
        {
          resource: AppResource.GOODS_ISSUES,
          actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
        },
        {
          resource: AppResource.STOCK_TRANSFERS,
          actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
        },
      ],
    },
    {
      code: UserRole.MANAGER_HCM,
      name: 'Trưởng Tổng kho Miền Nam (TP. Hồ Chí Minh)',
      description: 'Quản trị nhập xuất tồn tại Tổng kho Miền Nam (ZONE_HCM - Shard 2)',
      branchRestriction: 'HCM',
      permissions: [
        {
          resource: AppResource.INVENTORY,
          actions: [PermissionAction.READ, PermissionAction.UPDATE],
        },
        {
          resource: AppResource.GOODS_RECEIPTS,
          actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
        },
        {
          resource: AppResource.GOODS_ISSUES,
          actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
        },
        {
          resource: AppResource.STOCK_TRANSFERS,
          actions: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.APPROVE],
        },
      ],
    },
    {
      code: UserRole.QC_INSPECTOR,
      name: 'Nhân viên Kiểm định Chất lượng (QC / KCS)',
      description: 'Kiểm tra chất lượng CO/CQ, nghiệm thu lô hàng vật tư nhập kho',
      branchRestriction: 'ALL',
      permissions: [
        {
          resource: AppResource.MATERIALS,
          actions: [PermissionAction.READ],
        },
        {
          resource: AppResource.GOODS_RECEIPTS,
          actions: [PermissionAction.READ, PermissionAction.APPROVE],
        },
      ],
    },
    {
      code: UserRole.AUDITOR,
      name: 'Kiểm toán viên Tài chính & Kho',
      description: 'Kiểm toán báo cáo tồn kho, định giá FIFO và truy vết lịch sử Audit Logs',
      branchRestriction: 'ALL',
      permissions: [
        {
          resource: AppResource.INVENTORY,
          actions: [PermissionAction.READ],
        },
        {
          resource: AppResource.STOCKTAKES,
          actions: [PermissionAction.READ, PermissionAction.APPROVE],
        },
        {
          resource: AppResource.SYSTEM,
          actions: [PermissionAction.READ],
        },
      ],
    },
  ];

  getAllRoles(): RoleDefinition[] {
    return this.roles;
  }
}
