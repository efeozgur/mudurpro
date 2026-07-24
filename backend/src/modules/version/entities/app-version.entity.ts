import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AppVersionChange } from './app-version-change.entity';

@Entity('app_versions')
export class AppVersion extends BaseEntity {
  @Column({ length: 20, unique: true }) version!: string;
  @Column({ type: 'date' }) release_date!: string;
  @Column({ type: 'text' }) summary!: string;
  @Column({ default: false }) is_current!: boolean;
  @Column({ length: 12, nullable: true }) commit_hash!: string | null;
  @OneToMany(() => AppVersionChange, (change) => change.version, { cascade: true }) changes!: AppVersionChange[];
}
