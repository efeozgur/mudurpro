import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from './entities/court.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CourtController } from './court.controller';
import { CourtService } from './court.service';

@Module({
  imports: [TypeOrmModule.forFeature([Court, UserCourt])],
  controllers: [CourtController],
  providers: [CourtService],
  exports: [CourtService],
})
export class CourtModule {}
