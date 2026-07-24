import { Injectable, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ClerkCaseAssignment } from './entities/clerk-case-assignment.entity';
import { CreateClerkDto } from './dto/create-clerk.dto';
import { UpdateClerkDto } from './dto/update-clerk.dto';
import { UpdateClerkAssignmentsDto } from './dto/update-clerk-assignments.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RegisterManagerDto } from './dto/register-manager.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export const CLERK_MODULES = ['CASES', 'PARTIES', 'SERVICES', 'FEES', 'APPEALS', 'TEMPLATES', 'REPORTS'] as const;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ClerkCaseAssignment) private assignmentRepo: Repository<ClerkCaseAssignment>,
    private jwtService: JwtService,
  ) {}

  async registerManager(dto: RegisterManagerDto) {
    if (dto.password !== dto.password_confirmation) throw new ConflictException('PASSWORD_MISMATCH');
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('EMAIL_EXISTS');
    const testCourthouse = await this.userRepo.manager.query(
      `SELECT id FROM public.courthouses WHERE name = 'Test Adliyesi' AND active = true AND deleted_at IS NULL LIMIT 1`,
    );
    if (!testCourthouse.length) throw new NotFoundException('TEST_COURTHOUSE_NOT_CONFIGURED');
    const user = this.userRepo.create({
      name: dto.name.trim(), email, password_hash: await bcrypt.hash(dto.password, 10),
      role: 'MUDUR', courthouse_id: testCourthouse[0].id, active: false,
      registration_status: 'PENDING', rejection_reason: null, approved_at: null, approved_by: null,
    });
    await this.userRepo.save(user);
    const { password_hash, ...result } = user;
    return result;
  }

  async listRegistrationCourthouses() {
    return this.userRepo.manager.query(
      'SELECT id, name, city, district FROM public.courthouses WHERE active = true AND deleted_at IS NULL ORDER BY city, district, name',
    );
  }

  async listApplications() {
    return this.userRepo.find({ where: { role: 'MUDUR', registration_status: In(['PENDING', 'REJECTED', 'APPROVED']), deleted_at: IsNull() }, order: { created_at: 'DESC' } });
  }

  async approveApplication(id: string, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id, registration_status: 'PENDING', deleted_at: IsNull() } });
    if (!user) throw new NotFoundException('APPLICATION_NOT_FOUND');
    user.registration_status = 'APPROVED'; user.active = true; user.approved_at = new Date(); user.approved_by = adminId; user.rejection_reason = null;
    return this.userRepo.save(user);
  }

  async rejectApplication(id: string, reason: string) {
    const user = await this.userRepo.findOne({ where: { id, registration_status: 'PENDING', deleted_at: IsNull() } });
    if (!user) throw new NotFoundException('APPLICATION_NOT_FOUND');
    user.registration_status = 'REJECTED'; user.active = false; user.rejection_reason = reason.trim();
    return this.userRepo.save(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const candidate = await this.userRepo.findOne({ where: { email } });
    if (candidate && candidate.registration_status === 'PENDING') throw new UnauthorizedException('REGISTRATION_PENDING');
    if (candidate && candidate.registration_status === 'REJECTED') throw new UnauthorizedException(`REGISTRATION_REJECTED:${candidate.rejection_reason || ''}`);
    if (!candidate || !candidate.active) throw new UnauthorizedException('INVALID_CREDENTIALS');
    const valid = await bcrypt.compare(dto.password, candidate.password_hash);
    if (!valid) throw new UnauthorizedException('INVALID_CREDENTIALS');
    const payload = { sub: candidate.id, email: candidate.email, role: candidate.role, courthouseId: candidate.courthouse_id };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: candidate.id, email: candidate.email, role: candidate.role, name: candidate.name, courthouseId: candidate.courthouse_id, permissions: candidate.permissions || [] },
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
  async assertClerkCaseAccess(userId: string, caseFileId: string, permission: string) {
    const clerk = await this.userRepo.findOne({ where: { id: userId, role: 'KATIP', active: true, deleted_at: IsNull() } });
    if (!clerk || !clerk.permissions?.includes(permission)) {
      throw new ForbiddenException('Bu modüle veya dosyaya erişim yetkiniz yok.');
    }
    const assignment = await this.assignmentRepo.findOne({ where: { clerk_id: userId, case_file_id: caseFileId } });
    if (!assignment) throw new ForbiddenException('Bu dosya size atanmadı.');
  }

  async listClerks(managerId: string, courthouseId?: string) {
    if (!courthouseId) throw new ForbiddenException('Müdürün adliye bağlantısı bulunamadı.');
    const clerks = await this.userRepo.find({
      where: { role: 'KATIP', created_by: managerId, courthouse_id: courthouseId, deleted_at: IsNull() },
      order: { name: 'ASC' },
    });
    return clerks.map(({ password_hash, ...clerk }) => clerk);
  }

  async createClerk(dto: CreateClerkDto, managerId: string, courthouseId?: string) {
    if (!courthouseId) throw new ForbiddenException('Müdürün adliye bağlantısı bulunamadı.');
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('EMAIL_EXISTS');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const permissions = this.normalizeClerkPermissions(dto.permissions);
    const clerk = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password_hash,
      role: 'KATIP',
      courthouse_id: courthouseId,
      permissions,
      active: true,
      created_by: managerId,
    });
    await this.userRepo.save(clerk);
    const { password_hash: _, ...result } = clerk;
    return result;
  }

  async updateClerk(id: string, dto: UpdateClerkDto, managerId: string, courthouseId?: string) {
    const clerk = await this.findManagedClerk(id, managerId, courthouseId);
    if (dto.name !== undefined) clerk.name = dto.name;
    if (dto.email !== undefined) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email, deleted_at: IsNull() } });
      if (existing && existing.id !== id) throw new ConflictException('EMAIL_EXISTS');
      clerk.email = dto.email;
    }
    if (dto.password) clerk.password_hash = await bcrypt.hash(dto.password, 10);
    if (dto.permissions !== undefined) clerk.permissions = this.normalizeClerkPermissions(dto.permissions);
    if (dto.active !== undefined) clerk.active = dto.active;
    clerk.updated_at = new Date();
    await this.userRepo.save(clerk);
    const { password_hash: _, ...result } = clerk;
    return result;
  }

  async deleteClerk(id: string, managerId: string, courthouseId?: string) {
    await this.findManagedClerk(id, managerId, courthouseId);
    await this.userRepo.softDelete(id);
    await this.assignmentRepo.delete({ clerk_id: id });
    return { success: true };
  }

  async getClerkAssignments(id: string, managerId: string, courthouseId?: string) {
    await this.findManagedClerk(id, managerId, courthouseId);
    return this.assignmentRepo.find({ where: { clerk_id: id }, order: { created_at: 'DESC' } });
  }

  async updateClerkAssignments(
    id: string,
    dto: UpdateClerkAssignmentsDto,
    managerId: string,
    courthouseId?: string,
  ) {
    await this.findManagedClerk(id, managerId, courthouseId);
    const allowedCourtIds = await this.getManagerCourtIds(managerId, courthouseId);
    let caseIds = dto.case_file_ids || [];
    let caseRows: Array<{ id: string; court_id: string }> = [];
    let assignmentCourtId = dto.court_id;

    if (dto.all_court_files) {
      if (!assignmentCourtId && allowedCourtIds.length === 1) {
        assignmentCourtId = allowedCourtIds[0];
      }
      if (!assignmentCourtId || !allowedCourtIds.includes(assignmentCourtId)) {
        throw new ForbiddenException('Yalnızca müdürün bağlı olduğu mahkeme seçilebilir.');
      }
      caseRows = await this.userRepo.manager.query(
        `SELECT id, court_id FROM case_files WHERE court_id = $1 AND deleted_at IS NULL`,
        [assignmentCourtId],
      );
      caseIds = caseRows.map((row) => row.id);
    }

    if (caseIds.length > 0 && caseRows.length === 0) {
      caseRows = await this.userRepo.manager.query(
        `SELECT id, court_id FROM case_files WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
        [caseIds],
      );
    }

    if (caseIds.length > 0) {
      if (caseRows.length !== caseIds.length || caseRows.some((row) => !allowedCourtIds.includes(row.court_id))) {
        throw new ForbiddenException('Yalnızca müdürün bağlı olduğu mahkemelerin dosyaları atanabilir.');
      }
    }

    await this.assignmentRepo.delete({ clerk_id: id });
    if (caseIds.length === 0) return [];

    const courtByCaseId = new Map(caseRows.map((row) => [row.id, row.court_id]));
    const assignments = caseIds.map((case_file_id) => this.assignmentRepo.create({
      clerk_id: id,
      case_file_id,
      court_id: courtByCaseId.get(case_file_id)!,
      assigned_by: managerId,
      created_by: managerId,
    }));
    return this.assignmentRepo.save(assignments);
  }

  private async findManagedClerk(id: string, managerId: string, courthouseId?: string) {
    const clerk = await this.userRepo.findOne({
      where: { id, role: 'KATIP', created_by: managerId, courthouse_id: courthouseId, deleted_at: IsNull() },
    });
    if (!clerk) throw new NotFoundException('Katip bulunamadı veya bu katibi yönetme yetkiniz yok.');
    return clerk;
  }

  private normalizeClerkPermissions(permissions?: string[]) {
    return (permissions || []).filter((permission): permission is typeof CLERK_MODULES[number] =>
      (CLERK_MODULES as readonly string[]).includes(permission),
    );
  }
  private async getManagerCourtIds(managerId: string, courthouseId?: string): Promise<string[]> {
    const rows = await this.userRepo.manager.query(
      `SELECT court_id FROM user_courts WHERE user_id = $1 AND deleted_at IS NULL`,
      [managerId],
    );
    if (rows.length > 0) return rows.map((row: { court_id: string }) => row.court_id);
    if (!courthouseId) return [];

    const [courthouse] = await this.userRepo.manager.query(
      `SELECT schema_name FROM public.courthouses WHERE id = $1`,
      [courthouseId],
    );
    if (!courthouse?.schema_name || !/^[a-zA-Z0-9_]+$/.test(courthouse.schema_name)) return [];
    const courtRows = await this.userRepo.manager.query(
      `SELECT id FROM "${courthouse.schema_name}"."courts"`,
    );
    return courtRows.map((row: { id: string }) => row.id);
  }

}
