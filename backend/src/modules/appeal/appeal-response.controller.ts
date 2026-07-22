import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppealResponseService } from './appeal-response.service';
import { CreateAppealResponseDto } from './dto/create-appeal-response.dto';
import { UpdateAppealResponseDto } from './dto/update-appeal-response.dto';
import { Appeal } from './entities/appeal.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class AppealResponseController {
  constructor(
    private responseService: AppealResponseService,
    @InjectRepository(Appeal) private appealRepo: Repository<Appeal>,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
  ) {}

  private async getUserCourtIds(userId: string): Promise<string[]> {
    const userCourts = await this.userCourtRepo.find({
      where: { user_id: userId, deleted_at: IsNull() },
    });
    return userCourts.map((uc) => uc.court_id);
  }

  private async verifyCaseFileAccess(caseFileId: string, userId: string) {
    const userCourtIds = await this.getUserCourtIds(userId);
    const cf = await this.caseFileRepo.findOne({ where: { id: caseFileId, deleted_at: IsNull() } });
    if (!cf) throw new NotFoundException('Dosya bulunamadı.');
    if (!userCourtIds.includes(cf.court_id)) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    }
  }

  private async getAppealCaseFileId(appealId: string): Promise<string> {
    const appeal = await this.appealRepo.findOne({ where: { id: appealId, deleted_at: IsNull() } });
    if (!appeal) throw new NotFoundException('Kanun yolu başvurusu bulunamadı.');
    return appeal.case_file_id;
  }

  @Get('cases/:caseFileId/appeals/:appealId/responses')
  async findByAppeal(
    @CurrentUser() user: any,
    @Param('caseFileId') caseFileId: string,
    @Param('appealId') appealId: string,
  ) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    const data = await this.responseService.findByAppeal(appealId);
    return { success: true, data, message: null };
  }

  @Post('cases/:caseFileId/appeals/:appealId/responses')
  async create(
    @CurrentUser() user: any,
    @Param('caseFileId') caseFileId: string,
    @Param('appealId') appealId: string,
    @Body() dto: CreateAppealResponseDto,
  ) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    dto.appeal_id = appealId;
    const data = await this.responseService.create(dto);
    return { success: true, data, message: null };
  }

  @Put('appeal-responses/:id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppealResponseDto,
  ) {
    const existing = await this.responseService.findById(id);
    const caseFileId = await this.getAppealCaseFileId(existing.appeal_id);
    await this.verifyCaseFileAccess(caseFileId, user.id);
    const data = await this.responseService.update(id, dto);
    return { success: true, data, message: null };
  }

  @Delete('appeal-responses/:id')
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const existing = await this.responseService.findById(id);
    const caseFileId = await this.getAppealCaseFileId(existing.appeal_id);
    await this.verifyCaseFileAccess(caseFileId, user.id);
    await this.responseService.remove(id);
    return { success: true, data: null, message: null };
  }
}
