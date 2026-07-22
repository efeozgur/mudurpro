import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeTracking } from './entities/fee-tracking.entity';
import { Party } from '../party/entities/party.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { FeeTrackingController } from './fee-tracking.controller';
import { FeeTrackingService } from './fee-tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeTracking, Party, UserCourt, CaseFile, ServiceRecord])],
  controllers: [FeeTrackingController],
  providers: [FeeTrackingService],
  exports: [FeeTrackingService],
})
export class FeeTrackingModule {}