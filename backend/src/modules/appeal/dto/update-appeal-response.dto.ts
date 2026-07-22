import { PartialType } from '@nestjs/mapped-types';
import { CreateAppealResponseDto } from './create-appeal-response.dto';

export class UpdateAppealResponseDto extends PartialType(CreateAppealResponseDto) {}
