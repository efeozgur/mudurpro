import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ShareReminderDto {
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) shared_with_user_ids?: string[];
  @IsOptional() @IsUUID() assigned_to_user_id?: string | null;
}
