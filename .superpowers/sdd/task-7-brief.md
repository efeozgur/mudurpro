### Task 3.1: Courthouse CRUD

Create 5 files. Code verbatim from plan lines 1175-1276.

**Files:**
- backend/src/modules/courthouse/courthouse.module.ts (standard NestJS module importing TypeOrmModule.forFeature([Courthouse]))
- backend/src/modules/courthouse/courthouse.controller.ts
- backend/src/modules/courthouse/courthouse.service.ts
- backend/src/modules/courthouse/dto/create-courthouse.dto.ts
- backend/src/modules/courthouse/dto/update-courthouse.dto.ts

**Controller code** (use JwtAuthGuard not AuthGuard('jwt'), consistent with the project):
```typescript
import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourthouseService } from './courthouse.service';
import { CreateCourthouseDto } from './dto/create-courthouse.dto';
import { UpdateCourthouseDto } from './dto/update-courthouse.dto';

@Controller('courthouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourthouseController {
  constructor(private service: CourthouseService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  async findAll() {
    return { success: true, data: await this.service.findAll(), message: null };
  }

  @Post()
  @Roles('SUPER_ADMIN')
  async create(@Body() dto: CreateCourthouseDto) {
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateCourthouseDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }
}
```

**Service code** (from plan):
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll() { return this.repo.find({ where: { deleted_at: null } }); }

  async create(dto: CreateCourthouseDto) {
    const courthouse = this.repo.create({ ...dto, schema_name: `courthouse_${Date.now()}` });
    const saved = await this.repo.save(courthouse);
    await this.tenantService.createTenantSchema(saved.schema_name);
    return saved;
  }

  async update(id: string, dto: UpdateCourthouseDto) {
    await this.repo.update(id, { ...dto, updated_at: new Date() });
    return this.repo.findOne({ where: { id, deleted_at: null } });
  }
}
```

**DTOs:**
- CreateCourthouseDto: name (required, max 200), city (optional, max 100)
- UpdateCourthouseDto: name (optional), city (optional), active (optional boolean) — all Partial

**Module:** standard NestJS @Module with imports: [TypeOrmModule.forFeature([Courthouse])], controllers, providers, exports.

After creating all files, run `npm run build` and commit:
```bash
git add backend/src/modules/courthouse/
git commit -m "feat: add Courthouse CRUD with auto tenant schema creation"
```
