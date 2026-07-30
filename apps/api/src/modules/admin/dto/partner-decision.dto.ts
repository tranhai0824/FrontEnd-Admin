import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export enum PartnerDecision {
  VERIFY = "VERIFY",
  REJECT = "REJECT",
  REQUEST_MORE_INFO = "REQUEST_MORE_INFO",
  SUSPEND = "SUSPEND",
}

export class PartnerDecisionDto {
  @IsEnum(PartnerDecision)
  decision!: PartnerDecision;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason?: string;
}
