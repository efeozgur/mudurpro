import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClerkDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
