import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Court } from './entities/court.entity';
import { UserCourt } from '../user-court/entities/user-court.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtService {
  constructor(
    @InjectRepository(Court) private courtRepo: Repository<Court>,
    @InjectRepository(UserCourt) private userCourtRepo: Repository<UserCourt>,
  ) {}

  async findAll() {
    return this.courtRepo.find({ where: { deleted_at: IsNull() } });
  }

  async findById(id: string) {
    const court = await this.courtRepo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!court) throw new NotFoundException('Court not found');
    return court;
  }

  async create(dto: CreateCourtDto) {
    const court = this.courtRepo.create(dto);
    return this.courtRepo.save(court);
  }

  async update(id: string, dto: UpdateCourtDto) {
    const court = await this.findById(id);
    Object.assign(court, dto, { updated_at: new Date() });
    return this.courtRepo.save(court);
  }

  async assignMudur(courtId: string, userId: string) {
    await this.findById(courtId);
    const existing = await this.userCourtRepo.findOne({
      where: { court_id: courtId, user_id: userId, deleted_at: IsNull() },
    });
    if (existing) throw new ConflictException('Mudur already assigned to this court');
    const assignment = this.userCourtRepo.create({ court_id: courtId, user_id: userId });
    return this.userCourtRepo.save(assignment);
  }

  async removeMudur(courtId: string, userId: string) {
    await this.userCourtRepo.softDelete({ court_id: courtId, user_id: userId });
    return { success: true };
  }
}
