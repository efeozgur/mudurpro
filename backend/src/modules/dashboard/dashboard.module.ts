import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Party } from '../party/entities/party.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { SureEngineModule } from '../sure-engine/sure-engine.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaseFile, Party, ServiceRecord, Appeal, FeeTracking, AuditLog, UserCourt]),
    SureEngineModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
