import { IsString, IsUUID, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreateCourtDto {
  @IsUUID()
  courthouse_id!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
