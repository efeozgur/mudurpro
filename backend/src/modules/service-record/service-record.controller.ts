import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ServiceRecordService } from './service-record.service';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { ServiceRecord } from './entities/service-record.entity';
import { CreateServiceRecordDto } from './dto/create-service-record.dto';
import { UpdateServiceRecordDto } from './dto/update-service-record.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class ServiceRecordController {
  constructor(
    private service: ServiceRecordService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    @InjectRepository(ServiceRecord) private serviceRepo: Repository<ServiceRecord>,
  ) {}

  private async getUserCourtIds(userId: string): Promise<string[]> {
    const userCourts = await this.userCourtRepo.find({
      where: { user_id: userId, deleted_at: IsNull() },
    });
    return userCourts.map((uc) => uc.court_id);
  }

  private async verifyCaseFileAccess(caseFileId: string, userId: string): Promise<void> {
    const userCourtIds = await this.getUserCourtIds(userId);
    const cf = await this.caseFileRepo.findOne({ where: { id: caseFileId, deleted_at: IsNull() } });
    if (!cf || !userCourtIds.includes(cf.court_id)) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    }
  }

  @Get('cases/:caseFileId/services')
  async findByCaseFile(@CurrentUser() user: any, @Param('caseFileId') caseFileId: string) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Post('services')
  async create(@CurrentUser() user: any, @Body() dto: CreateServiceRecordDto) {
    if (!dto.case_file_id) throw new ForbiddenException('Dosya ID zorunludur.');
    await this.verifyCaseFileAccess(dto.case_file_id, user.id);
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put('services/:id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateServiceRecordDto) {
    const sr = await this.serviceRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!sr) throw new ForbiddenException('Tebligat kaydı bulunamadı.');
    await this.verifyCaseFileAccess(sr.case_file_id, user.id);
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Patch('services/:id/status')
  async updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string; served_date?: string }) {
    const sr = await this.serviceRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!sr) throw new ForbiddenException('Tebligat kaydı bulunamadı.');
    await this.verifyCaseFileAccess(sr.case_file_id, user.id);
    return { success: true, data: await this.service.updateStatus(id, body.status, body.served_date), message: null };
  }

  @Delete('services/:id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const sr = await this.serviceRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!sr) throw new ForbiddenException('Tebligat kaydı bulunamadı.');
    await this.verifyCaseFileAccess(sr.case_file_id, user.id);
    return { success: true, data: await this.service.remove(id), message: null };
  }
}
