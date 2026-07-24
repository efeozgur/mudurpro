import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CaseFileService } from './case-file.service';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { ClerkCaseAssignment } from '../auth/entities/clerk-case-assignment.entity';
import { CreateCaseFileDto } from './dto/create-case-file.dto';
import { UpdateCaseFileDto } from './dto/update-case-file.dto';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR', 'KATIP')
export class CaseFileController {
  constructor(
    private service: CaseFileService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(ClerkCaseAssignment) private assignmentRepo: Repository<ClerkCaseAssignment>,
  ) {}

  private async getUserCourtIds(userId: string, courthouseId?: string): Promise<string[]> {
    const userCourts = await this.userCourtRepo.find({
      where: { user_id: userId, deleted_at: IsNull() },
    });
    if (userCourts.length > 0) return userCourts.map((uc) => uc.court_id);
    if (!courthouseId) return [];

    const [courthouse] = await this.userCourtRepo.manager.query(
      `SELECT schema_name FROM public.courthouses WHERE id = $1`,
      [courthouseId],
    );
    if (!courthouse?.schema_name || !/^[a-zA-Z0-9_]+$/.test(courthouse.schema_name)) return [];
    const courts = await this.userCourtRepo.manager.query(
      `SELECT id FROM "${courthouse.schema_name}"."courts"`,
    );
    return courts.map((court: { id: string }) => court.id);
  }
  private async getAssignedCaseIds(userId: string): Promise<string[]> {
    const assignments = await this.assignmentRepo.find({ where: { clerk_id: userId } });
    return assignments.map((assignment) => assignment.case_file_id);
  }

  private async assertCaseAccess(user: any, id: string, critical = false) {
    const caseFile = await this.service.findById(id);
    if (user.role === 'MUDUR') {
      const userCourtIds = await this.getUserCourtIds(user.id, user.courthouseId);
      if (!userCourtIds.includes(caseFile.court_id)) {
        throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
      }
      return caseFile;
    }

    if (!user.permissions?.includes('CASES')) {
      throw new ForbiddenException('Dosyalar modülüne erişim yetkiniz yok.');
    }
    if (critical) {
      throw new ForbiddenException('Bu kritik işlem yalnızca müdür tarafından yapılabilir.');
    }
    const assignment = await this.assignmentRepo.findOne({
      where: { clerk_id: user.id, case_file_id: id },
    });
    if (!assignment) throw new ForbiddenException('Bu dosya size atanmadı.');
    return caseFile;
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('court_id') courtId?: string,
    @Query('durum') durum?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (user.role === 'KATIP') {
      if (!user.permissions?.includes('CASES')) {
        throw new ForbiddenException('Dosyalar modülüne erişim yetkiniz yok.');
      }
      const caseFileIds = await this.getAssignedCaseIds(user.id);
      const data = await this.service.findAll({
        caseFileIds,
        durum,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
      return { success: true, data, message: null };
    }

    const userCourtIds = await this.getUserCourtIds(user.id, user.courthouseId);
    if (userCourtIds.length === 0) {
      return { success: true, data: { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }, message: null };
    }

    const allowedCourtIds = courtId && userCourtIds.includes(courtId)
      ? [courtId]
      : userCourtIds;

    return {
      success: true,
      data: await this.service.findAll({
        courtIds: allowedCourtIds,
        durum,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
      message: null,
    };
  }

  @Get(':id')
  async findById(@CurrentUser() user: any, @Param('id') id: string) {
    const caseFile = await this.assertCaseAccess(user, id);
    return { success: true, data: caseFile, message: null };
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateCaseFileDto) {
    if (user.role === 'KATIP') {
      throw new ForbiddenException('Dosya oluşturma yetkisi müdüre aittir.');
    }
    const userCourtIds = await this.getUserCourtIds(user.id, user.courthouseId);
    if (dto.court_id && !userCourtIds.includes(dto.court_id)) {
      throw new ForbiddenException('Bu mahkemeye dosya ekleme yetkiniz yok.');
    }
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCaseFileDto) {
    await this.assertCaseAccess(user, id);
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'MUDUR') {
      throw new ForbiddenException('Dosya silme yetkisi yalnızca müdüre aittir.');
    }
    await this.assertCaseAccess(user, id, true);
    return { success: true, data: await this.service.remove(id), message: null };
  }

  @Patch(':id/finalize')
  async finalize(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { finalized_at: string }) {
    await this.assertCaseAccess(user, id, true);
    return { success: true, data: await this.service.finalize(id, body.finalized_at), message: null };
  }

  @Patch(':id/archive')
  async archive(@CurrentUser() user: any, @Param('id') id: string) {
    await this.assertCaseAccess(user, id, true);
    return { success: true, data: await this.service.archive(id), message: null };
  }

  @Patch(':id/restore')
  async restore(@CurrentUser() user: any, @Param('id') id: string) {
    await this.assertCaseAccess(user, id, true);
    return { success: true, data: await this.service.restore(id), message: null };
  }

  @Patch(':id/send-to-upper-court')
  async sendToUpperCourt(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { sent_date: string }) {
    await this.assertCaseAccess(user, id, true);
    return { success: true, data: await this.service.sendToUpperCourt(id, body.sent_date), message: null };
  }
}
