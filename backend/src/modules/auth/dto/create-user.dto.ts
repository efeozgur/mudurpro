import { IsEmail, IsString, MinLength, IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsIn(['SUPER_ADMIN', 'ADLIYE_ADMIN', 'MUDUR'])
  role!: string;

  @IsOptional()
  @IsUUID()
  courthouse_id?: string;
}
