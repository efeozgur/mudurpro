import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { FeeTracking } from './entities/fee-tracking.entity';
import { Party } from '../party/entities/party.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { CreateFeeTrackingDto } from './dto/create-fee-tracking.dto';
import { UpdateFeeTrackingDto } from './dto/update-fee-tracking.dto';

@Injectable()
export class FeeTrackingService {
  constructor(
    @InjectRepository(FeeTracking) private repo: Repository<FeeTracking>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(ServiceRecord) private serviceRepo: Repository<ServiceRecord>,
  ) {}

  async findByCaseFile(caseFileId: string) {
    return this.repo.find({ where: { case_file_id: caseFileId, deleted_at: IsNull() } });
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Fee tracking record not found');
    return entity;
  }

  async create(dto: CreateFeeTrackingDto) {
    if (dto.amount <= 0) throw new BadRequestException('Amount must be greater than 0');

    const debtor = await this.partyRepo.findOne({
      where: { id: dto.debtor_party_id, case_file_id: dto.case_file_id, deleted_at: IsNull() },
    });
    if (!debtor) throw new BadRequestException('Debtor party does not exist in this case file');

    // Auto-calculate payment_due_date if not provided: latest served_date + 1 month
    if (!dto.payment_due_date && dto.case_file_id) {
      try {
        const latestService = await this.serviceRepo.findOne({
          where: { case_file_id: dto.case_file_id, served_date: Not(IsNull()), deleted_at: IsNull() },
          order: { served_date: 'DESC' as const },
        });
        if (latestService?.served_date) {
          const dueDate = new Date(latestService.served_date);
          dueDate.setMonth(dueDate.getMonth() + 1);
          (dto as any).payment_due_date = dueDate.toISOString().split('T')[0];
        }
      } catch { /* if no service record found, leave payment_due_date as null */ }
    }

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateFeeTrackingDto) {
    const entity = await this.findById(id);
    if (dto.amount !== undefined && dto.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }

  async recordPayment(id: string, paymentDate: string) {
    const entity = await this.findById(id);
    entity.payment_date = new Date(paymentDate);
    entity.status = 'PAYMENT_COMPLETED';
    entity.updated_at = new Date();
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findById(id);
    entity.deleted_at = new Date();
    return this.repo.save(entity);
  }
}
