import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DeviceInfoDto {
  @IsString()
  browser: string;

  @IsString()
  os: string;

  @IsString()
  device: string;

  @IsString()
  ip: string;

  @IsString()
  userAgent: string;
}

export class CreateSessionDto {
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @IsOptional()
  @IsString()
  fingerprint?: string;
}
