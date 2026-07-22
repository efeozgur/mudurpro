import { IsString, IsUUID, IsOptional, MaxLength, IsBoolean, IsEmail, ValidateIf } from 'class-validator';

export class CreatePartyDto {
  @IsOptional()
  @IsUUID()
  case_file_id?: string;

  @IsString()
  @MaxLength(20)
  party_type!: string;

  @IsString()
  @MaxLength(20)
  role!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  national_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tax_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
