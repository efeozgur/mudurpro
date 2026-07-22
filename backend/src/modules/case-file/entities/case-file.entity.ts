import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('case_files')
@Unique(['court_id', 'esas_no'])
export class CaseFile extends BaseEntity {
  @Column({ type: 'uuid' })
  court_id!: string;

  @Column({ type: 'varchar', length: 100 })
  esas_no!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  karar_no!: string | null;

  @Column({ type: 'date', nullable: true })
  karar_tarihi!: Date | null;

  @Column({ type: 'text', nullable: true })
  karar_sonucu!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  kanun_yolu!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  durum!: string;

  @Column({ type: 'text', nullable: true })
  aciklama!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  finalized_at!: Date | null;
}
