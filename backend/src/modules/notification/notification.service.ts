import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SureResult } from '../sure-engine/sure-engine.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  async createNotification(userId: string, dto: CreateNotificationDto): Promise<Notification> {
    const qb = this.repo.createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.type = :type', { type: dto.type })
      .andWhere('n.status = :status', { status: 'CREATED' })
      .andWhere('n.deleted_at IS NULL');

    if (dto.case_file_id) {
      qb.andWhere('n.case_file_id = :caseFileId', { caseFileId: dto.case_file_id });
    } else {
      qb.andWhere('n.case_file_id IS NULL');
    }

    const existing = await qb.getOne();
    if (existing) {
      return existing;
    }

    const entity = this.repo.create({ ...dto, user_id: userId, status: 'CREATED' });
    return this.repo.save(entity);
  }

  async findByUser(
    userId: string,
    filters?: { type?: string; priority?: string; status?: string; page?: number; limit?: number },
  ) {
    const where: any = { user_id: userId, deleted_at: IsNull() };
    if (filters?.type) where.type = filters.type;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.status) where.status = filters.status;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async findUnread(userId: string) {
    return this.repo.find({
      where: { user_id: userId, status: 'CREATED', deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });
  }

  async markRead(id: string): Promise<Notification> {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Notification not found');
    entity.status = 'READ';
    entity.read_at = new Date();
    return this.repo.save(entity);
  }

  async markComplete(id: string): Promise<Notification> {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Notification not found');
    entity.status = 'COMPLETED';
    entity.completed_at = new Date();
    return this.repo.save(entity);
  }

  async generateFromSureEngine(caseFileId: string, result: SureResult): Promise<void> {
    const urgencyToPriority: Record<string, string> = {
      GECMIS: 'P1',
      KRITIK: 'P1',
      YAKLASIYOR: 'P2',
      TAKIP: 'P3',
      NORMAL: 'P4',
      PENDING_SERVICES: 'P3',
      READY_FOR_APPEAL_TRANSFER: 'P2',
    };

    const priority = urgencyToPriority[result.status] || 'P4';

    const users = await this.repo
      .createQueryBuilder('n')
      .select('DISTINCT n.user_id', 'user_id')
      .where('n.deleted_at IS NULL')
      .getRawMany<{ user_id: string }>();

    for (const { user_id } of users) {
      await this.createNotification(user_id, {
        user_id,
        case_file_id: caseFileId,
        type: result.status,
        priority,
        title: `Sure Status: ${result.status}`,
        description: result.details?.join('; ') || undefined,
      });
    }
  }
}
