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

    // Parse path: /api/v1/{module}/{id?}/{submodule?}
    const segments = request.path.split('/');
    const hasSubmodule = segments[5] && segments[5] !== '';
    const module = hasSubmodule ? segments[5] : (segments[3] || 'unknown');  // "parties" for /cases/id/parties, "cases" for /cases/id
    const entity = segments[3] || 'unknown';

    // Extract case_file_id from various route patterns
    let caseFileId: string | null = null;
    if (request.params?.caseFileId) {
      // Pattern: /api/v1/cases/:caseFileId/{submodule}
      caseFileId = request.params.caseFileId;
    } else if (request.params?.id && entity === 'cases') {
      // Pattern: /api/v1/cases/:id or /api/v1/cases/:id/{submodule}
      caseFileId = request.params.id;
    } else if (request.body?.case_file_id) {
      // Pattern: POST /services, PUT /appeals/:id — body has case_file_id
      caseFileId = request.body.case_file_id;
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const data = responseBody?.data ?? responseBody;

        // Skip auth-related logs
        if (module === 'auth') return;

        this.auditLogService.create({
          user_id: user.id,
          court_id: user.courtId || null,
          case_file_id: caseFileId || undefined,
          action: method,
          module,
          entity,
          entity_id: request.params?.id || request.params?.caseFileId || null,
          new_value: data,
          ip_address: request.ip || null,
          user_agent: request.headers['user-agent'] || null,
        }).catch(() => {});
      }),
    );
  }
}
