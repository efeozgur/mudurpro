import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('templates', { schema: 'public' })
export class Template extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: string; // TEXT, DECISION, MUZEKKERE

  @Column({ type: 'varchar', length: 50, default: 'PRIVATE' })
  visibility!: string; // PRIVATE, CITY, DISTRICT, NATIONAL

  @Column({ type: 'uuid' })
  @Index()
  created_by!: string;

  @Column({ type: 'uuid', nullable: true })
  courthouse_id!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district!: string | null;
}
