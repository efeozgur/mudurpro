import { IsUUID, IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  user_id!: string;

  @IsUUID()
  @IsOptional()
  case_file_id?: string;

  @IsString()
  @MaxLength(50)
  type!: string;

  @IsString()
  @IsIn(['P1', 'P2', 'P3', 'P4'])
  priority!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
