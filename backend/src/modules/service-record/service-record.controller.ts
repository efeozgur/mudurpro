import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ServiceRecordService } from './service-record.service';
import { CreateServiceRecordDto } from './dto/create-service-record.dto';
import { UpdateServiceRecordDto } from './dto/update-service-record.dto';
import { UpdateServiceStatusDto } from './dto/update-status.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class ServiceRecordController {
  constructor(private service: ServiceRecordService) {}

  @Get('cases/:caseFileId/services')
  async findByCaseFile(@Param('caseFileId') caseFileId: string) {
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Post('services')
  async create(@Body() dto: CreateServiceRecordDto) {
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put('services/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateServiceRecordDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Patch('services/:id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceStatusDto) {
    return { success: true, data: await this.service.updateStatus(id, dto.status), message: null };
  }
}
