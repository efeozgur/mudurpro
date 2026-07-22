import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseFile } from './entities/case-file.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { ClerkCaseAssignment } from '../auth/entities/clerk-case-assignment.entity';
import { CaseFileController } from './case-file.controller';
import { CaseFileService } from './case-file.service';
import { SureEngineModule } from '../sure-engine/sure-engine.module';

@Module({
  imports: [TypeOrmModule.forFeature([CaseFile, Appeal, UserCourt, ClerkCaseAssignment]), SureEngineModule],
  controllers: [CaseFileController],
  providers: [CaseFileService],
  exports: [CaseFileService],
})
export class CaseFileModule {}
