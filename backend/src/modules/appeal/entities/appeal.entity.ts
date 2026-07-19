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
  aciklama!: string | null;
}
