import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users', { schema: 'public' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'varchar', length: 50 })
  role!: string;

  @Column({ type: 'uuid', nullable: true })
  courthouse_id!: string | null;
  @Column({ type: 'varchar', length: 20, default: 'APPROVED' })
  registration_status!: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by!: string | null;
  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  permissions!: string[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
