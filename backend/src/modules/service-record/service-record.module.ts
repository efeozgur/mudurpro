import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRecord } from './entities/service-record.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { SureEngineModule } from '../sure-engine/sure-engine.module';
import { ServiceRecordController } from './service-record.controller';
import { ServiceRecordService } from './service-record.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceRecord, UserCourt, CaseFile]), SureEngineModule],
  controllers: [ServiceRecordController],
  providers: [ServiceRecordService],
  exports: [ServiceRecordService],
})
export class ServiceRecordModule {}
