import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Party } from './entities/party.entity';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';

@Injectable()
export class PartyService {
  constructor(
    @InjectRepository(Party) private repo: Repository<Party>,
  ) {}

  async findByCaseFile(caseFileId: string) {
    return this.repo.find({ where: { case_file_id: caseFileId, deleted_at: IsNull() } });
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Party not found');
    return entity;
  }

  async create(dto: CreatePartyDto) {
    this.normalizeParty(dto);
    const warning = await this.checkDuplicate(dto);
    const entity = this.repo.create(dto);
    const saved = await this.repo.save(entity);
    return { ...saved, warning };
  }

  async update(id: string, dto: UpdatePartyDto) {
    this.normalizeParty(dto);
    const entity = await this.findById(id);
    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }

  private normalizeParty(dto: any) {
    if (dto.party_type) {
      const typeUpper = dto.party_type.toUpperCase();
      if (typeUpper === 'REAL' || typeUpper === 'PERSON' || typeUpper === 'GERÇEK' || typeUpper === 'GERCEK') {
        dto.party_type = 'PERSON';
      } else if (typeUpper === 'TÜZEL' || typeUpper === 'TUZEL' || typeUpper === 'ORGANIZATION') {
        dto.party_type = 'ORGANIZATION';
      }
    }
    if (dto.role) {
      const roleUpper = dto.role.toUpperCase();
      if (roleUpper.includes('DAVACI') || roleUpper === 'PLAINTIFF') {
        dto.role = 'PLAINTIFF';
      } else if (roleUpper.includes('DAVALI') || roleUpper === 'DEFENDANT') {
        dto.role = 'DEFENDANT';
      }
    }
  }

  async deactivate(id: string, reason: string) {
    const entity = await this.findById(id);
    entity.is_active = false;
    entity.removal_reason = reason;
    entity.updated_at = new Date();
    return this.repo.save(entity);
  }

  async reactivate(id: string) {
    const entity = await this.findById(id);
    entity.is_active = true;
    entity.removal_reason = null;
    entity.updated_at = new Date();
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findById(id);
    entity.deleted_at = new Date();
    return this.repo.save(entity);
  }

  private async checkDuplicate(dto: CreatePartyDto): Promise<string | null> {
    const name = dto.first_name || dto.organization_name || '';
    if (!name) return null;
    const existing = await this.repo.findOne({
      where: {
        case_file_id: dto.case_file_id,
        deleted_at: IsNull(),
      },
    });
    if (existing) {
      const existingName = existing.first_name || existing.organization_name || '';
      if (existingName === name) return 'A party with the same name already exists in this case file';
    }
    return null;
  }
}
