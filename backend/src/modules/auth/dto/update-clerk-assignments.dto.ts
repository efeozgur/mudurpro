import { IsArray, IsBoolean, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class UpdateClerkAssignmentsDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  case_file_ids?: string[];

  @IsOptional()
  @IsBoolean()
  all_court_files?: boolean;

  @ValidateIf((dto) => dto.court_id !== undefined && dto.court_id !== '')
  @IsUUID()
  court_id?: string;
}
