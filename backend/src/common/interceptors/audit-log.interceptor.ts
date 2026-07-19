import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (method === 'GET' || request.path.startsWith('/api/v1/auth')) {
      return next.handle();
    }

    const user = request.user;
    if (!user) return next.handle();

    const module = request.path.split('/')[3] || 'unknown';
    const entity = request.path.split('/')[4] || 'unknown';

    return next.handle().pipe(
      tap((responseBody) => {
        const data = responseBody?.data ?? responseBody;

        this.auditLogService.create({
          user_id: user.id,
          court_id: user.courtId || null,
          case_file_id: request.params?.id || null,
          action: method,
          module,
          entity,
          entity_id: request.params?.id || null,
          new_value: data,
          ip_address: request.ip || null,
          user_agent: request.headers['user-agent'] || null,
        }).catch(() => {});
      }),
    );
  }
}
