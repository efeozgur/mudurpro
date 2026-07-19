import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogService } from './audit-log.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private service: AuditLogService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: await this.service.findAll({
        user_id: user.id,
        module,
        action,
        start_date: startDate,
        end_date: endDate,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
      message: null,
    };
  }

  @Get('cases/:id/timeline')
  async getCaseTimeline(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return { success: true, data: await this.service.getCaseTimeline(id), message: null };
  }
}
