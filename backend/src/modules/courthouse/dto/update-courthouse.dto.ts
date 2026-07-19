import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateCourthouseDto } from './create-courthouse.dto';

export class UpdateCourthouseDto extends PartialType(CreateCourthouseDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
