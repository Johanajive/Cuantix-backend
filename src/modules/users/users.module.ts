import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../entities/user.entity';
import { EmailModule } from '../email/email.module';


@Module({
  imports: [TypeOrmModule.forFeature([Users]),
  EmailModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
