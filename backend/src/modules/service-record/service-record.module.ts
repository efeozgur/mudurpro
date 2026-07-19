import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRecord } from './entities/service-record.entity';
import { ServiceRecordController } from './service-record.controller';
import { ServiceRecordService } from './service-record.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceRecord])],
  controllers: [ServiceRecordController],
  providers: [ServiceRecordService],
  exports: [ServiceRecordService],
})
export class ServiceRecordModule {}
