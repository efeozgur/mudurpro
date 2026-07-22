import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { TenantModule } from '../tenant/tenant.module';
import { SystemSettingModule } from '../system-setting/system-setting.module';
import { CourthouseController } from './courthouse.controller';
import { CourthouseService } from './courthouse.service';

@Module({
  imports: [TypeOrmModule.forFeature([Courthouse]), TenantModule, SystemSettingModule],
  controllers: [CourthouseController],
  providers: [CourthouseService],
  exports: [CourthouseService],
})
export class CourthouseModule {}
