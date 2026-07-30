import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class ScholarshipAdminUpdateDto {
  @IsOptional() @IsString() @MinLength(5) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(1000) summary?: string;
  @IsOptional() @IsString() @MinLength(20) description?: string;
  @IsOptional() @IsString() amount?: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsUUID() reviewerId?: string | null;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsString() @MinLength(3) @MaxLength(1000) reason!: string;
}
