import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Court } from './entities/court.entity';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtService {
  constructor(
    @InjectRepository(Court) private courtRepo: Repository<Court>,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
  ) {}

  async findAll(user?: { id: string; role: string; courthouseId?: string }, permittedCourthouseIds?: string[] | null) {
    let courts: Court[] = [];

    if (user && user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN: query courts from all tenant schemas via courthouse list
      const courthouses = await this.courthouseRepo.find({ where: { active: true, deleted_at: IsNull() } });
      for (const ch of courthouses) {
        try {
          const rows = await this.courtRepo.manager.query(
            `SELECT * FROM "${ch.schema_name}"."courts" WHERE "deleted_at" IS NULL`
          );
          // Map raw snake_case rows to Court entities
          for (const row of rows) {
            row.courthouse_id = ch.id;
          }
          courts.push(...rows);
        } catch { /* skip schemas where courts table doesn't exist */ }
      }
    } else if (user && user.role === 'ADLIYE_ADMIN') {
      const ids = permittedCourthouseIds && permittedCourthouseIds.length > 0
        ? permittedCourthouseIds
        : (user.courthouseId ? [user.courthouseId] : []);
      if (ids.length === 0) return [];
      courts = await this.courtRepo.find({
        where: { courthouse_id: In(ids), deleted_at: IsNull() },
      });
    } else if (user && user.role === 'MUDUR') {
      const assignments = await this.userCourtRepo.find({
        where: { user_id: user.id, deleted_at: IsNull() },
      });
      const courtIds = assignments.map((a) => a.court_id);
      if (courtIds.length === 0) return [];
      courts = await this.courtRepo.find({ where: { id: In(courtIds), deleted_at: IsNull() } });
    } else {
      courts = await this.courtRepo.find({ where: { deleted_at: IsNull() } });
    }

    if (courts.length === 0) return [];

    const courtIds = courts.map((c) => c.id);
    let assignments: { court_id: string; user_id: string }[] = [];
    const counts: Record<string, number> = {};

    if (user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN: query user_courts and case_files across all schemas
      const courthouses = await this.courthouseRepo.find({ where: { active: true, deleted_at: IsNull() } });
      for (const ch of courthouses) {
        // User courts
        try {
          const rows = await this.courtRepo.manager.query(
            `SELECT court_id, user_id FROM "${ch.schema_name}"."user_courts" WHERE "deleted_at" IS NULL AND court_id = ANY($1)`,
            [courtIds]
          );
          assignments.push(...rows);
        } catch { /* skip */ }
        // Case file counts
        try {
          const rows = await this.courtRepo.manager.query(
            `SELECT court_id, COUNT(*)::int as cnt FROM "${ch.schema_name}"."case_files" WHERE "deleted_at" IS NULL AND court_id = ANY($1) GROUP BY court_id`,
            [courtIds]
          );
          for (const r of rows) {
            counts[r.court_id] = (counts[r.court_id] || 0) + r.cnt;
          }
        } catch { /* skip */ }
      }
    } else {
      assignments = await this.userCourtRepo.find({
        where: { court_id: In(courtIds), deleted_at: IsNull() }
      });
      try {
        const rows = await this.courtRepo.manager.query(
          `SELECT court_id, COUNT(*)::int as cnt FROM case_files WHERE court_id = ANY($1) AND deleted_at IS NULL GROUP BY court_id`,
          [courtIds]
        );
        for (const r of rows) {
          counts[r.court_id] = r.cnt;
        }
      } catch { /* case_files table may not exist in all schemas */ }
    }

    const userIds = assignments.map((a) => a.user_id);
    const usersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const users = await this.courtRepo.manager.query(
        `SELECT id, name FROM public.users WHERE id = ANY($1)`,
        [userIds]
      );
      for (const u of users) {
        usersMap[u.id] = u.name;
      }
    }

    // Fetch courthouse info (name, city, district)
    const courthouseIds = [...new Set(courts.map((c) => c.courthouse_id))];
    const courthousesMap: Record<string, { name: string; city: string; district: string }> = {};
    if (courthouseIds.length > 0) {
      const rows = await this.courtRepo.manager.query(
        `SELECT id, name, city, district FROM public.courthouses WHERE id = ANY($1)`,
        [courthouseIds]
      );
      for (const r of rows) {
        courthousesMap[r.id] = { name: r.name, city: r.city, district: r.district };
      }
    }

    return courts.map((court) => {
      const assignment = assignments.find((a) => a.court_id === court.id);
      const ch = courthousesMap[court.courthouse_id];
      return {
        ...court,
        courthouse_name: ch?.name || null,
        courthouse_city: ch?.city || null,
        courthouse_district: ch?.district || null,
        case_file_count: counts[court.id] || 0,
        assigned_mudur_id: assignment ? assignment.user_id : null,
        assigned_mudur_name: assignment ? (usersMap[assignment.user_id] || 'Bilinmeyen Müdür') : null,
      };
    });
  }

  async findById(id: string, user?: { role: string }) {
    let court: Court | null = null;
    if (user?.role === 'SUPER_ADMIN') {
      const courthouses = await this.courthouseRepo.find({ where: { active: true, deleted_at: IsNull() } });
      for (const ch of courthouses) {
        try {
          const rows: Court[] = await this.courtRepo.manager.query(
            `SELECT * FROM "${ch.schema_name}"."courts" WHERE "id" = $1 AND "deleted_at" IS NULL LIMIT 1`,
            [id]
          );
          if (rows.length > 0) { court = rows[0]; court.courthouse_id = ch.id; break; }
        } catch { /* skip */ }
      }
    } else {
      court = await this.courtRepo.findOne({ where: { id, deleted_at: IsNull() } });
    }
    if (!court) throw new NotFoundException('Court not found');
    return court;
  }

  async create(dto: CreateCourtDto, user?: { role: string }) {
    if (user?.role === 'SUPER_ADMIN') {
      const chRows = await this.courtRepo.manager.query(
        `SELECT id, schema_name FROM public.courthouses WHERE id = $1 AND deleted_at IS NULL`,
        [dto.courthouse_id]
      );
      if (chRows.length > 0) {
        const result = await this.courtRepo.manager.query(
          `INSERT INTO "${chRows[0].schema_name}"."courts" (name, type, courthouse_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
          [dto.name, dto.type, dto.courthouse_id]
        );
        return result[0];
      }
    }
    const court = this.courtRepo.create(dto);
    return this.courtRepo.save(court);
  }

  async update(id: string, dto: UpdateCourtDto, user?: { role: string }) {
    const court = await this.findById(id, user);
    if (user?.role === 'SUPER_ADMIN') {
      const chRows = await this.courtRepo.manager.query(
        `SELECT schema_name FROM public.courthouses WHERE id = $1 AND deleted_at IS NULL`,
        [court.courthouse_id]
      );
      if (chRows.length > 0) {
        const setClauses: string[] = [];
        const params: any[] = [];
        let idx = 1;
        if (dto.name !== undefined) { setClauses.push(`"name" = $${idx++}`); params.push(dto.name); }
        if (dto.type !== undefined) { setClauses.push(`"type" = $${idx++}`); params.push(dto.type); }
        if (dto.active !== undefined) { setClauses.push(`"active" = $${idx++}`); params.push(dto.active); }
        setClauses.push(`"updated_at" = NOW()`);
        params.push(id);
        await this.courtRepo.manager.query(
          `UPDATE "${chRows[0].schema_name}"."courts" SET ${setClauses.join(', ')} WHERE "id" = $${idx} AND "deleted_at" IS NULL`,
          params
        );
        return { ...court, ...dto };
      }
    }
    Object.assign(court, dto, { updated_at: new Date() });
    return this.courtRepo.save(court);
  }

  async assignMudur(courtId: string, userId: string, user?: { role: string }) {
    const court = await this.findById(courtId, user);
    if (user?.role === 'SUPER_ADMIN') {
      const chRows = await this.courtRepo.manager.query(
        `SELECT schema_name FROM public.courthouses WHERE id = $1 AND deleted_at IS NULL`,
        [court.courthouse_id]
      );
      if (chRows.length > 0) {
        const schema = chRows[0].schema_name;
        await this.courtRepo.manager.query(
          `DELETE FROM "${schema}"."user_courts" WHERE "court_id" = $1`, [courtId]
        );
        const result = await this.courtRepo.manager.query(
          `INSERT INTO "${schema}"."user_courts" (court_id, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *`,
          [courtId, userId]
        );
        return result[0];
      }
    }
    await this.userCourtRepo.delete({ court_id: courtId });
    const assignment = this.userCourtRepo.create({ court_id: courtId, user_id: userId });
    return this.userCourtRepo.save(assignment);
  }

  async removeMudur(courtId: string, userId: string, user?: { role: string }) {
    const court = await this.findById(courtId, user);
    if (user?.role === 'SUPER_ADMIN') {
      const chRows = await this.courtRepo.manager.query(
        `SELECT schema_name FROM public.courthouses WHERE id = $1 AND deleted_at IS NULL`,
        [court.courthouse_id]
      );
      if (chRows.length > 0) {
        await this.courtRepo.manager.query(
          `UPDATE "${chRows[0].schema_name}"."user_courts" SET deleted_at = NOW() WHERE court_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
          [courtId, userId]
        );
        return { success: true };
      }
    }
    await this.userCourtRepo.softDelete({ court_id: courtId, user_id: userId });
    return { success: true };
  }

  async remove(id: string, user?: { role: string }) {
    const court = await this.findById(id, user);
    if (!court) throw new NotFoundException('Mahkeme bulunamadı.');
    if (user?.role === 'SUPER_ADMIN') {
      const chRows = await this.courtRepo.manager.query(
        `SELECT schema_name FROM public.courthouses WHERE id = $1 AND deleted_at IS NULL`,
        [court.courthouse_id]
      );
      if (chRows.length > 0) {
        await this.courtRepo.manager.query(
          `UPDATE "${chRows[0].schema_name}"."courts" SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        return { success: true };
      }
    }
    await this.courtRepo.softDelete(id);
    return { success: true };
  }
}
