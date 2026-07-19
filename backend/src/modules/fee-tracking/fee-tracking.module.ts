import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeTracking } from './entities/fee-tracking.entity';
import { Party } from '../party/entities/party.entity';
import { FeeTrackingController } from './fee-tracking.controller';
import { FeeTrackingService } from './fee-tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeTracking, Party])],
  controllers: [FeeTrackingController],
  providers: [FeeTrackingService],
  exports: [FeeTrackingService],
})
export class FeeTrackingModule {}
