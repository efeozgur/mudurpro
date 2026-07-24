import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Appeal } from './entities/appeal.entity';
import { Party } from '../party/entities/party.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';

@Injectable()
export class AppealService {
  constructor(
    @InjectRepository(Appeal) private repo: Repository<Appeal>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
  ) {}

  private async checkNotFinalized(caseFileId: string) {
    const cf = await this.caseFileRepo.findOne({ where: { id: caseFileId, deleted_at: IsNull() } });
    if (cf?.durum === 'FINALIZED') throw new BadRequestException('Kesinleşmiş dosyada işlem yapılamaz.');
  }

  async findByCaseFile(caseFileId: string) {
    return this.repo.find({ where: { case_file_id: caseFileId, deleted_at: IsNull() } });
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Appeal not found');
    return entity;
  }

  async create(dto: CreateAppealDto) {
    await this.checkNotFinalized(dto.case_file_id!);
    this.normalizeAppeal(dto);
    const caseFile = await this.caseFileRepo.findOne({ where: { id: dto.case_file_id, deleted_at: IsNull() } });
    const normalizedKanunYolu = caseFile?.kanun_yolu
      ?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const expectedType = normalizedKanunYolu?.includes('ISTINAF')
      ? 'ISTINAF'
      : normalizedKanunYolu?.includes('TEMYIZ')
        ? 'TEMYIZ'
        : null;
    if (expectedType && dto.type !== expectedType) {
      throw new BadRequestException(`Bu dosya için yalnızca ${expectedType === 'ISTINAF' ? 'İstinaf' : 'Temyiz'} başvurusu eklenebilir.`);
    }
    const applicant = await this.partyRepo.findOne({
      where: { id: dto.applicant_party_id, case_file_id: dto.case_file_id, deleted_at: IsNull() },
    });
    if (!applicant) throw new BadRequestException('Applicant party does not exist in this case file');

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateAppealDto) {
    this.normalizeAppeal(dto);
    const entity = await this.findById(id);
    const caseFileId = entity.case_file_id;
    await this.checkNotFinalized(caseFileId);

    // Verify changed applicant party belongs to same case file
    if (dto.applicant_party_id && dto.applicant_party_id !== entity.applicant_party_id) {
      const applicant = await this.partyRepo.findOne({
        where: { id: dto.applicant_party_id, case_file_id: caseFileId, deleted_at: IsNull() },
      });
      if (!applicant) throw new BadRequestException('Seçilen taraf bu dosyada bulunamadı.');
    }

    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findById(id);
    await this.checkNotFinalized(entity.case_file_id);
    entity.deleted_at = new Date();
    return this.repo.save(entity);
  }

  private normalizeAppeal(dto: any) {
    if (dto.type) {
      const typeUpper = dto.type.toUpperCase();
      if (typeUpper.includes('ISTINAF') || typeUpper.includes('İSTİNAF') || typeUpper.includes('İSTINAF')) {
        dto.type = 'ISTINAF';
      } else if (typeUpper.includes('TEMYIZ') || typeUpper.includes('TEMYİZ')) {
        dto.type = 'TEMYIZ';
      }
    }
  }
}
