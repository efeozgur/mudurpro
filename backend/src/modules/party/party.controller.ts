import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PartyService } from './party.service';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Party } from './entities/party.entity';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class PartyController {
  constructor(
    private service: PartyService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
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

  @Get('cases/:caseFileId/parties')
  async findByCaseFile(@CurrentUser() user: any, @Param('caseFileId') caseFileId: string) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Get('parties/:id')
  async findById(@CurrentUser() user: any, @Param('id') id: string) {
    const party = await this.partyRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!party) throw new ForbiddenException('Taraf bulunamadı.');
    await this.verifyCaseFileAccess(party.case_file_id, user.id);
    return { success: true, data: await this.service.findById(id), message: null };
  }

  @Post('cases/:caseFileId/parties')
  async create(@CurrentUser() user: any, @Param('caseFileId') caseFileId: string, @Body() dto: CreatePartyDto) {
    await this.verifyCaseFileAccess(caseFileId, user.id);
    return { success: true, data: await this.service.create({ ...dto, case_file_id: caseFileId }), message: null };
  }

  @Put('parties/:id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdatePartyDto) {
    const party = await this.partyRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!party) throw new ForbiddenException('Taraf bulunamadı.');
    await this.verifyCaseFileAccess(party.case_file_id, user.id);
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Patch('parties/:id/deactivate')
  async deactivate(@CurrentUser() user: any, @Param('id') id: string, @Body('reason') reason: string) {
    const party = await this.partyRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!party) throw new ForbiddenException('Taraf bulunamadı.');
    await this.verifyCaseFileAccess(party.case_file_id, user.id);
    return { success: true, data: await this.service.deactivate(id, reason), message: null };
  }

  @Patch('parties/:id/reactivate')
  async reactivate(@CurrentUser() user: any, @Param('id') id: string) {
    const party = await this.partyRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!party) throw new ForbiddenException('Taraf bulunamadı.');
    await this.verifyCaseFileAccess(party.case_file_id, user.id);
    return { success: true, data: await this.service.reactivate(id), message: null };
  }

  @Delete('parties/:id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const party = await this.partyRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!party) throw new ForbiddenException('Taraf bulunamadı.');
    await this.verifyCaseFileAccess(party.case_file_id, user.id);
    return { success: true, data: await this.service.remove(id), message: null };
  }
}
