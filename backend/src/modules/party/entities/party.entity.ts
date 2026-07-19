import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('parties')
export class Party extends BaseEntity {
  @Column({ type: 'uuid' })
  case_file_id!: string;

  @Column({ type: 'varchar', length: 20 })
  party_type!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  organization_name!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  national_id!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_number!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'text', nullable: true })
  removal_reason!: string | null;
}
