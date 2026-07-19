import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Party } from '../party/entities/party.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';
import { SureEngineService } from './sure-engine.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaseFile, Party, ServiceRecord, Appeal, FeeTracking])],
  providers: [SureEngineService],
  exports: [SureEngineService],
})
export class SureEngineModule {}
