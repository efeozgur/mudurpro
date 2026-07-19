import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  user_id: string;
  court_id?: string;
  case_file_id?: string;
  action: string;
  module: string;
  entity: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog) private repo: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(filters?: {
    user_id?: string;
    module?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.repo.createQueryBuilder('al').orderBy('al.created_at', 'DESC');

    if (filters?.user_id) {
      qb.andWhere('al.user_id = :user_id', { user_id: filters.user_id });
    }
    if (filters?.module) {
      qb.andWhere('al.module = :module', { module: filters.module });
    }
    if (filters?.action) {
      qb.andWhere('al.action = :action', { action: filters.action });
    }
    if (filters?.start_date) {
      qb.andWhere('al.created_at >= :start_date', { start_date: new Date(filters.start_date) });
    }
    if (filters?.end_date) {
      qb.andWhere('al.created_at <= :end_date', { end_date: new Date(filters.end_date) });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  async getCaseTimeline(caseFileId: string, limit = 10) {
    return this.repo.find({
      where: { case_file_id: caseFileId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
