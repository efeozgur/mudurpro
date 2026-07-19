import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('service_records')
export class ServiceRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  case_file_id!: string;

  @Column({ type: 'uuid' })
  party_id!: string;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({ type: 'timestamptz', nullable: true })
  sent_date!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  served_date!: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'PREPARED' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  aciklama!: string | null;
}
