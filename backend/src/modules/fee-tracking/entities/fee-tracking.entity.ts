import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('fee_trackings')
export class FeeTracking extends BaseEntity {
  @Column({ type: 'uuid' })
  case_file_id!: string;

  @Column({ type: 'uuid' })
  debtor_party_id!: string;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  served_date!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  payment_due_date!: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'CREATED' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  payment_date!: Date | null;

  @Column({ type: 'text', nullable: true })
  aciklama!: string | null;
}
