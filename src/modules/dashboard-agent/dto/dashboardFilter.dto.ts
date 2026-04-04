import { IsEnum, IsUUID } from "class-validator";

export enum FilterType {
  DAY = "day",
  MONTH = "month",
  YEAR = "year"
}

export class DashboardFilterDto {

  @IsUUID()
  userUuid: string;

  @IsEnum(FilterType)
  filter: FilterType;
}