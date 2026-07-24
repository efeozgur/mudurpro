import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
@Entity('feedbacks')
@Index(['user_id','created_at'])
export class Feedback extends BaseEntity {
  @Column({type:'uuid'}) user_id!: string;
  @Column({type:'uuid',nullable:true}) courthouse_id!: string|null;
  @Column({length:30,default:'SUGGESTION'}) type!: string;
  @Column({length:40,default:'OTHER'}) category!: string;
  @Column({length:200}) title!: string;
  @Column({type:'text'}) description!: string;
  @Column({length:15,default:'NORMAL'}) priority!: string;
  @Column({length:25,default:'SUBMITTED'}) status!: string;
  @Column({type:'varchar',length:300,nullable:true}) page_url!: string|null;
  @Column({type:'varchar',length:20,nullable:true}) app_version!: string|null;
  @Column({type:'text',nullable:true}) admin_note!: string|null;
  @Column({type:'varchar',length:20,nullable:true}) resolved_version!: string|null;
  @Column({type:'timestamptz',nullable:true}) resolved_at!: Date|null;
}
