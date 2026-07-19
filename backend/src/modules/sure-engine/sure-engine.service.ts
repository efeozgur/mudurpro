import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Party } from '../party/entities/party.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';

export interface SureResult {
  status: string;
  remainingDays?: number;
  finalizationDate?: string;
  details?: string[];
}

export interface KritikSureEntry {
  id: string;
  caseId: string;
  esasNo: string;
  status: string;
  remainingDays: number;
  finalizationDate?: string;
}

@Injectable()
export class SureEngineService {
  constructor(
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(ServiceRecord) private serviceRecordRepo: Repository<ServiceRecord>,
    @InjectRepository(Appeal) private appealRepo: Repository<Appeal>,
    @InjectRepository(FeeTracking) private feeTrackingRepo: Repository<FeeTracking>,
  ) {}

  async calculateSures(caseFileId: string): Promise<SureResult> {
    const caseFile = await this.caseFileRepo.findOne({
      where: { id: caseFileId, deleted_at: IsNull() },
    });
    if (!caseFile) throw new NotFoundException('Case file not found');

    const details: string[] = [];
    let status = 'NORMAL';
    let remainingDays: number | undefined;
    let finalizationDate: string | undefined;

    const activeParties = await this.partyRepo.find({
      where: { case_file_id: caseFileId, is_active: true, deleted_at: IsNull() },
    });

    const serviceRecords = await this.serviceRecordRepo.find({
      where: { case_file_id: caseFileId, deleted_at: IsNull() },
    });

    const servedRecords = serviceRecords.filter((r) => r.status === 'SERVED');

    if (servedRecords.length === 0) {
      return { status: 'PENDING_SERVICES', details: ['No parties have been served yet'] };
    }

    const allActivePartyIds = new Set(activeParties.map((p) => p.id));
    const servedPartyIds = new Set(servedRecords.map((r) => r.party_id));

    const unservedParties = [...allActivePartyIds].filter((id) => !servedPartyIds.has(id));
    if (unservedParties.length > 0) {
      return {
        status: 'PENDING_SERVICES',
        details: [`${unservedParties.length} active party(s) have not been served`],
      };
    }

    const latestServedDate = servedRecords.reduce((latest, r) => {
      if (!r.served_date) return latest;
      return latest && latest > r.served_date ? latest : r.served_date;
    }, null as Date | null);

    if (!latestServedDate) {
      return { status: 'PENDING_SERVICES', details: ['No valid served dates found'] };
    }

    const appeals = await this.appealRepo.find({
      where: { case_file_id: caseFileId, deleted_at: IsNull() },
    });

    if (appeals.length === 0) {
      finalizationDate = this.addDays(latestServedDate, 14).toISOString().split('T')[0];
      remainingDays = this.daysUntil(finalizationDate);
      status = this.determineUrgency(remainingDays);
      details.push(`Kesinleşme: 14 gün, son tebligat: ${latestServedDate.toISOString().split('T')[0]}`);
    } else {
      finalizationDate = this.addDays(latestServedDate, 14).toISOString().split('T')[0];
      remainingDays = this.daysUntil(finalizationDate);
      status = 'READY_FOR_APPEAL_TRANSFER';
      details.push(`İstinaf/Temyiz başvurusu mevcut, dosya transfer edilmeli`);
    }

    const pendingFees = await this.feeTrackingRepo.find({
      where: { case_file_id: caseFileId, status: 'WAITING_PAYMENT', deleted_at: IsNull() },
    });

    for (const fee of pendingFees) {
      if (fee.payment_due_date) {
        const feeRemaining = this.daysUntil(fee.payment_due_date.toISOString().split('T')[0]);
        if (feeRemaining <= 0) {
          fee.status = 'MUZEKKERE_REQUIRED';
          fee.updated_at = new Date();
          await this.feeTrackingRepo.save(fee);
          details.push(`Fee ${fee.type} past due — advanced to MUZEKKERE_REQUIRED`);
        }
      }
    }

    return { status, remainingDays, finalizationDate, details };
  }

  async getKritikSures(courtIds: string[]): Promise<KritikSureEntry[]> {
    if (!courtIds || courtIds.length === 0) return [];

    const caseFiles = await this.caseFileRepo.find({
      where: { deleted_at: IsNull() },
    });

    const results: KritikSureEntry[] = [];

    for (const cf of caseFiles) {
      if (!courtIds.includes(cf.court_id)) continue;

      try {
        const sure = await this.calculateSures(cf.id);
        if (
          sure.remainingDays !== undefined &&
          sure.remainingDays <= 7 &&
          sure.status !== 'PENDING_SERVICES'
        ) {
          results.push({
            id: cf.id,
            caseId: cf.id,
            esasNo: cf.esas_no,
            status: sure.status,
            remainingDays: sure.remainingDays,
            finalizationDate: sure.finalizationDate,
          });
        }
      } catch {
        continue;
      }
    }

    results.sort((a, b) => a.remainingDays - b.remainingDays);
    return results;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private daysUntil(dateStr: string): number {
    const target = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private determineUrgency(remainingDays: number): string {
    if (remainingDays <= 0) return 'GECMIS';
    if (remainingDays <= 3) return 'KRITIK';
    if (remainingDays <= 7) return 'YAKLASIYOR';
    if (remainingDays <= 14) return 'TAKIP';
    return 'NORMAL';
  }
}
