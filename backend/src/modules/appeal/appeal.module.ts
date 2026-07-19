import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appeal } from './entities/appeal.entity';
import { Party } from '../party/entities/party.entity';
import { AppealController } from './appeal.controller';
import { AppealService } from './appeal.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appeal, Party])],
  controllers: [AppealController],
  providers: [AppealService],
  exports: [AppealService],
})
export class AppealModule {}
