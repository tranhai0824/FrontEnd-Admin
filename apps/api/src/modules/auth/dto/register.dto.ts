import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from "class-validator";

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}

export function normalizeEmail(value: unknown): string | undefined {
  return normalizeOptionalString(value)?.toLowerCase();
}

@ValidatorConstraint({ name: "passwordConfirmation", async: false })
export class PasswordConfirmationConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as RegisterDto;
    return typeof value === "string" && value === object.password;
  }

  defaultMessage(): string {
    return "confirmPassword must match password.";
  }
}

export class RegisterDto {
  @Transform(({ value }) => normalizeEmail(value))
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      "password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol.",
  })
  password!: string;

  @IsString()
  @MaxLength(128)
  @Validate(PasswordConfirmationConstraint)
  confirmPassword!: string;
}
