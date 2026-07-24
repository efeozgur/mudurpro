import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterManagerDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
  @IsString() @MinLength(6) password_confirmation!: string;
}
