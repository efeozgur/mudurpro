import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: await this.service.findByUser(user.id, {
        type,
        priority,
        status,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      }),
      message: null,
    };
  }

  @Get('unread')
  async findUnread(@CurrentUser() user: any) {
    return { success: true, data: await this.service.findUnread(user.id), message: null };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return { success: true, data: await this.service.markRead(id), message: null };
  }

  @Patch(':id/complete')
  async markComplete(@Param('id') id: string) {
    return { success: true, data: await this.service.markComplete(id), message: null };
  }
}
