import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Courthouse } from '../../modules/tenant/entities/courthouse.entity';
import { AppDataSource } from '../../database/data-source';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip tenant routing for super_admin on public schema routes
    if (!user || user.role === 'SUPER_ADMIN' && request.path.startsWith('/api/v1/courthouses')) {
      return next.handle();
    }

    if (!user || !user.role) {
      return next.handle();
    }

    if (user.courthouseId) {
      const courthouse = await this.courthouseRepo.findOne({ where: { id: user.courthouseId, active: true } });
      if (!courthouse) throw new ForbiddenException('TENANT_NOT_FOUND');
      const ds = AppDataSource;
      await ds.query(`SET search_path TO "${courthouse.schema_name}", public`);
    }

    return next.handle();
  }
}
