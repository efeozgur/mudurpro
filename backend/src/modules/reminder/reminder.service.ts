import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class ReminderService {
  constructor(@InjectRepository(Reminder) private readonly repo: Repository<Reminder>) {}
  findAll(userId: string, from?: string, to?: string) {
    const qb = this.repo.createQueryBuilder('r').where('r.owner_user_id = :userId AND r.deleted_at IS NULL', { userId }).orderBy('r.start_at', 'ASC');
    if (from) qb.andWhere('r.start_at >= :from', { from });
    if (to) qb.andWhere('r.start_at < :to', { to });
    return qb.getMany();
  }
  async create(userId: string, dto: CreateReminderDto) { return this.repo.save(this.repo.create({ ...dto, owner_user_id: userId, start_at: new Date(dto.start_at), end_at: dto.end_at ? new Date(dto.end_at) : null, remind_at: dto.remind_at ? new Date(dto.remind_at) : null, status: 'PENDING' })); }
  private async owned(id: string, userId: string) { const item = await this.repo.findOne({ where: { id, owner_user_id: userId, deleted_at: IsNull() } }); if (!item) throw new NotFoundException('Hatırlatma bulunamadı'); return item; }
  async update(id: string, userId: string, dto: Partial<CreateReminderDto>) { const item = await this.owned(id, userId); Object.assign(item, dto, { start_at: dto.start_at ? new Date(dto.start_at) : item.start_at, end_at: dto.end_at ? new Date(dto.end_at) : item.end_at, remind_at: dto.remind_at ? new Date(dto.remind_at) : item.remind_at }); return this.repo.save(item); }
  async complete(id: string, userId: string) { const item = await this.owned(id, userId); item.status = 'COMPLETED'; item.completed_at = new Date(); return this.repo.save(item); }
  async remove(id: string, userId: string) { const item = await this.owned(id, userId); await this.repo.softRemove(item); }
}
