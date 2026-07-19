import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourthouseService } from './courthouse.service';
import { CreateCourthouseDto } from './dto/create-courthouse.dto';
import { UpdateCourthouseDto } from './dto/update-courthouse.dto';

@Controller('courthouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourthouseController {
  constructor(private service: CourthouseService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  async findAll() {
    return { success: true, data: await this.service.findAll(), message: null };
  }

  @Post()
  @Roles('SUPER_ADMIN')
  async create(@Body() dto: CreateCourthouseDto) {
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateCourthouseDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }
}
