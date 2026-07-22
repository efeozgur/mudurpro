import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AppealResponse } from './entities/appeal-response.entity';
import { CreateAppealResponseDto } from './dto/create-appeal-response.dto';
import { UpdateAppealResponseDto } from './dto/update-appeal-response.dto';

@Injectable()
export class AppealResponseService {
  constructor(
    @InjectRepository(AppealResponse) private repo: Repository<AppealResponse>,
  ) {}

  async findByAppeal(appealId: string): Promise<AppealResponse[]> {
    return this.repo.find({
      where: { appeal_id: appealId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<AppealResponse> {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Cevap dilekçesi bulunamadı.');
    return entity;
  }

  async create(dto: CreateAppealResponseDto): Promise<AppealResponse> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateAppealResponseDto): Promise<AppealResponse> {
    const entity = await this.findById(id);
    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findById(id);
    entity.deleted_at = new Date();
    await this.repo.save(entity);
  }

  async hasResponseForParty(appealId: string, opposingPartyId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { appeal_id: appealId, opposing_party_id: opposingPartyId, deleted_at: IsNull() },
    });
    return count > 0;
  }
}
