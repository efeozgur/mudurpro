import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('clerk_case_assignments', { schema: 'public' })
@Unique(['clerk_id', 'case_file_id'])
export class ClerkCaseAssignment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  clerk_id!: string;

  @Index()
  @Column({ type: 'uuid' })
  case_file_id!: string;

  @Index()
  @Column({ type: 'uuid' })
  court_id!: string;

  @Column({ type: 'uuid' })
  assigned_by!: string;
}
