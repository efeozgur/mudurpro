import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('appeal_responses')
@Unique(['appeal_id', 'opposing_party_id'])
export class AppealResponse extends BaseEntity {
  @Column({ type: 'uuid' })
  appeal_id!: string;

  @Column({ type: 'uuid' })
  opposing_party_id!: string;

  @Column({ type: 'date' })
  response_date!: Date;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ type: 'date', nullable: true })
  received_date!: Date | null;

  @Column({ type: 'text', nullable: true })
  aciklama!: string | null;
}
