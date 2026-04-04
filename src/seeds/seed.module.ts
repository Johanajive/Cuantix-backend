import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "../entities/user.entity";
import { AdminSeed } from "./admin.seed";

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  providers: [AdminSeed],
})
export class SeedModule {}