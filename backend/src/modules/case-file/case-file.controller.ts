import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CaseFileService } from './case-file.service';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CreateCaseFileDto } from './dto/create-case-file.dto';
import { UpdateCaseFileDto } from './dto/update-case-file.dto';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class CaseFileController {
  constructor(
    private service: CaseFileService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
  ) {}

  private async getUserCourtIds(userId: string): Promise<string[]> {
    const userCourts = await this.userCourtRepo.find({
      where: { user_id: userId, deleted_at: IsNull() },
    });
    return userCourts.map((uc) => uc.court_id);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('court_id') courtId?: string,
    @Query('durum') durum?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userCourtIds = await this.getUserCourtIds(user.id);
    if (userCourtIds.length === 0) {
      return { success: true, data: { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }, message: null };
    }

    // If user filters by a specific court, ensure it's one they have access to
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
    const userCourtIds = await this.getUserCourtIds(user.id);
    const caseFile = await this.service.findById(id);
    if (!userCourtIds.includes(caseFile.court_id)) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    }
    return { success: true, data: caseFile, message: null };
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateCaseFileDto) {
    const userCourtIds = await this.getUserCourtIds(user.id);
    if (dto.court_id && !userCourtIds.includes(dto.court_id)) {
      throw new ForbiddenException('Bu mahkemeye dosya ekleme yetkiniz yok.');
    }
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCaseFileDto) {
    const userCourtIds = await this.getUserCourtIds(user.id);
    const caseFile = await this.service.findById(id);
    if (!userCourtIds.includes(caseFile.court_id)) {
      throw new ForbiddenException('Bu dosyayı düzenleme yetkiniz yok.');
    }
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Patch(':id/finalize')
  async finalize(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { finalized_at: string }) {
    const userCourtIds = await this.getUserCourtIds(user.id);
    const caseFile = await this.service.findById(id);
    if (!userCourtIds.includes(caseFile.court_id)) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    }
    return { success: true, data: await this.service.finalize(id, body.finalized_at), message: null };
  }

  @Patch(':id/archive')
  async archive(@CurrentUser() user: any, @Param('id') id: string) {
    const userCourtIds = await this.getUserCourtIds(user.id);
    const caseFile = await this.service.findById(id);
    if (!userCourtIds.includes(caseFile.court_id)) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    }
    return { success: true, data: await this.service.archive(id), message: null };
  }

  @Patch(':id/restore')
  async restore(@CurrentUser() user: any, @Param('id') id: string) {
    const userCourtIds = await this.getUserCourtIds(user.id);
    const caseFile = await this.service.findById(id);
    if (!userCourtIds.includes(caseFile.court_id)) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    }
    return { success: true, data: await this.service.restore(id), message: null };
  }

  @Patch(':id/send-to-upper-court')
  async sendToUpperCourt(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { sent_date: string }) {
    const userCourtIds = await this.getUserCourtIds(user.id);
    const caseFile = await this.service.findById(id);
    if (!userCourtIds.includes(caseFile.court_id)) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
    }
    return { success: true, data: await this.service.sendToUpperCourt(id, body.sent_date), message: null };
  }
}
