import { SetMetadata } from '@nestjs/common';
import { PermissionAction, AppResource, PERMISSIONS_KEY } from '../constants/permissions.constants';

export interface RequiredPermission {
  action: PermissionAction;
  resource: AppResource;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
