import { IsString, MaxLength, MinLength, IsIn, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsString()
  @IsIn(['TEXT', 'DECISION', 'MUZEKKERE'])
  category!: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRIVATE', 'CITY', 'DISTRICT', 'NATIONAL'])
  visibility?: string;
}
