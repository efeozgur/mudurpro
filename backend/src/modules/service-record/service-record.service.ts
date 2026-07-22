import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceRecord } from './entities/service-record.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { SureEngineService } from '../sure-engine/sure-engine.service';
import { CreateServiceRecordDto } from './dto/create-service-record.dto';
import { UpdateServiceRecordDto } from './dto/update-service-record.dto';

@Injectable()
export class ServiceRecordService {
  constructor(
    @InjectRepository(ServiceRecord) private repo: Repository<ServiceRecord>,
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    private sureEngine: SureEngineService,
  ) {}

  private async checkNotFinalized(caseFileId: string) {
    const cf = await this.caseFileRepo.findOne({ where: { id: caseFileId, deleted_at: IsNull() } });
    if (cf?.durum === 'FINALIZED') throw new BadRequestException('Kesinleşmiş dosyada işlem yapılamaz.');
  }

  private async recalculateCaseStatus(caseFileId: string) {
    try {
      const caseFile = await this.caseFileRepo.findOne({ where: { id: caseFileId, deleted_at: IsNull() } });
      if (!caseFile || caseFile.durum === 'ARCHIVED' || caseFile.durum === 'DRAFT' || caseFile.durum === 'FINALIZED') return;
      const calculated = await this.sureEngine.calculateSures(caseFileId);
      const statusMap: Record<string, string> = {
        'PENDING_SERVICES': 'SERVICE_IN_PROGRESS',
        'RETURNED_SERVICES': 'SERVICE_IN_PROGRESS',
        'NORMAL': 'WAITING_LEGAL_PERIOD',
        'TAKIP': 'WAITING_LEGAL_PERIOD',
        'YAKLASIYOR': 'WAITING_LEGAL_PERIOD',
        'KRITIK': 'WAITING_LEGAL_PERIOD',
        'GECMIS': 'WAITING_LEGAL_PERIOD',
      };
      const targetStatus = statusMap[calculated.status];
      if (targetStatus && caseFile.durum !== targetStatus) {
        caseFile.durum = targetStatus;
        caseFile.updated_at = new Date();
        await this.caseFileRepo.save(caseFile);
      }
    } catch {
      // Engine hataları kritik değil, sessiz geç
    }
  }

  async findByCaseFile(caseFileId: string) {
    return this.repo.find({ where: { case_file_id: caseFileId, deleted_at: IsNull() } });
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Service record not found');
    return entity;
  }

  async create(dto: CreateServiceRecordDto) {
    this.validateDates(dto.sent_date, dto.served_date, dto.status);
    if (dto.case_file_id) await this.checkNotFinalized(dto.case_file_id);
    const entity = this.repo.create(dto);
    const result = await this.repo.save(entity);
    if (dto.case_file_id) await this.recalculateCaseStatus(dto.case_file_id);
    return result;
  }

  async update(id: string, dto: UpdateServiceRecordDto) {
    const entity = await this.findById(id);
    const caseFileId = entity.case_file_id;
    await this.checkNotFinalized(caseFileId);
    Object.assign(entity, dto, { updated_at: new Date() });
    this.validateDates(
      dto.sent_date || entity.sent_date?.toISOString(),
      dto.served_date || entity.served_date?.toISOString(),
      dto.status || entity.status,
    );
    const result = await this.repo.save(entity);
    await this.recalculateCaseStatus(caseFileId);
    return result;
  }

  async updateStatus(id: string, newStatus: string, servedDate?: string) {
    const entity = await this.findById(id);
    const caseFileId = entity.case_file_id;
    await this.checkNotFinalized(caseFileId);
    this.validateDates(entity.sent_date?.toISOString(), servedDate, newStatus);
    entity.status = newStatus;
    entity.updated_at = new Date();
    if (servedDate) {
      entity.served_date = new Date(servedDate);
    }
    const result = await this.repo.save(entity);
    await this.recalculateCaseStatus(caseFileId);
    return result;
  }

  async remove(id: string) {
    const entity = await this.findById(id);
    const caseFileId = entity.case_file_id;
    await this.checkNotFinalized(caseFileId);
    entity.deleted_at = new Date();
    const result = await this.repo.save(entity);
    await this.recalculateCaseStatus(caseFileId);
    return result;
  }

  private validateDates(sentDate?: string, servedDate?: string, status?: string) {
    if (sentDate && servedDate) {
      if (new Date(servedDate) < new Date(sentDate)) {
        throw new BadRequestException('served_date cannot be before sent_date');
      }
    }
    if (status === 'RETURNED' && servedDate) {
      throw new BadRequestException('RETURNED status cannot have a served_date');
    }
  }
}
