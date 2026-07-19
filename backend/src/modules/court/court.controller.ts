import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourtService } from './court.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Controller('courts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourtController {
  constructor(private service: CourtService) {}

  @Get()
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async findAll() {
    return { success: true, data: await this.service.findAll(), message: null };
  }

  @Get(':id')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async findById(@Param('id') id: string) {
    return { success: true, data: await this.service.findById(id), message: null };
  }

  @Post()
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async create(@Body() dto: CreateCourtDto) {
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateCourtDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Post(':id/assign-mudur')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async assignMudur(@Param('id') courtId: string, @Body('userId') userId: string) {
    return { success: true, data: await this.service.assignMudur(courtId, userId), message: null };
  }

  @Delete(':id/remove-mudur/:userId')
  @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN')
  async removeMudur(@Param('id') courtId: string, @Param('userId') userId: string) {
    return { success: true, data: await this.service.removeMudur(courtId, userId), message: null };
  }
}
