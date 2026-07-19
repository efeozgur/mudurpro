import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  court_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  case_file_id!: string | null;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100 })
  module!: string;

  @Column({ type: 'varchar', length: 100 })
  entity!: string;

  @Column({ type: 'uuid', nullable: true })
  entity_id!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  old_value!: any;

  @Column({ type: 'jsonb', nullable: true })
  new_value!: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
