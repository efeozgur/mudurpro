import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateCourthouseDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsUUID()
  connected_to?: string;
}
