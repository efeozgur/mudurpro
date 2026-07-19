import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CaseFileService } from './case-file.service';
import { CreateCaseFileDto } from './dto/create-case-file.dto';
import { UpdateCaseFileDto } from './dto/update-case-file.dto';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class CaseFileController {
  constructor(private service: CaseFileService) {}

  @Get()
  async findAll(
    @Query('court_id') courtId?: string,
    @Query('durum') durum?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: await this.service.findAll({
        court_id: courtId,
        durum,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
      message: null,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return { success: true, data: await this.service.findById(id), message: null };
  }

  @Post()
  async create(@Body() dto: CreateCaseFileDto) {
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCaseFileDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    return { success: true, data: await this.service.archive(id), message: null };
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return { success: true, data: await this.service.restore(id), message: null };
  }
}
