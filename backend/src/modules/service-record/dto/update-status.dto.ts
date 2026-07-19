import { IsString, MaxLength } from 'class-validator';

export class UpdateServiceStatusDto {
  @IsString()
  @MaxLength(50)
  status!: string;
}
