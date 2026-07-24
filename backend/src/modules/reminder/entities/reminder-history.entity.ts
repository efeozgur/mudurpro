import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity('reminder_histories')
@Index(['reminder_id', 'created_at'])
export class ReminderHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) reminder_id!: string;
  @Column({ type: 'uuid' }) actor_user_id!: string;
  @Column({ length: 20 }) action!: string;
  @Column({ type: 'jsonb', nullable: true }) changes!: Record<string, unknown> | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
