import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserCourt } from '../user-court/entities/user-court.entity';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
  ) {}

  @Get()
  async getDashboard(@CurrentUser() user: any) {
    const userCourts = await this.userCourtRepo.find({
      where: { user_id: user.id, deleted_at: IsNull() },
    });
    const courtIds = userCourts.map((uc) => uc.court_id);

    const data = await this.dashboardService.getDashboard(user.id, courtIds);
    return { success: true, data, message: null };
  }
}
