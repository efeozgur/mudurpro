import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { FeeTracking } from './entities/fee-tracking.entity';
import { Party } from '../party/entities/party.entity';
import { CreateFeeTrackingDto } from './dto/create-fee-tracking.dto';
import { UpdateFeeTrackingDto } from './dto/update-fee-tracking.dto';

@Injectable()
export class FeeTrackingService {
  constructor(
    @InjectRepository(FeeTracking) private repo: Repository<FeeTracking>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
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
}
