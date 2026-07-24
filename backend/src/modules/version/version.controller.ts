import { Controller, Get } from '@nestjs/common';
import { VersionService } from './version.service';

@Controller('version-history')
export class VersionController {
  constructor(private readonly service: VersionService) {}
  @Get()
  async findAll() { return { success: true, data: await this.service.findAll(), message: null }; }
}
