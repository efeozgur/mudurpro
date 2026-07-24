import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reminder } from './entities/reminder.entity';
import { ReminderHistory } from './entities/reminder-history.entity';
import { User } from '../auth/entities/user.entity';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reminder, ReminderHistory, User])],
  controllers: [ReminderController],
  providers: [ReminderService],
})
export class ReminderModule {}
