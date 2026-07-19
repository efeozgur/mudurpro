import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCourthouseDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
