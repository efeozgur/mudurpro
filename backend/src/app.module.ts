import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { CourthouseModule } from './modules/courthouse/courthouse.module';
import { CourtModule } from './modules/court/court.module';
import { CaseFileModule } from './modules/case-file/case-file.module';
import { PartyModule } from './modules/party/party.module';
import { ServiceRecordModule } from './modules/service-record/service-record.module';
import { AppealModule } from './modules/appeal/appeal.module';
import { FeeTrackingModule } from './modules/fee-tracking/fee-tracking.module';
import { SureEngineModule } from './modules/sure-engine/sure-engine.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SystemSettingModule } from './modules/system-setting/system-setting.module';
import { TemplateModule } from './modules/template/template.module';
import { VersionModule } from './modules/version/version.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5433/mudurpro',
      entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}', __dirname + '/common/entities/*.entity{.ts,.js}'],
      synchronize: true, // geliştirme için true, production'da false + migration
    }),
    TenantModule,
    AuthModule,
    CourthouseModule,
    CourtModule,
    CaseFileModule,
    PartyModule,
    ServiceRecordModule,
    AppealModule,
    FeeTrackingModule,
    SureEngineModule,
    NotificationModule,
    AuditLogModule,
    DashboardModule,
    TemplateModule,
    SystemSettingModule,
    VersionModule,
    ReminderModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {}
