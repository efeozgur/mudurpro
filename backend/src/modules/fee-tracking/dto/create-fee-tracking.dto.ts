import { IsString, IsUUID, IsOptional, MaxLength, IsNumber, Min, IsDateString } from 'class-validator';

export class CreateFeeTrackingDto {
  @IsOptional()
  @IsUUID()
  case_file_id?: string;

  @IsUUID()
  debtor_party_id!: string;

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsDateString()
  served_date?: string;

  @IsOptional()
  @IsDateString()
  payment_due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsDateString()
  payment_date?: string;

  @IsOptional()
  @IsString()
  aciklama?: string;
}
