import { ScholarshipStatus } from "@scholarship/database";
import { Type } from "class-transformer";
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ScholarshipAdminQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;

  @IsOptional()
  @IsEnum(ScholarshipStatus)
  status?: ScholarshipStatus = ScholarshipStatus.PENDING_REVIEW;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsIn(["submittedAt", "deadline", "createdAt", "viewCount", "title"])
  sortBy: "submittedAt" | "deadline" | "createdAt" | "viewCount" | "title" = "submittedAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDirection: "asc" | "desc" = "asc";
}
