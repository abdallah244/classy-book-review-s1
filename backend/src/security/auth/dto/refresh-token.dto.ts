import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Token is required' })
  @IsNotEmpty({ message: 'Token is required' })
  refreshToken: string;
}
