import { PartialType } from '@nestjs/mapped-types';
import { CreateCaseFileDto } from './create-case-file.dto';

export class UpdateCaseFileDto extends PartialType(CreateCaseFileDto) {}
