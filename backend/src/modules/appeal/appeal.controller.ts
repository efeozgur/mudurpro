import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppealService } from './appeal.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class AppealController {
  constructor(private service: AppealService) {}

  @Get('cases/:caseFileId/appeals')
  async findByCaseFile(@Param('caseFileId') caseFileId: string) {
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Post('cases/:caseFileId/appeals')
  async create(@Param('caseFileId') caseFileId: string, @Body() dto: CreateAppealDto) {
    return { success: true, data: await this.service.create({ ...dto, case_file_id: caseFileId }), message: null };
  }

  @Put('appeals/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateAppealDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }
}
