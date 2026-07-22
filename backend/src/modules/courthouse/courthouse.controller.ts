import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CourthouseService } from './courthouse.service';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { SystemSettingService } from '../system-setting/services/system-setting.service';
import { CreateCourthouseDto } from './dto/create-courthouse.dto';
import { UpdateCourthouseDto } from './dto/update-courthouse.dto';

@Controller('courthouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourthouseController {
  constructor(
    private service: CourthouseService,
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
    private settings: SystemSettingService,
  ) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  async findAll(@CurrentUser() user: { id: string; role: string; courthouseId?: string }) {
    if (user.role === 'ADLIYE_ADMIN') {
      if (!user.courthouseId) return { success: true, data: [], message: null };

      const scope = await this.settings.get('admin_scope');
      if (scope === 'city_and_districts') {
        // Find admin's own courthouse city
        const adminCourthouse = await this.courthouseRepo.findOne({
          where: { id: user.courthouseId, deleted_at: IsNull() },
        });
        if (!adminCourthouse?.city) {
          // No city set — just return own courthouse
          const item = await this.service.findById(user.courthouseId);
          return { success: true, data: item ? [item] : [], message: null };
        }
        // Return all courthouses in the same city
        const allInCity = await this.courthouseRepo.find({
          where: { city: adminCourthouse.city, deleted_at: IsNull() },
        });
        return { success: true, data: allInCity, message: null };
      }

      // Default city_only: just own courthouse
      const item = await this.service.findById(user.courthouseId);
      return { success: true, data: item ? [item] : [], message: null };
    }
    return { success: true, data: await this.service.findAll(), message: null };
  }

  @Get('hierarchy')
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  async getMerkezAdliyeler() {
    const rows = await this.courthouseRepo.manager.query(
      `SELECT DISTINCT name, il FROM public.adliye_rehberi WHERE teskilat_turu = 'ACM' AND faaliyet_durumu = 'Faal' ORDER BY il, name`
    );
    return { success: true, data: rows, message: null };
  }

  @Get('hierarchy/:acm')
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  async getIlceAdliyeler(@Param('acm') acm: string) {
    const rows = await this.courthouseRepo.manager.query(
      `SELECT name, bagli_oldugu_adliye, il FROM public.adliye_rehberi WHERE acm = $1 AND teskilat_turu = 'Mülhakat' AND faaliyet_durumu = 'Faal' ORDER BY name`,
      [acm]
    );
    return { success: true, data: rows, message: null };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  async findById(@CurrentUser() user: any, @Param('id') id: string) {
    return { success: true, data: await this.service.findById(id), message: null };
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  async create(@CurrentUser() user: any, @Body() dto: CreateCourthouseDto) {
    if (user.role === 'ADLIYE_ADMIN') {
      // Auto-fill city/district from admin's own courthouse
      const adminCh = await this.courthouseRepo.findOne({
        where: { id: user.courthouseId, deleted_at: IsNull() },
      });
      if (adminCh) {
        dto.city = adminCh.city || undefined;
        dto.district = adminCh.district || undefined;
        dto.connected_to = adminCh.id;
      }
    }
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCourthouseDto) {
    if (user.role === 'ADLIYE_ADMIN') {
      // ADLIYE_ADMIN can only update name, not city/district
      const target = await this.service.findById(id);
      if (!target) throw new NotFoundException('Adliye bulunamadı.');
      // Check that the courthouse is in the same city as the admin's courthouse
      const adminCh = await this.courthouseRepo.findOne({
        where: { id: user.courthouseId, deleted_at: IsNull() },
      });
      if (!adminCh?.city || target.city !== adminCh.city) {
        throw new ForbiddenException('Bu adliyeyi düzenleme yetkiniz yok.');
      }
      await this.service.update(id, { name: dto.name });
      return { success: true, data: await this.service.findById(id), message: null };
    }
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role === 'ADLIYE_ADMIN') {
      const target = await this.service.findById(id);
      if (!target) throw new NotFoundException('Adliye bulunamadı.');
      const adminCh = await this.courthouseRepo.findOne({
        where: { id: user.courthouseId, deleted_at: IsNull() },
      });
      if (!adminCh?.city || target.city !== adminCh.city) {
        throw new ForbiddenException('Bu adliyeyi silme yetkiniz yok.');
      }
    }
    await this.service.remove(id);
    return { success: true, data: null, message: 'Adliye başarıyla silindi.' };
  }
}
