import { IsString, IsUUID, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateAppealResponseDto {
  @IsOptional()
  @IsUUID()
  appeal_id?: string;

  @IsUUID()
  opposing_party_id!: string;

  @IsDateString()
  response_date!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  received_date?: string;

  @IsOptional()
  @IsString()
  aciklama?: string;
}
