import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export enum ScholarshipDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  REQUEST_CHANGES = "REQUEST_CHANGES",
  REMOVE = "REMOVE",
}

export class ScholarshipDecisionDto {
  @IsEnum(ScholarshipDecision)
  decision!: ScholarshipDecision;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checklist?: string[];
}
