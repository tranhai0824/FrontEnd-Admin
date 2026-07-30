import { Transform } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UserListQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @IsIn(["CANDIDATE", "PARTNER", "SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"])
  role?: "CANDIDATE" | "PARTNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "SUPPORT";

  @IsOptional()
  @IsIn(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DISABLED"])
  status?: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DISABLED";

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(["email", "role", "status", "createdAt", "lastLoginAt"])
  sortBy: "email" | "role" | "status" | "createdAt" | "lastLoginAt" = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDirection: "asc" | "desc" = "desc";
}
