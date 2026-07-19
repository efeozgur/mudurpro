import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CaseFile } from './entities/case-file.entity';
import { CreateCaseFileDto } from './dto/create-case-file.dto';
import { UpdateCaseFileDto } from './dto/update-case-file.dto';

@Injectable()
export class CaseFileService {
  constructor(
    @InjectRepository(CaseFile) private repo: Repository<CaseFile>,
  ) {}

  async findAll(filters?: { court_id?: string; durum?: string; page?: number; limit?: number }) {
    const where: any = { deleted_at: IsNull() };
    if (filters?.court_id) where.court_id = filters.court_id;
    if (filters?.durum) where.durum = filters.durum;
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Case file not found');
    return entity;
  }

  async create(dto: CreateCaseFileDto) {
    const existing = await this.repo.findOne({
      where: { court_id: dto.court_id, esas_no: dto.esas_no, deleted_at: IsNull() },
    });
    if (existing) throw new ConflictException('A case file with this esas_no already exists in this court');
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCaseFileDto) {
    const entity = await this.findById(id);
    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }

  async archive(id: string) {
    const entity = await this.findById(id);
    await this.repo.softDelete(id);
    return { success: true };
  }

  async restore(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Case file not found');
    if (!entity.deleted_at) throw new ConflictException('Case file is not archived');
    await this.repo.restore(id);
    return this.repo.findOne({ where: { id } });
  }
}
