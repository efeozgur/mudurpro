import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  case_file_id!: string | null;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 4 })
  priority!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'CREATED' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  read_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at!: Date | null;
}
