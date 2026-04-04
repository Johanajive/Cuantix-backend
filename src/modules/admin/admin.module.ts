import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Users } from '../../entities/user.entity';  
import { Agent } from '../../entities/agent.entity'; 
import { EmailModule } from '../email/email.module'; 
import { Session } from '../../entities/session.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Agent, Session]), 
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}