import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appeal } from './entities/appeal.entity';
import { AppealResponse } from './entities/appeal-response.entity';
import { Party } from '../party/entities/party.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { AppealController } from './appeal.controller';
import { AppealService } from './appeal.service';
import { AppealResponseService } from './appeal-response.service';
import { AppealResponseController } from './appeal-response.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Appeal, AppealResponse, Party, UserCourt, CaseFile])],
  controllers: [AppealController, AppealResponseController],
  providers: [AppealService, AppealResponseService],
  exports: [AppealService, AppealResponseService],
})
export class AppealModule {}
