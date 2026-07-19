import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Appeal } from './entities/appeal.entity';
import { Party } from '../party/entities/party.entity';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';

@Injectable()
export class AppealService {
  constructor(
    @InjectRepository(Appeal) private repo: Repository<Appeal>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
  ) {}

  async findByCaseFile(caseFileId: string) {
    return this.repo.find({ where: { case_file_id: caseFileId, deleted_at: IsNull() } });
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Appeal not found');
    return entity;
  }

  async create(dto: CreateAppealDto) {
    const applicant = await this.partyRepo.findOne({
      where: { id: dto.applicant_party_id, case_file_id: dto.case_file_id, deleted_at: IsNull() },
    });
    if (!applicant) throw new BadRequestException('Applicant party does not exist in this case file');

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateAppealDto) {
    const entity = await this.findById(id);
    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }
}
