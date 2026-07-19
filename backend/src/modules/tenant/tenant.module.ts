import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantService } from './tenant.service';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Courthouse } from './entities/courthouse.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Courthouse])],
  providers: [
    TenantService,
    TenantInterceptor,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
  exports: [TenantService],
})
export class TenantModule {}
