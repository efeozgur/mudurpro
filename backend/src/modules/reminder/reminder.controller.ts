import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ShareReminderDto } from './dto/share-reminder.dto';

type AuthenticatedUser = { id: string };

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class ReminderController {
  constructor(private readonly service: ReminderService) {}

  @Get()
  async all(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) {
    return { success: true, data: await this.service.findAll(user.id, from, to), message: null };
  }

  @Get('export')
  async export(@CurrentUser() user: AuthenticatedUser, @Res() response: Response) {
    const calendar = await this.service.exportCalendar(user.id);
    response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="reminders.ics"');
    return response.send(calendar);
  }

  @Get(':id/history')
  async history(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.history(id, user.id), message: null };
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReminderDto) {
    return { success: true, data: await this.service.create(user.id, dto), message: null };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateReminderDto) {
    return { success: true, data: await this.service.update(id, user.id, dto), message: null };
  }

  @Post(':id/share')
  async share(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ShareReminderDto) {
    return { success: true, data: await this.service.share(id, user.id, dto), message: null };
  }

  @Patch(':id/share')
  async updateShare(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ShareReminderDto) {
    return { success: true, data: await this.service.share(id, user.id, dto), message: null };
  }

  @Patch(':id/assign')
  async assign(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ShareReminderDto) {
    return { success: true, data: await this.service.share(id, user.id, { assigned_to_user_id: dto.assigned_to_user_id }), message: null };
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.service.complete(id, user.id), message: null };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.service.remove(id, user.id);
    return { success: true, data: null, message: null };
  }
}
