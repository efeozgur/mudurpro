import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('reminders')
@Index(['owner_user_id', 'start_at'])
export class Reminder extends BaseEntity {
  @Column({ type: 'uuid' }) owner_user_id!: string;
  @Column({ type: 'uuid', nullable: true }) assigned_to_user_id!: string | null;
  @Column('uuid', { array: true, default: () => 'ARRAY[]::uuid[]' }) shared_with_user_ids!: string[];
  @Column({ length: 200 }) title!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ length: 30, default: 'GENERAL' }) type!: string;
  @Column({ length: 15, default: 'NORMAL' }) priority!: string;
  @Column({ type: 'timestamptz' }) start_at!: Date;
  @Column({ type: 'timestamptz', nullable: true }) end_at!: Date | null;
  @Column({ type: 'text', nullable: true }) recurrence_rule!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) recurrence_end!: Date | null;
  @Column({ default: false }) is_all_day!: boolean;
  @Column({ type: 'timestamptz', nullable: true }) remind_at!: Date | null;
  @Column({ length: 20, default: 'PENDING' }) status!: string;
  @Column({ type: 'uuid', nullable: true }) case_file_id!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) completed_at!: Date | null;
}
