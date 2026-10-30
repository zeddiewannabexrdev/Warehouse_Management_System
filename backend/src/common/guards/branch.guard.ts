import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/user-payload.interface';
import { UserRole } from '../constants/roles.constants';

@Injectable()
export class BranchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      return true;
    }

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.AUDITOR) {
      return true;
    }

    const requestedBranch = request.body?.warehouse_branch || request.query?.warehouse_branch || request.params?.branch;

    if (requestedBranch && requestedBranch !== 'ALL') {
      if (user.branch && user.branch !== 'ALL' && user.branch !== requestedBranch) {
        throw new ForbiddenException(
          `Branch security boundary: Your account is restricted to branch [${user.branch}], cannot operate on [${requestedBranch}]`,
        );
      }
    }

    return true;
  }
}
