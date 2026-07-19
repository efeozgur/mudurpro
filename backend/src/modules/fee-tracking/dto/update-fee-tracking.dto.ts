import { PartialType } from '@nestjs/mapped-types';
import { CreateFeeTrackingDto } from './create-fee-tracking.dto';

export class UpdateFeeTrackingDto extends PartialType(CreateFeeTrackingDto) {}
