import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('courthouses', { schema: 'public' })
export class Courthouse extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  schema_name!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
