import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FeeTrackingService } from './fee-tracking.service';
import { CreateFeeTrackingDto } from './dto/create-fee-tracking.dto';
import { UpdateFeeTrackingDto } from './dto/update-fee-tracking.dto';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MUDUR')
export class FeeTrackingController {
  constructor(private service: FeeTrackingService) {}

  @Get('cases/:caseFileId/fees')
  async findByCaseFile(@Param('caseFileId') caseFileId: string) {
    return { success: true, data: await this.service.findByCaseFile(caseFileId), message: null };
  }

  @Post('cases/:caseFileId/fees')
  async create(@Param('caseFileId') caseFileId: string, @Body() dto: CreateFeeTrackingDto) {
    return { success: true, data: await this.service.create({ ...dto, case_file_id: caseFileId }), message: null };
  }

  @Put('fees/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateFeeTrackingDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }

  @Patch('fees/:id/payment')
  async recordPayment(@Param('id') id: string, @Body('payment_date') paymentDate: string) {
    return { success: true, data: await this.service.recordPayment(id, paymentDate), message: null };
  }
}
