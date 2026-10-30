import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
          return {
            ...result,
            meta: {
              timestamp: new Date().toISOString(),
              path: request.url,
              ...(result.meta || {}),
            },
          };
        }

        return {
          success: true,
          data: result ?? null,
          message: 'Request completed successfully',
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        };
      }),
    );
  }
}
