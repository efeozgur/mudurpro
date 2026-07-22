import { Injectable, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email, active: true } });
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const payload = { sub: user.id, email: user.email, role: user.role, courthouseId: user.courthouse_id };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role, name: user.name, courthouseId: user.courthouse_id },
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password_hash, ...result } = user;
    return result;
  }

  async validateUser(payload: { sub: string }) {
    return this.userRepo.findOne({ where: { id: payload.sub, active: true } });
  }

  async listUsers(courthouseIds?: string[]) {
    const where: any = { deleted_at: IsNull() };
    if (courthouseIds && courthouseIds.length > 0) {
      where.courthouse_id = In(courthouseIds);
    }
    const users = await this.userRepo.find({ where });
    // Get courthouse names
    const chIds = users.map(u => u.courthouse_id).filter(Boolean);
    const chMap: Record<string, string> = {};
    if (chIds.length > 0) {
      const chs = await this.userRepo.manager.query(
        `SELECT id, name, city FROM public.courthouses WHERE id = ANY($1)`,
        [chIds],
      );
      for (const ch of chs) {
        chMap[ch.id] = ch.city ? `${ch.city} - ${ch.name}` : ch.name;
      }
    }
    return users.map(({ password_hash, ...rest }) => ({
      ...rest,
      courthouse_name: rest.courthouse_id ? chMap[rest.courthouse_id] || '' : '',
    }));
  }

  async createUser(dto: CreateUserDto, creatorCourthouseId?: string) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('EMAIL_EXISTS');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const courthouse_id = creatorCourthouseId || dto.courthouse_id || null;

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password_hash,
      role: dto.role,
      courthouse_id,
      active: true,
    });
    await this.userRepo.save(user);
    const { password_hash: _, ...result } = user;
    return result;
  }

  async updateUser(id: string, dto: UpdateUserDto, creatorRole: string, creatorCourthouseId?: string) {
    const user = await this.userRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    if (creatorRole === 'ADLIYE_ADMIN') {
      if (user.courthouse_id !== creatorCourthouseId || user.role !== 'MUDUR') {
        throw new ForbiddenException('You can only update manager users in your own courthouse');
      }
      if (dto.role && dto.role !== 'MUDUR') {
        throw new ForbiddenException('You cannot assign roles other than MUDUR');
      }
      if (dto.courthouse_id && dto.courthouse_id !== creatorCourthouseId) {
        throw new ForbiddenException('You cannot change courthouse assignment');
      }
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email, deleted_at: IsNull() } });
      if (existing && existing.id !== id) throw new ConflictException('EMAIL_EXISTS');
      user.email = dto.email;
    }
    if (dto.password !== undefined && dto.password !== '') {
      user.password_hash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role !== undefined && creatorRole === 'SUPER_ADMIN') {
      user.role = dto.role;
    }
    if (dto.courthouse_id !== undefined && creatorRole === 'SUPER_ADMIN') {
      user.courthouse_id = dto.courthouse_id || null;
    }
    if (dto.active !== undefined) {
      user.active = dto.active;
    }
    user.updated_at = new Date();

    await this.userRepo.save(user);
    const { password_hash: _, ...result } = user;
    return result;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, deleted_at: IsNull() } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new ForbiddenException('Mevcut şifre yanlış.');

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { success: true };
  }

  async deleteUser(id: string, currentUserId: string, role: string, courthouseId?: string) {
    if (id === currentUserId) throw new ForbiddenException('Kendinizi silemezsiniz.');

    const user = await this.userRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    if (role === 'ADLIYE_ADMIN') {
      if (user.role !== 'MUDUR') throw new ForbiddenException('Sadece müdürleri silebilirsiniz.');
      if (!courthouseId || user.courthouse_id !== courthouseId) {
        throw new ForbiddenException('Bu kullanıcıyı silme yetkiniz yok.');
      }
    }

    await this.userRepo.softDelete(id);
    return { success: true };
  }
}
