import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PartyService } from './party.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class PartyController {
  constructor(private service: PartyService) {}

  @Get('cases/:caseFileId/parties')
  async findByCaseFile(@Param('caseFileId') caseFileId: string) {
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Post('cases/:caseFileId/parties')
  async create(@Param('caseFileId') caseFileId: string, @Body() dto: CreatePartyDto) {
    return { success: true, data: await this.service.create({ ...dto, case_file_id: caseFileId }), message: null };
  }

  @Put('parties/:id')
  async update(@Param('id') id: string, @Body() dto: UpdatePartyDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Patch('parties/:id/deactivate')
  async deactivate(@Param('id') id: string, @Body('reason') reason: string) {
    return { success: true, data: await this.service.deactivate(id, reason), message: null };
  }

  @Patch('parties/:id/reactivate')
  async reactivate(@Param('id') id: string) {
    return { success: true, data: await this.service.reactivate(id), message: null };
  }
}
