import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('appeals')
export class Appeal extends BaseEntity {
  @Column({ type: 'uuid' })
  case_file_id!: string;

  @Column({ type: 'uuid' })
  applicant_party_id!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: string;

  @Column({ type: 'date' })
  application_date!: Date;

  @Column({ type: 'varchar', length: 50, default: 'CREATED' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  result!: string | null;

  @Column({ type: 'boolean', default: false })
  is_sent_to_upper_court!: boolean;

  @Column({ type: 'date', nullable: true })
  sent_to_upper_court_date!: Date | null;

  @Column({ type: 'text', nullable: true })
  aciklama!: string | null;
}
