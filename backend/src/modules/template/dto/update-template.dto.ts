import { IsOptional, IsString, MaxLength, MinLength, IsIn } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  @IsIn(['TEXT', 'DECISION', 'MUZEKKERE'])
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRIVATE', 'CITY', 'DISTRICT', 'NATIONAL'])
  visibility?: string;
}
