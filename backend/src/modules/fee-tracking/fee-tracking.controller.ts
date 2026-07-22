import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeeTrackingService } from './fee-tracking.service';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { FeeTracking } from './entities/fee-tracking.entity';
import { CreateFeeTrackingDto } from './dto/create-fee-tracking.dto';
import { UpdateFeeTrackingDto } from './dto/update-fee-tracking.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class FeeTrackingController {
  constructor(
    private service: FeeTrackingService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    @InjectRepository(FeeTracking) private feeRepo: Repository<FeeTracking>,
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

  @Get('cases/:caseFileId/fees')
  async findByCaseFile(@CurrentUser() user: any, @Param('caseFileId') caseFileId: string) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Post('cases/:caseFileId/fees')
  async create(@CurrentUser() user: any, @Param('caseFileId') caseFileId: string, @Body() dto: CreateFeeTrackingDto) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    return { success: true, data: await this.service.create({ ...dto, case_file_id: caseFileId }), message: null };
  }

  @Put('fees/:id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateFeeTrackingDto) {
    const fee = await this.feeRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!fee) throw new ForbiddenException('Harç kaydı bulunamadı.');
    await this.verifyCaseFileAccess(fee.case_file_id, user.id);
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Delete('fees/:id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const fee = await this.feeRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!fee) throw new ForbiddenException('Harç kaydı bulunamadı.');
    await this.verifyCaseFileAccess(fee.case_file_id, user.id);
    return { success: true, data: await this.service.remove(id), message: null };
  }

  @Patch('fees/:id/payment')
  async recordPayment(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { payment_date: string }) {
    const fee = await this.feeRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!fee) throw new ForbiddenException('Harç kaydı bulunamadı.');
    await this.verifyCaseFileAccess(fee.case_file_id, user.id);
    return { success: true, data: await this.service.recordPayment(id, body.payment_date), message: null };
  }
}
