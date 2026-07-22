import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR', 'KATIP')
export class TemplateController {
  constructor(private service: TemplateService) {}
  private assertTemplatePermission(user: { role: string; permissions?: string[] }) {
    if (user.role === 'KATIP' && !user.permissions?.includes('TEMPLATES')) {
      throw new ForbiddenException('Şablonlar modülüne erişim yetkiniz yok.');
    }
  }


  @Get()
  async findAll(@CurrentUser() user: { id: string; role: string; permissions?: string[]; courthouseId?: string }) {
    this.assertTemplatePermission(user);
    const data = await this.service.findAll(user.id, user.courthouseId);
    return { success: true, data, message: null };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: { role: string; permissions?: string[] }) {
    this.assertTemplatePermission(user);
    const data = await this.service.findById(id);
    return { success: true, data, message: null };
  }

  @Post()
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: { id: string; role: string; permissions?: string[]; courthouseId?: string },
  ) {
    this.assertTemplatePermission(user);
    const data = await this.service.create(dto, user.id, user.courthouseId);
    return { success: true, data, message: null };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: { id: string; role: string; permissions?: string[] },
  ) {
    this.assertTemplatePermission(user);
    const data = await this.service.update(id, dto, user.id);
    return { success: true, data, message: null };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; permissions?: string[] },
  ) {
    this.assertTemplatePermission(user);
    await this.service.remove(id, user.id);
    return { success: true, data: null, message: 'Şablon silindi.' };
  }
}
