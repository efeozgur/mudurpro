import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CourtService } from './court.service';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { SystemSettingService } from '../system-setting/services/system-setting.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Controller('courts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourtController {
  constructor(
    private service: CourtService,
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
    private settings: SystemSettingService,
  ) {}

  private async getPermittedCourthouseIds(role: string, courthouseId?: string): Promise<string[] | null> {
    if (role !== 'ADLIYE_ADMIN' || !courthouseId) return null; // null = all
    const scope = await this.settings.get('admin_scope');
    if (scope !== 'city_and_districts') return [courthouseId];
    // city_and_districts: find city of admin's courthouse, return all with same city
    const adminCourthouse = await this.courthouseRepo.findOne({ where: { id: courthouseId, deleted_at: IsNull() } });
    if (!adminCourthouse?.city) return [courthouseId];
    const allInCity = await this.courthouseRepo.find({ where: { city: adminCourthouse.city, deleted_at: IsNull() } });
    return allInCity.map(c => c.id);
  }

  @Get()
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN', 'MUDUR')
  async findAll(@CurrentUser() user: any) {
    const permitted = await this.getPermittedCourthouseIds(user.role, user.courthouseId);
    return { success: true, data: await this.service.findAll(user, permitted), message: null };
  }

  @Get(':id')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async findById(@CurrentUser() user: any, @Param('id') id: string) {
    return { success: true, data: await this.service.findById(id, user), message: null };
  }

  @Post()
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async create(@CurrentUser() user: any, @Body() dto: CreateCourtDto) {
    const permitted = await this.getPermittedCourthouseIds(user.role, user.courthouseId);
    if (permitted && !permitted.includes(dto.courthouse_id)) {
      throw new ForbiddenException('Bu adliyeye mahkeme ekleme yetkiniz yok.');
    }
    return { success: true, data: await this.service.create(dto, user), message: null };
  }

  @Put(':id')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCourtDto) {
    if (dto.courthouse_id) {
      const permitted = await this.getPermittedCourthouseIds(user.role, user.courthouseId);
      if (permitted && !permitted.includes(dto.courthouse_id)) {
        throw new ForbiddenException('Bu adliyeye ait mahkemeyi düzenleme yetkiniz yok.');
      }
    }
    return { success: true, data: await this.service.update(id, dto, user), message: null };
  }

  @Post(':id/assign-mudur')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async assignMudur(@CurrentUser() user: any, @Param('id') courtId: string, @Body('userId') userId: string) {
    return { success: true, data: await this.service.assignMudur(courtId, userId, user), message: null };
  }

  @Delete(':id')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return { success: true, data: await this.service.remove(id, user), message: null };
  }

  @Delete(':id/remove-mudur/:userId')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async removeMudur(@CurrentUser() user: any, @Param('id') courtId: string, @Param('userId') userId: string) {
    return { success: true, data: await this.service.removeMudur(courtId, userId, user), message: null };
  }
}
