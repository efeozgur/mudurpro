import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { TenantService } from '../tenant/tenant.service';
import { CreateCourthouseDto } from './dto/create-courthouse.dto';
import { UpdateCourthouseDto } from './dto/update-courthouse.dto';

@Injectable()
export class CourthouseService {
  constructor(
    @InjectRepository(Courthouse) private repo: Repository<Courthouse>,
    private tenantService: TenantService,
  ) {}

  async findAll() { return this.repo.find({ where: { deleted_at: IsNull() } }); }

  async create(dto: CreateCourthouseDto) {
    const courthouse = this.repo.create({ ...dto, schema_name: `courthouse_${Date.now()}` });
    const saved = await this.repo.save(courthouse);
    await this.tenantService.createTenantSchema(saved.schema_name);
    return saved;
  }

  async update(id: string, dto: UpdateCourthouseDto) {
    await this.repo.update(id, { ...dto, updated_at: new Date() });
    return this.repo.findOne({ where: { id, deleted_at: IsNull() } });
  }
}
