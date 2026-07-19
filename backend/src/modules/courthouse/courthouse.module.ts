import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { CourthouseController } from './courthouse.controller';
import { CourthouseService } from './courthouse.service';

@Module({
  imports: [TypeOrmModule.forFeature([Courthouse])],
  controllers: [CourthouseController],
  providers: [CourthouseService],
  exports: [CourthouseService],
})
export class CourthouseModule {}
