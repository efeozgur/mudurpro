import { IsString, IsUUID, IsOptional, MaxLength, IsDateString, IsIn } from 'class-validator';

export class CreateCaseFileDto {
  @IsUUID('all')
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
  @IsIn(['ACTIVE', 'SERVICE_IN_PROGRESS', 'WAITING_LEGAL_PERIOD', 'READY_FOR_FINALIZATION', 'UST_MAHKEMEDE', 'FINALIZED', 'ARCHIVED', 'DRAFT'])
  durum?: string;

  @IsOptional()
  @IsString()
  aciklama?: string;
}
