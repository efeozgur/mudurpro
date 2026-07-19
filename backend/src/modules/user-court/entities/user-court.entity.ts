import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('user_courts')
@Unique(['user_id', 'court_id'])
export class UserCourt extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  court_id!: string;
}
