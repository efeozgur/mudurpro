import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('courts')
export class Court extends BaseEntity {
  @Column({ type: 'uuid' })
  courthouse_id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
