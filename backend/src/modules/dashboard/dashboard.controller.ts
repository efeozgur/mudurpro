import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { Court } from '../court/entities/court.entity';

const emptyWidget = { count: 0, items: [] as any[] };
const emptyDashboard = {
  criticalDeadlines: emptyWidget,
  pendingServices: emptyWidget,
  readyForFinalization: emptyWidget,
  readyForAppealTransfer: emptyWidget,
  feeMuzekkereRequired: emptyWidget,
  returnedServices: emptyWidget,
  recentActivity: emptyWidget,
  feeSummary: { totalCount: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, byStatus: {}, overdueItems: [] },
  serviceTracking: { items: [], byStatus: {}, totalCount: 0 },
};

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);
  constructor(
    private dashboardService: DashboardService,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(Court) private courtRepo: Repository<Court>,
  ) {}

  @Get()
  async getDashboard(@CurrentUser() user: any) {
    try {
      let courtIds: string[];

      if (user.role === 'SUPER_ADMIN') {
        const allCourts = await this.courtRepo.find({
          where: { deleted_at: IsNull() },
        });
        courtIds = allCourts.map((c) => c.id);
      } else {
        const userCourts = await this.userCourtRepo.find({
          where: { user_id: user.id, deleted_at: IsNull() },
        });
        courtIds = userCourts.map((uc) => uc.court_id);
      }

      if (courtIds.length === 0) {
        return { success: true, data: emptyDashboard, message: null };
      }

      const data = await this.dashboardService.getDashboard(user.id, courtIds);
      return { success: true, data, message: null };
    } catch (err) {
      this.logger.error(`Dashboard error for user ${user.id}: ${(err as Error).message}`);
      return { success: true, data: emptyDashboard, message: null };
    }
  }
}
