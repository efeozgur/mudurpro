import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
@Injectable() export class FeedbackService { constructor(@InjectRepository(Feedback) private repo:Repository<Feedback>){} create(user:any,dto:CreateFeedbackDto){return this.repo.save(this.repo.create({...dto,user_id:user.id,courthouse_id:user.courthouseId||null,status:'SUBMITTED',priority:dto.priority||'NORMAL',page_url:dto.page_url||null,app_version:dto.app_version||null}));} mine(userId:string){return this.repo.find({where:{user_id:userId,deleted_at:IsNull()},order:{created_at:'DESC'}});} all(){return this.repo.find({where:{deleted_at:IsNull()},order:{created_at:'DESC'}});} async update(id:string,patch:Partial<Feedback>){const item=await this.repo.findOne({where:{id,deleted_at:IsNull()}});if(!item)throw new NotFoundException('Öneri bulunamadı');Object.assign(item,patch);if(patch.status==='COMPLETED')item.resolved_at=new Date();return this.repo.save(item);} }
