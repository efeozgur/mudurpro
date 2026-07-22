import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('system_settings', { schema: 'public' })
export class SystemSetting extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  key!: string;

  @Column({ type: 'varchar', length: 500 })
  value!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string;
}
