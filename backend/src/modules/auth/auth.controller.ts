import { Controller, Post, Get, Put, Patch, Delete, Body, UseGuards, Param, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { SystemSettingService } from '../system-setting/services/system-setting.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
    private settings: SystemSettingService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return { success: true, data: result, message: null };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: { id: string; email: string; role: string }) {
    const result = await this.authService.getMe(user.id);
    return { success: true, data: result, message: null };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  @Get('users')
  async listUsers(@CurrentUser() user: { id: string; email: string; role: string; courthouseId?: string }) {
    let courthouseIds: string[] | undefined;

    if (user.role === 'ADLIYE_ADMIN' && user.courthouseId) {
      const scope = await this.settings.get('admin_scope');
      if (scope === 'city_and_districts') {
        // Find all courthouses in the same city
        const adminCh = await this.courthouseRepo.findOne({ where: { id: user.courthouseId, deleted_at: IsNull() } });
        if (adminCh?.city) {
          const allInCity = await this.courthouseRepo.find({ where: { city: adminCh.city, deleted_at: IsNull() } });
          courthouseIds = allInCity.map(c => c.id);
        } else {
          courthouseIds = [user.courthouseId];
        }
      } else {
        courthouseIds = [user.courthouseId];
      }
    }

    const result = await this.authService.listUsers(courthouseIds);
    return { success: true, data: result, message: null };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return {
      success: true,
      data: await this.authService.changePassword(user.id, dto.current_password, dto.new_password),
      message: null,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  @Post('users')
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { id: string; email: string; role: string; courthouseId?: string }
  ) {
    const creatorCourthouseId = user.role === 'ADLIYE_ADMIN' ? user.courthouseId : undefined;
    const result = await this.authService.createUser(dto, creatorCourthouseId);
    return { success: true, data: result, message: null };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { id: string; email: string; role: string; courthouseId?: string }
  ) {
    const result = await this.authService.updateUser(id, dto, user.role, user.courthouseId);
    return { success: true, data: result, message: null };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')
  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: string; courthouseId?: string }
  ) {
    const result = await this.authService.deleteUser(id, user.id, user.role, user.courthouseId);
    return { success: true, data: result, message: null };
  }
}
