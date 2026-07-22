import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from './entities/court.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { SystemSettingModule } from '../system-setting/system-setting.module';
import { CourtController } from './court.controller';
import { CourtService } from './court.service';

@Module({
  imports: [TypeOrmModule.forFeature([Court, UserCourt, Courthouse]), SystemSettingModule],
  controllers: [CourtController],
  providers: [CourtService],
  exports: [CourtService],
})
export class CourtModule {}
