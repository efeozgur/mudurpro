import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CourthouseModule } from './modules/courthouse/courthouse.module';
import { CourtModule } from './modules/court/court.module';
import { CaseFileModule } from './modules/case-file/case-file.module';
import { PartyModule } from './modules/party/party.module';
import { ServiceRecordModule } from './modules/service-record/service-record.module';
import { AppealModule } from './modules/appeal/appeal.module';
import { FeeTrackingModule } from './modules/fee-tracking/fee-tracking.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
      entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    AuthModule,
    CourthouseModule,
    CourtModule,
    CaseFileModule,
    PartyModule,
    ServiceRecordModule,
    AppealModule,
    FeeTrackingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
