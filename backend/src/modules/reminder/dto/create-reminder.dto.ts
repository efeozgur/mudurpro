import { IsArray, IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReminderDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['GENERAL', 'CASE', 'SERVICE', 'DEADLINE', 'PAYMENT', 'MEETING', 'CALL', 'OTHER']) type?: string;
  @IsOptional() @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']) priority?: string;
  @IsDateString() start_at!: string;
  @IsOptional() @IsDateString() end_at?: string | null;
  @IsOptional() @IsString() @MaxLength(255) recurrence_rule?: string | null;
  @IsOptional() @IsDateString() recurrence_end?: string | null;
  @IsOptional() @IsBoolean() is_all_day?: boolean;
  @IsOptional() @IsDateString() remind_at?: string | null;
  @IsOptional() @IsUUID() case_file_id?: string;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) shared_with_user_ids?: string[];
  @IsOptional() @IsUUID() assigned_to_user_id?: string | null;
}
