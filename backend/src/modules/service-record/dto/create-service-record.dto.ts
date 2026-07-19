import { IsString, IsUUID, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateServiceRecordDto {
  @IsUUID()
  case_file_id!: string;

  @IsUUID()
  party_id!: string;

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsOptional()
  @IsDateString()
  sent_date?: string;

  @IsOptional()
  @IsDateString()
  served_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  aciklama?: string;
}
