import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Court } from '../court/entities/court.entity';
import { Party } from '../party/entities/party.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { AppealResponse } from '../appeal/entities/appeal-response.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { ClerkCaseAssignment } from '../auth/entities/clerk-case-assignment.entity';
import { SureEngineModule } from '../sure-engine/sure-engine.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaseFile, Court, Party, ServiceRecord, Appeal, AppealResponse, FeeTracking, AuditLog, UserCourt, ClerkCaseAssignment]),
    SureEngineModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
