import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Courthouse } from '../../modules/tenant/entities/courthouse.entity';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
    private dataSource: DataSource,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role === 'SUPER_ADMIN') {
      return next.handle();
    }

    if (!user.courthouseId) {
      return next.handle();
    }

    const courthouse = await this.courthouseRepo.findOne({ where: { id: user.courthouseId, active: true } });
    if (!courthouse) throw new ForbiddenException('TENANT_NOT_FOUND');
    await this.dataSource.query(`SET search_path TO "${courthouse.schema_name}", public`);

    return next.handle();
  }
}
