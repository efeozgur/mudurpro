import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreateReminderDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['GENERAL','CASE','SERVICE','DEADLINE','PAYMENT','MEETING','CALL','OTHER']) type?: string;
  @IsOptional() @IsIn(['LOW','NORMAL','HIGH','URGENT']) priority?: string;
  @IsDateString() start_at!: string;
  @IsOptional() @IsDateString() end_at?: string;
  @IsOptional() @IsBoolean() is_all_day?: boolean;
  @IsOptional() @IsDateString() remind_at?: string;
  @IsOptional() @IsUUID() case_file_id?: string;
}
