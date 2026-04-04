import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { RecurringFinance } from '../../entities/recurringFinance.entity';
import { Investment } from '../../entities/Investment.entity';
import { Saving } from '../../entities/Saving.entity';
import { NotificationModule } from '../notification/notification.module';
import { FirebaseModule } from '.././firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecurringFinance, Investment, Saving]),
    NotificationModule,  // provee NotificationsService
    FirebaseModule,      // provee FirebaseService
  ],
  providers: [SchedulerService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}