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

  async create(userId: string, dto: CreateReminderDto) {
    return this.repo.save(this.repo.create({
      ...dto,
      owner_user_id: userId,
      start_at: new Date(dto.start_at),
      end_at: dto.end_at ? new Date(dto.end_at) : null,
      recurrence_end: dto.recurrence_end ? new Date(dto.recurrence_end) : null,
      remind_at: dto.remind_at ? new Date(dto.remind_at) : null,
      status: 'PENDING',
    }));
  }

  private async owned(id: string, userId: string) {
    const item = await this.repo.findOne({ where: { id, owner_user_id: userId, deleted_at: IsNull() } });
    if (!item) throw new NotFoundException('Hatırlatma bulunamadı');
    return item;
  }

  async update(id: string, userId: string, dto: Partial<CreateReminderDto>) {
    const item = await this.owned(id, userId);
    Object.assign(item, dto, {
      start_at: dto.start_at ? new Date(dto.start_at) : item.start_at,
      end_at: dto.end_at ? new Date(dto.end_at) : item.end_at,
      recurrence_end: dto.recurrence_end ? new Date(dto.recurrence_end) : item.recurrence_end,
      remind_at: dto.remind_at ? new Date(dto.remind_at) : item.remind_at,
    });
    return this.repo.save(item);
  }

  async complete(id: string, userId: string) {
    const item = await this.owned(id, userId);
    item.status = 'COMPLETED';
    item.completed_at = new Date();
    return this.repo.save(item);
  }

  async remove(id: string, userId: string) {
    const item = await this.owned(id, userId);
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
