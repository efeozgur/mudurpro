import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
      entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
      synchronize: false,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
