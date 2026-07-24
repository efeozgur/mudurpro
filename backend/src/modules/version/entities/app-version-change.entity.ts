import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AppVersion } from './app-version.entity';

@Entity('app_version_changes')
export class AppVersionChange extends BaseEntity {
  @Column({ type: 'uuid' }) version_id!: string;
  @ManyToOne(() => AppVersion, (version) => version.changes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'version_id' }) version!: AppVersion;
  @Column({ type: 'text' }) description!: string;
  @Column({ default: 0 }) sort_order!: number;
}
