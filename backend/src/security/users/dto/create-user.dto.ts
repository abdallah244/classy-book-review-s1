import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+20|0)?1[0125][0-9]{8}$/)
  phone?: string;

  @IsOptional()
  @IsEnum(['student', 'teacher', 'admin', 'super_admin'])
  role?: string;

  @IsOptional()
  @IsString({ each: true })
  permissions?: string[];
}
