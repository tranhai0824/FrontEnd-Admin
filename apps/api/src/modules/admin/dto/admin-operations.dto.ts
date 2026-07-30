import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from "class-validator";
import {
  ApplicationStatus,
  ConsultPriority,
  ConsultStatus,
  ContentStatus,
  ReportStatus,
  ReportFrequency,
  TaxonomyType,
  UserRole,
  UserStatus,
} from "@scholarship/database";
import { SYSTEM_SETTING_GROUPS } from "@scholarship/shared";

export class PageQueryDto {
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
  @IsString()
  @MaxLength(120)
  query?: string;
}

export class ApplicationAdminQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsUUID()
  scholarshipId?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  gpaFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @Max(10)
  gpaTo?: number;
}

export class ApplicationDecisionDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}

export class UserActionDto {
  @IsIn(["SUSPEND", "ACTIVATE", "CHANGE_ROLE", "FORCE_LOGOUT", "RESEND_VERIFICATION", "SEND_PASSWORD_RESET", "SOFT_DELETE"])
  action!: "SUSPEND" | "ACTIVATE" | "CHANGE_ROLE" | "FORCE_LOGOUT" | "RESEND_VERIFICATION" | "SEND_PASSWORD_RESET" | "SOFT_DELETE";

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class ConsultQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(ConsultStatus)
  status?: ConsultStatus;

  @IsOptional()
  @IsEnum(ConsultPriority)
  priority?: ConsultPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class ConsultMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsBoolean()
  internal = false;
}

export class ConsultUpdateDto {
  @IsOptional()
  @IsEnum(ConsultStatus)
  status?: ConsultStatus;

  @IsOptional()
  @IsEnum(ConsultPriority)
  priority?: ConsultPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class PostUpsertDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[] = [];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status: ContentStatus = ContentStatus.DRAFT;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;
}

export class BannerUpsertDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(1)
  desktopUrl!: string;

  @IsOptional()
  @IsString()
  mobileUrl?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @Type(() => Number)
  @IsInt()
  sortOrder = 0;

  @IsBoolean()
  active = true;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class StaticPageUpsertDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(180)
  title!: string;

  @IsString()
  content!: string;

  @IsEnum(ContentStatus)
  status: ContentStatus = ContentStatus.DRAFT;
}

export class TaxonomyUpsertDto {
  @IsEnum(TaxonomyType)
  type!: TaxonomyType;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  slug?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder = 0;
}

export class TaxonomyMergeDto {
  @IsUUID()
  sourceId!: string;

  @IsUUID()
  targetId!: string;
}

export class SettingsDto {
  @IsObject()
  values!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clearSecrets?: string[];
}

export class SettingsQueryDto {
  @IsOptional()
  @IsIn(SYSTEM_SETTING_GROUPS.map((group) => group.id))
  group?: (typeof SYSTEM_SETTING_GROUPS)[number]["id"];
}

export class NotificationQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  unread?: boolean;
}

export class IdsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  ids!: string[];
}

export class JobIdsDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

export class TrashActionDto {
  @IsIn(["User", "Organization", "Scholarship", "Application", "ConsultRequest", "Post", "Banner"])
  entityType!: "User" | "Organization" | "Scholarship" | "Application" | "ConsultRequest" | "Post" | "Banner";

  @IsUUID()
  id!: string;
}

export class ReportUpdateDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  resolution!: string;
}

export class EmailTestDto {
  @IsEmail()
  recipient!: string;
}

export class EmailTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsBoolean()
  active = true;
}

export class AdminNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export class GenericStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class PasswordChangeDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
  newPassword!: string;
}

export class TotpVerifyDto {
  @IsString()
  @Matches(/^\d{6}$/)
  token!: string;
}

export class TeamInviteDto {
  @IsEmail()
  email!: string;

  @IsIn(["SUPPORT", "MODERATOR", "ADMIN"])
  role!: "SUPPORT" | "MODERATOR" | "ADMIN";
}

export class TeamRoleDto {
  @IsIn(["SUPPORT", "MODERATOR", "ADMIN", "SUPER_ADMIN"])
  role!: "SUPPORT" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
}

export class NotificationPreferencesDto {
  @IsObject()
  emailByType!: Record<string, boolean>;
}

export class ReportScheduleDto {
  @IsEmail()
  recipient!: string;

  @IsEnum(ReportFrequency)
  frequency!: ReportFrequency;

  @IsOptional()
  @IsBoolean()
  active = true;
}
