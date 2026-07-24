import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class ReminderController {
  constructor(private readonly service: ReminderService) {}
  @Get() async all(@CurrentUser() user: any, @Query('from') from?: string, @Query('to') to?: string) { return { success: true, data: await this.service.findAll(user.id, from, to), message: null }; }
  @Post() async create(@CurrentUser() user: any, @Body() dto: CreateReminderDto) { return { success: true, data: await this.service.create(user.id, dto), message: null }; }
  @Patch(':id') async update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: Partial<CreateReminderDto>) { return { success: true, data: await this.service.update(id, user.id, dto), message: null }; }
  @Patch(':id/complete') async complete(@Param('id') id: string, @CurrentUser() user: any) { return { success: true, data: await this.service.complete(id, user.id), message: null }; }
  @Delete(':id') async remove(@Param('id') id: string, @CurrentUser() user: any) { await this.service.remove(id, user.id); return { success: true, data: null, message: null }; }
}
