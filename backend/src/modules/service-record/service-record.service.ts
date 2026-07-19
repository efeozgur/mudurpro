import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceRecord } from './entities/service-record.entity';
import { CreateServiceRecordDto } from './dto/create-service-record.dto';
import { UpdateServiceRecordDto } from './dto/update-service-record.dto';

@Injectable()
export class ServiceRecordService {
  constructor(
    @InjectRepository(ServiceRecord) private repo: Repository<ServiceRecord>,
  ) {}

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
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateServiceRecordDto) {
    const entity = await this.findById(id);
    Object.assign(entity, dto, { updated_at: new Date() });
    this.validateDates(
      dto.sent_date || entity.sent_date?.toISOString(),
      dto.served_date || entity.served_date?.toISOString(),
      dto.status || entity.status,
    );
    return this.repo.save(entity);
  }

  async updateStatus(id: string, newStatus: string) {
    const entity = await this.findById(id);
    if (newStatus === 'SERVED' && entity.served_date) {
      // Placeholder: SureEngine should be triggered here
    }
    entity.status = newStatus;
    entity.updated_at = new Date();
    return this.repo.save(entity);
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
