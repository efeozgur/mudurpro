import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CaseFile } from './entities/case-file.entity';
import { CreateCaseFileDto } from './dto/create-case-file.dto';
import { UpdateCaseFileDto } from './dto/update-case-file.dto';
import { SureEngineService } from '../sure-engine/sure-engine.service';
import { Appeal } from '../appeal/entities/appeal.entity';

@Injectable()
export class CaseFileService {
  constructor(
    @InjectRepository(CaseFile) private repo: Repository<CaseFile>,
    @InjectRepository(Appeal) private appealRepo: Repository<Appeal>,
    private sureEngine: SureEngineService,
  ) {}

  async findAll(filters?: { courtIds?: string[]; caseFileIds?: string[]; durum?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const courtIds = filters?.courtIds;

    // Count query
    const countQb = this.repo.createQueryBuilder('cf').where('cf.deleted_at IS NULL');
    if (courtIds && courtIds.length > 0) {
      countQb.andWhere('cf.court_id IN (:...courtIds)', { courtIds });
    }
    if (filters?.caseFileIds && filters.caseFileIds.length > 0) {
      countQb.andWhere('cf.id IN (:...caseFileIds)', { caseFileIds: filters.caseFileIds });
    }
    if (filters?.durum) {
      countQb.andWhere('cf.durum = :durum', { durum: filters.durum });
    } else {
      countQb.andWhere('cf.durum != :notArchived', { notArchived: 'ARCHIVED' });
    }
    const total = await countQb.getCount();

    // Data query — joins for court name, party count, fee total
    const dataQb = this.repo.createQueryBuilder('cf')
      .leftJoin('courts', 'c', 'c.id = cf.court_id')
      .leftJoin('parties', 'p', 'p.case_file_id = cf.id AND p.deleted_at IS NULL')
      .leftJoin('fee_trackings', 'f', 'f.case_file_id = cf.id AND f.deleted_at IS NULL')
      .where('cf.deleted_at IS NULL');

    if (courtIds && courtIds.length > 0) {
      dataQb.andWhere('cf.court_id IN (:...courtIds)', { courtIds });
    }
    if (filters?.caseFileIds && filters.caseFileIds.length > 0) {
      dataQb.andWhere('cf.id IN (:...caseFileIds)', { caseFileIds: filters.caseFileIds });
    }
    if (filters?.durum) {
      dataQb.andWhere('cf.durum = :durum', { durum: filters.durum });
    } else {
      dataQb.andWhere('cf.durum != :notArchived', { notArchived: 'ARCHIVED' });
    }

    dataQb
      .select([
        'cf.id', 'cf.esas_no', 'cf.karar_no', 'cf.karar_tarihi',
        'cf.kanun_yolu', 'cf.durum', 'cf.court_id',
        'cf.created_at', 'cf.updated_at',
      ])
      .addSelect('c.name', 'court_name')
      .addSelect('COUNT(DISTINCT p.id)', 'party_count')
      .addSelect('COALESCE(SUM(f.amount), 0)', 'fee_total')
      .groupBy('cf.id')
      .addGroupBy('c.name')
      .orderBy('cf.created_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const data = await dataQb.getRawMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Case file not found');

    try {
      const calculated = await this.sureEngine.calculateSures(id);
      const statusMap: Record<string, string> = {
        'PENDING_SERVICES': 'SERVICE_IN_PROGRESS',
        'RETURNED_SERVICES': 'SERVICE_IN_PROGRESS',
        'NORMAL': 'WAITING_LEGAL_PERIOD',
        'TAKIP': 'WAITING_LEGAL_PERIOD',
        'YAKLASIYOR': 'WAITING_LEGAL_PERIOD',
        'KRITIK': 'WAITING_LEGAL_PERIOD',
        'GECMIS': 'WAITING_LEGAL_PERIOD',
      };
      const targetStatus = statusMap[calculated.status];
      if (targetStatus && entity.durum !== targetStatus && entity.durum !== 'ARCHIVED' && entity.durum !== 'DRAFT' && entity.durum !== 'FINALIZED') {
        entity.durum = targetStatus;
        // NOTE: status is updated in-memory only for the response.
        // The actual DB status is updated when a write operation (finalize/archive/etc.) is called.
      }
      // Check if all services are completed (SERVED) and no appeal exists — enables finalization button
      let canFinalize = false;
      try {
        const serviceRecords = await this.repo.query(
          `SELECT status FROM service_records WHERE case_file_id = $1 AND deleted_at IS NULL`,
          [id],
        );
        const pending = serviceRecords.filter((sr: any) => sr.status !== 'SERVED' && sr.status !== 'RETURNED');
        const hasServices = serviceRecords.length > 0;
        const appeals = await this.repo.query(
          `SELECT id FROM appeals WHERE case_file_id = $1 AND deleted_at IS NULL LIMIT 1`,
          [id],
        );
        const hasAppeal = appeals.length > 0;
        canFinalize = hasServices && pending.length === 0 && !entity.finalized_at && !hasAppeal;
      } catch {
        canFinalize = false;
      }
      (entity as any)._engineStatus = calculated.status;
      (entity as any)._canFinalize = canFinalize;
      (entity as any)._canSendToUpperCourt = calculated.status === 'READY_FOR_APPEAL_TRANSFER' && !entity.finalized_at && entity.durum !== 'UST_MAHKEMEDE' && entity.durum !== 'ARCHIVED';
    } catch (err) {
      // Ignore engine calculation failures to prevent blocking core queries
    }

    return entity;
  }

  async create(dto: CreateCaseFileDto) {
    const existing = await this.repo.findOne({
      where: { court_id: dto.court_id, esas_no: dto.esas_no, deleted_at: IsNull() },
    });
    if (existing) throw new ConflictException('A case file with this esas_no already exists in this court');
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCaseFileDto) {
    const entity = await this.findById(id);
    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }

  async finalize(id: string, finalizedAt: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Dosya bulunamadı.');
    if (entity.finalized_at) throw new BadRequestException('Dosya zaten kesinleşmiş.');
    if (entity.durum === 'UST_MAHKEMEDE') throw new BadRequestException('Üst mahkemeye gönderilmiş dosya kesinleştirilemez.');
    if (entity.durum === 'ARCHIVED') throw new BadRequestException('Arşivlenmiş dosya kesinleştirilemez.');

    const date = new Date(finalizedAt);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Geçersiz tarih formatı.');
    }

    const services = await this.repo.query(
      `SELECT type, status, served_date FROM service_records WHERE case_file_id = $1 AND deleted_at IS NULL`,
      [id],
    );
    const hasAnyService = services.length > 0;
    if (!hasAnyService) {
      throw new BadRequestException('Tebligat kaydı bulunmadan kesinleştirme yapılamaz.');
    }
    const pendingServices = services.filter((sr: any) => sr.status !== 'SERVED' || !sr.served_date);
    if (pendingServices.length > 0) {
      throw new BadRequestException('Kesinleşme için tüm taraflara tebligat yapılmış ve tebliğ tarihleri girilmiş olmalıdır.');
    }
    const partyCounts = await this.repo.query(
      `SELECT
         (SELECT COUNT(*) FROM parties WHERE case_file_id = $1 AND deleted_at IS NULL) AS party_count,
         (SELECT COUNT(DISTINCT party_id) FROM service_records
          WHERE case_file_id = $1 AND type = 'Gerekçeli Karar'
            AND status = 'SERVED' AND served_date IS NOT NULL AND deleted_at IS NULL) AS served_decision_count`,
      [id],
    );
    const partyCount = Number(partyCounts[0]?.party_count || 0);
    const servedDecisionCount = Number(partyCounts[0]?.served_decision_count || 0);
    if (partyCount === 0 || servedDecisionCount < partyCount) {
      throw new BadRequestException('Karar tüm taraflara tebliğ edilmeden kesinleştirme yapılamaz.');
    }
    const decisionServices = services.filter((sr: any) => sr.type === 'Gerekçeli Karar');
    const lastServed = decisionServices.reduce((latest: Date, sr: any) => {
      const served = new Date(sr.served_date);
      return served > latest ? served : latest;
    }, new Date(0));
    const expectedDate = new Date(lastServed);
    expectedDate.setHours(0, 0, 0, 0);
    expectedDate.setDate(expectedDate.getDate() + 15);
    if (expectedDate.getDay() === 6) expectedDate.setDate(expectedDate.getDate() + 3);
    if (expectedDate.getDay() === 0) expectedDate.setDate(expectedDate.getDate() + 2);
    const expected = expectedDate.toISOString().slice(0, 10);
    if (finalizedAt !== expected) {
      throw new BadRequestException(`Kesinleşme tarihi ${expected} olmalıdır.`);
    }

    // Cannot finalize if there is an appeal application
    const appeals = await this.repo.query(
      `SELECT id FROM appeals WHERE case_file_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    if (appeals.length > 0) {
      throw new BadRequestException('Kanun yolu başvurusu bulunan dosya kesinleştirilemez.');
    }

    entity.durum = 'FINALIZED';
    entity.finalized_at = new Date(finalizedAt);
    entity.updated_at = new Date();
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Dosya bulunamadı.');
    const relatedTables = ['service_records', 'fee_trackings', 'parties', 'notifications'];
    for (const table of relatedTables) {
      await this.repo.query(`UPDATE "${table}" SET deleted_at = NOW() WHERE case_file_id = $1 AND deleted_at IS NULL`, [id]);
    }
    await this.repo.query(
      `UPDATE "appeal_responses" SET deleted_at = NOW()
       WHERE appeal_id IN (SELECT id FROM "appeals" WHERE case_file_id = $1)
       AND deleted_at IS NULL`,
      [id],
    );
    await this.repo.query(
      `UPDATE "appeals" SET deleted_at = NOW() WHERE case_file_id = $1 AND deleted_at IS NULL`,
      [id],
    );
    await this.repo.softRemove(entity);
    return { id, deleted: true };
  }

  async archive(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Dosya bulunamadı.');

    if (entity.durum === 'UST_MAHKEMEDE') throw new BadRequestException('Üst mahkemeye gönderilmiş dosya arşivlenemez.');
    if (entity.durum === 'ARCHIVED') throw new BadRequestException('Dosya zaten arşivde.');
    entity.durum = 'ARCHIVED';
    entity.updated_at = new Date();
    await this.repo.save(entity);
    return { success: true };
  }

  async restore(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Dosya bulunamadı.');
    if (entity.durum !== 'ARCHIVED') throw new ConflictException('Dosya arşivde değil.');
    entity.durum = 'ACTIVE';
    entity.updated_at = new Date();
    return this.repo.save(entity);
  }

  async sendToUpperCourt(id: string, sentDate: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Dosya bulunamadı.');
    if (entity.durum === 'UST_MAHKEMEDE') throw new BadRequestException('Dosya zaten üst mahkemeye gönderilmiş.');
    if (entity.finalized_at) throw new BadRequestException('Kesinleşmiş dosya üst mahkemeye gönderilemez.');

    const date = new Date(sentDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Geçersiz tarih formatı.');
    }


    const calculated = await this.sureEngine.calculateSures(id);
    if (calculated.status !== 'READY_FOR_APPEAL_TRANSFER') {
      throw new BadRequestException('Tebligat süreleri tamamlanmadan dosya üst mahkemeye gönderilemez.');
    }

    entity.durum = 'UST_MAHKEMEDE';
    entity.updated_at = new Date();
    await this.repo.save(entity);

    // Update all related appeal records
    const appeals = await this.appealRepo.find({
      where: { case_file_id: id, deleted_at: IsNull() },
    });
    for (const appeal of appeals) {
      appeal.is_sent_to_upper_court = true;
      appeal.status = 'TRANSFERRED';
      appeal.sent_to_upper_court_date = new Date(sentDate);
      appeal.updated_at = new Date();
    }
    await this.appealRepo.save(appeals);

    return entity;
  }
}
