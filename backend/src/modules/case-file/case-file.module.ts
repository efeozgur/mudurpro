import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseFile } from './entities/case-file.entity';
import { CaseFileController } from './case-file.controller';
import { CaseFileService } from './case-file.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaseFile])],
  controllers: [CaseFileController],
  providers: [CaseFileService],
  exports: [CaseFileService],
})
export class CaseFileModule {}
