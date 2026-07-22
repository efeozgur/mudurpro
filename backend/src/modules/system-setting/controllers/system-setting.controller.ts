import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SystemSettingService } from '../services/system-setting.service';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SystemSettingController {
  constructor(private service: SystemSettingService) {}

  @Get()
  async getAll() {
    return { success: true, data: await this.service.getAll(), message: null };
  }

  @Put('admin_scope')
  async setAdminScope(@Body() body: { value: string }) {
    await this.service.set('admin_scope', body.value);
    return { success: true, data: { key: 'admin_scope', value: body.value }, message: null };
  }
}
