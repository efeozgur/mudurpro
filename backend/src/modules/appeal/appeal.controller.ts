import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppealService } from './appeal.service';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Appeal } from './entities/appeal.entity';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class AppealController {
  constructor(
    private service: AppealService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    @InjectRepository(Appeal) private appealRepo: Repository<Appeal>,
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
    if (!cf) throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    const assignment = await this.userCourtRepo.manager.query(
      `SELECT 1 FROM clerk_case_assignments WHERE clerk_id = $1 AND case_file_id = $2 AND deleted_at IS NULL`,
      [userId, caseFileId],
    );
    if (assignment.length > 0 || userCourtIds.includes(cf.court_id)) return;
    throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');

  }
  @Get('cases/:caseFileId/appeals')
  async findByCaseFile(@CurrentUser() user: any, @Param('caseFileId') caseFileId: string) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Post('cases/:caseFileId/appeals')
  async create(@CurrentUser() user: any, @Param('caseFileId') caseFileId: string, @Body() dto: CreateAppealDto) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    return { success: true, data: await this.service.create({ ...dto, case_file_id: caseFileId }), message: null };
  }

  @Put('appeals/:id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateAppealDto) {
    const appeal = await this.appealRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!appeal) throw new ForbiddenException('Başvuru bulunamadı.');
    await this.verifyCaseFileAccess(appeal.case_file_id, user.id);
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Delete('appeals/:id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const appeal = await this.appealRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!appeal) throw new ForbiddenException('Başvuru bulunamadı.');
    await this.verifyCaseFileAccess(appeal.case_file_id, user.id);
    return { success: true, data: await this.service.remove(id), message: null };
  }
}
