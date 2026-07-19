import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CourthouseModule } from './modules/courthouse/courthouse.module';

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
  ],
  controllers: [AppController],
})
export class AppModule {}
