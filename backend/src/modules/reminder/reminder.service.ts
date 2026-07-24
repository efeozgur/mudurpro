import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, In, Repository } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { ReminderHistory } from './entities/reminder-history.entity';
import { User } from '../auth/entities/user.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ShareReminderDto } from './dto/share-reminder.dto';

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(Reminder) private readonly repo: Repository<Reminder>,
    @InjectRepository(ReminderHistory) private readonly historyRepo: Repository<ReminderHistory>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findAll(userId: string, from?: string, to?: string) {
    const qb = this.repo.createQueryBuilder('r')
      .where(
        '(r.owner_user_id = :userId OR r.assigned_to_user_id = :userId OR :userId = ANY(COALESCE(r.shared_with_user_ids, ARRAY[]::uuid[])))',
        { userId },
      )
      .andWhere('r.deleted_at IS NULL')
      .orderBy('r.start_at', 'ASC');
    if (from) qb.andWhere('r.start_at >= :from', { from });
    if (to) qb.andWhere('r.start_at < :to', { to });
    return qb.getMany();
  }

  private async validateUsers(userIds: string[]) {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (!ids.length) return;
    const users = await this.userRepo.find({ where: { id: In(ids) } });
    if (users.length !== ids.length) throw new BadRequestException('Geçersiz kullanıcı paylaşımı');
  }

  private async record(reminder: Reminder, actorUserId: string, action: ReminderHistory['action'], changes: Record<string, unknown> | null = null) {
    await this.historyRepo.save(this.historyRepo.create({
      reminder_id: reminder.id,
      actor_user_id: actorUserId,
      action,
      changes,
    }));
  }

  private snapshot(reminder: Reminder) {
    return {
      title: reminder.title,
      description: reminder.description,
      type: reminder.type,
      priority: reminder.priority,
      start_at: reminder.start_at,
      end_at: reminder.end_at,
      recurrence_rule: reminder.recurrence_rule,
      recurrence_end: reminder.recurrence_end,
      is_all_day: reminder.is_all_day,
      remind_at: reminder.remind_at,
      status: reminder.status,
      assigned_to_user_id: reminder.assigned_to_user_id,
      shared_with_user_ids: reminder.shared_with_user_ids,
    };
  }

  async create(userId: string, dto: CreateReminderDto) {
    const sharedWith = dto.shared_with_user_ids ?? [];
    await this.validateUsers([...sharedWith, ...(dto.assigned_to_user_id ? [dto.assigned_to_user_id] : [])]);
    const reminder = await this.repo.save(this.repo.create({
      ...dto,
      owner_user_id: userId,
      shared_with_user_ids: [...new Set(sharedWith)],
      assigned_to_user_id: dto.assigned_to_user_id ?? null,
      start_at: new Date(dto.start_at),
      end_at: dto.end_at ? new Date(dto.end_at) : null,
      recurrence_end: dto.recurrence_end ? new Date(dto.recurrence_end) : null,
      remind_at: dto.remind_at ? new Date(dto.remind_at) : null,
      status: 'PENDING',
    }));
    await this.record(reminder, userId, 'CREATE', { after: this.snapshot(reminder) });
    return reminder;
  }

  private async owned(id: string, userId: string) {
    const item = await this.repo.findOne({ where: { id, owner_user_id: userId, deleted_at: IsNull() } });
    if (!item) throw new NotFoundException('Hatırlatma bulunamadı');
    return item;
  }

  private async accessible(id: string, userId: string) {
    const item = await this.repo.createQueryBuilder('r')
      .where('r.id = :id', { id })
      .andWhere('r.deleted_at IS NULL')
      .andWhere(
        '(r.owner_user_id = :userId OR r.assigned_to_user_id = :userId OR :userId = ANY(COALESCE(r.shared_with_user_ids, ARRAY[]::uuid[])))',
        { userId },
      )
      .getOne();
    if (!item) throw new NotFoundException('Hatırlatma bulunamadı');
    return item;
  }

  async update(id: string, userId: string, dto: Partial<CreateReminderDto>) {
    const item = await this.owned(id, userId);
    const before = this.snapshot(item);
    const { start_at, end_at, recurrence_end, remind_at, shared_with_user_ids, assigned_to_user_id, ...rest } = dto;
    if (shared_with_user_ids !== undefined || assigned_to_user_id !== undefined) {
      await this.validateUsers([
        ...(shared_with_user_ids ?? item.shared_with_user_ids ?? []),
        ...(assigned_to_user_id ? [assigned_to_user_id] : []),
      ]);
    }
    Object.assign(item, rest);
    if (start_at !== undefined) item.start_at = start_at ? new Date(start_at) : item.start_at;
    if (end_at !== undefined) item.end_at = end_at ? new Date(end_at) : null;
    if (recurrence_end !== undefined) item.recurrence_end = recurrence_end ? new Date(recurrence_end) : null;
    if (remind_at !== undefined) item.remind_at = remind_at ? new Date(remind_at) : null;
    if (shared_with_user_ids !== undefined) item.shared_with_user_ids = [...new Set(shared_with_user_ids)];
    if (assigned_to_user_id !== undefined) item.assigned_to_user_id = assigned_to_user_id || null;
    if (rest.recurrence_rule === null) item.recurrence_end = null;
    const saved = await this.repo.save(item);
    await this.record(saved, userId, 'UPDATE', { before, after: this.snapshot(saved) });
    return saved;
  }

  async share(id: string, userId: string, dto: ShareReminderDto) {
    const item = await this.owned(id, userId);
    const before = this.snapshot(item);
    if (dto.shared_with_user_ids !== undefined) {
      await this.validateUsers([
        ...dto.shared_with_user_ids,
        ...(dto.assigned_to_user_id || item.assigned_to_user_id ? [dto.assigned_to_user_id || item.assigned_to_user_id!] : []),
      ]);
      item.shared_with_user_ids = [...new Set(dto.shared_with_user_ids)];
    }
    if (dto.assigned_to_user_id !== undefined) {
      if (dto.assigned_to_user_id) await this.validateUsers([dto.assigned_to_user_id]);
      item.assigned_to_user_id = dto.assigned_to_user_id || null;
    }
    const saved = await this.repo.save(item);
    await this.record(saved, userId, 'SHARE', { before, after: this.snapshot(saved) });
    return saved;
  }

  async history(id: string, userId: string) {
    await this.accessible(id, userId);
    return this.historyRepo.find({ where: { reminder_id: id }, order: { created_at: 'DESC' } });
  }

  async complete(id: string, userId: string) {
    const item = await this.owned(id, userId);
    const before = this.snapshot(item);
    item.status = 'COMPLETED';
    item.completed_at = new Date();
    const saved = await this.repo.save(item);
    await this.record(saved, userId, 'COMPLETE', { before, after: this.snapshot(saved) });
    return saved;
  }

  async remove(id: string, userId: string) {
    const item = await this.owned(id, userId);
    await this.record(item, userId, 'DELETE', { before: this.snapshot(item) });
    await this.repo.softRemove(item);
  }


  async exportCalendar(userId: string) {
    const reminders = await this.findAll(userId);
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MudurPro//Reminders//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Reminders',
    ];

    for (const reminder of reminders) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${reminder.id}@mudurpro`);
      lines.push(`DTSTAMP:${this.formatUtc(reminder.created_at || reminder.start_at)}`);
      lines.push(reminder.is_all_day
        ? `DTSTART;VALUE=DATE:${this.formatDate(reminder.start_at)}`
        : `DTSTART:${this.formatUtc(reminder.start_at)}`);
      if (reminder.end_at) {
        lines.push(reminder.is_all_day
          ? `DTEND;VALUE=DATE:${this.formatDate(reminder.end_at)}`
          : `DTEND:${this.formatUtc(reminder.end_at)}`);
      }
      lines.push(`SUMMARY:${this.escapeText(reminder.title)}`);
      if (reminder.description) lines.push(`DESCRIPTION:${this.escapeText(reminder.description)}`);
      if (reminder.type) lines.push(`CATEGORIES:${this.escapeText(reminder.type)}`);
      lines.push(`STATUS:${reminder.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`);
      lines.push('CLASS:PRIVATE');
      const rule = this.calendarRule(reminder);
      if (rule) lines.push(`RRULE:${rule}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.map((line) => this.foldLine(line)).join('\r\n') + '\r\n';
  }

  private calendarRule(reminder: Reminder) {
    const rule = reminder.recurrence_rule?.trim().replace(/^RRULE:/i, '');
    if (!rule) return null;
    if (reminder.recurrence_end && !/(?:^|;)UNTIL=/i.test(rule)) {
      const until = reminder.is_all_day ? this.formatDate(reminder.recurrence_end) : this.formatUtc(reminder.recurrence_end);
      return `${rule};UNTIL=${until}`;
    }
    return rule;
  }

  private escapeText(value: string | null | undefined) {
    return (value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/([;,])/g, '\\$1');
  }

  private formatUtc(value: Date) {
    return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  private formatDate(value: Date) {
    const date = new Date(value);
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private foldLine(line: string) {
    const chunks: string[] = [];
    let chunk = '';
    let byteLength = 0;
    for (const character of line) {
      const characterLength = Buffer.byteLength(character, 'utf8');
      if (byteLength + characterLength > 75 && chunk) {
        chunks.push(chunk);
        chunk = ' ';
        byteLength = 1;
      }
      chunk += character;
      byteLength += characterLength;
    }
    chunks.push(chunk);
    return chunks.join('\r\n');
  }
}
