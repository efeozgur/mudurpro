import { IsString, IsUUID, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateAppealDto {
  @IsUUID()
  case_file_id!: string;

  @IsUUID()
  applicant_party_id!: string;

  @IsString()
  @MaxLength(20)
  type!: string;

  @IsDateString()
  application_date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  aciklama?: string;
}
