import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/user-payload.interface';

export const BranchContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new BadRequestException('User context missing');
    }

    if (user.role === 'MANAGER_HN') {
      return 'HN';
    }

    if (user.role === 'MANAGER_HCM') {
      return 'HCM';
    }

    const queryBranch = request.query?.branch;
    if (queryBranch && ['HN', 'HCM', 'DN', 'ALL'].includes(queryBranch.toUpperCase())) {
      return queryBranch.toUpperCase();
    }

    return user.branch || 'ALL';
  },
);
