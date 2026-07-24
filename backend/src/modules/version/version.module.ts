import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppVersion } from './entities/app-version.entity';
import { AppVersionChange } from './entities/app-version-change.entity';
import { VersionController } from './version.controller';
import { VersionService } from './version.service';

@Module({ imports: [TypeOrmModule.forFeature([AppVersion, AppVersionChange])], controllers: [VersionController], providers: [VersionService], exports: [VersionService] })
export class VersionModule {}
