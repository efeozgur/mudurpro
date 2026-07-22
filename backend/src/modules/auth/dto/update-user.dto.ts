import { IsEmail, IsString, MinLength, IsIn, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn(['SUPER_ADMIN', 'ADLIYE_ADMIN', 'MUDUR'])
  role?: string;

  @IsOptional()
  @IsUUID()
  courthouse_id?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
