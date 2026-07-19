import { IsString, IsUUID, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateCaseFileDto {
  @IsUUID()
  court_id!: string;

  @IsString()
  @MaxLength(100)
  esas_no!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  karar_no?: string;

  @IsOptional()
  @IsDateString()
  karar_tarihi?: string;

  @IsOptional()
  @IsString()
  karar_sonucu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kanun_yolu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  durum?: string;

  @IsOptional()
  @IsString()
  aciklama?: string;
}
