import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FinanceModule } from './modules/finance/finance.module';
import { EmailModule } from './modules/email/email.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RecurringFinanceModule } from './modules/recurring-finance/recurring-finance.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';
import { SeedModule } from './seeds/seed.module';
import { AgentModule } from './modules/agent/agent.module';
import { AdvisoryRequest } from './entities/advisoryRequest.entity'; 
import { InventmentModule } from './modules/inventment/inventment.module';
import { SavingModule } from './modules/saving/saving.module';
import { DashboardAgentModule } from './modules/dashboard-agent/dashboard-agent.module'; 
import { DashboardAdminModule } from './modules/dashboard-admin/dashboard-admin.module'; 
import { DashboardUserModule } from './modules/dashboard-user/dashboard-user.module';
import { DasboardVsModule } from './modules/dasboard-vs/dasboard-vs.module';
import { DasboardSavingModule } from './modules/dasboard-saving/dasboard-saving.module';
import { DashboardInvestmentModule } from './modules/dashboard-investment/dashboard-investment.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { DashboardDisiplineModule } from './modules/dashboard-disipline/dashboard-disipline.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),   // ← habilita los crons
    SchedulerModule,
    FirebaseModule,
    NotificationModule,


    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST')!,
        port: Number(config.get<number>('DB_PORT'))!,
        username: config.get<string>('DB_USER')!,
        password: config.get<string>('DB_PASSWORD')!,
        database: config.get<string>('DB_NAME')!,
        autoLoadEntities: true,
        synchronize: false,
        dropSchema: false,
      }),
    }),

    UsersModule,
    AuthModule,
    FinanceModule,
    EmailModule,
    PaymentModule,
    RecurringFinanceModule,
    DashboardModule,
    SubscriptionModule,
    NotificationModule,
    AdminModule,
    SeedModule,
    AgentModule,
    AdvisoryRequest,
    InventmentModule,
    SavingModule,
    DashboardAgentModule,
    DashboardAdminModule,
    DashboardUserModule,
    DasboardVsModule,
    DasboardSavingModule,
    DashboardInvestmentModule,
    DashboardDisiplineModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }