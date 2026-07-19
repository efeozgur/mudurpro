import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThanOrEqual } from 'typeorm';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';
import { SureEngineService, KritikSureEntry } from '../sure-engine/sure-engine.service';

export interface DashboardWidget {
  count: number;
  items: Array<{
    id: string;
    caseId: string;
    esasNo: string;
    title?: string;
    remainingDays?: number;
  }>;
}

export interface DashboardData {
  criticalDeadlines: DashboardWidget;
  pendingServices: DashboardWidget;
  readyForFinalization: DashboardWidget;
  readyForAppealTransfer: DashboardWidget;
  feeMuzekkereRequired: DashboardWidget;
  returnedServices: DashboardWidget;
  recentActivity: DashboardWidget;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    @InjectRepository(ServiceRecord) private serviceRecordRepo: Repository<ServiceRecord>,
    @InjectRepository(Appeal) private appealRepo: Repository<Appeal>,
    @InjectRepository(FeeTracking) private feeTrackingRepo: Repository<FeeTracking>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
    private sureEngine: SureEngineService,
  ) {}

  async getDashboard(userId: string, courtIds: string[]): Promise<DashboardData> {
    const kritikSures = await this.sureEngine.getKritikSures(courtIds);

    const criticalDeadlines: DashboardWidget = {
      count: kritikSures.length,
      items: kritikSures.map((k) => ({
        id: k.id,
        caseId: k.caseId,
        esasNo: k.esasNo,
        remainingDays: k.remainingDays,
      })),
    };

    const pendingServices = await this.buildPendingServices(courtIds);
    const readyForFinalization = await this.buildReadyForFinalization(courtIds);
    const readyForAppealTransfer = await this.buildReadyForAppealTransfer(courtIds);
    const feeMuzekkereRequired = await this.buildFeeMuzekkereRequired(courtIds);
    const returnedServices = await this.buildReturnedServices(courtIds);
    const recentActivity = await this.buildRecentActivity(courtIds);

    return {
      criticalDeadlines,
      pendingServices,
      readyForFinalization,
      readyForAppealTransfer,
      feeMuzekkereRequired,
      returnedServices,
      recentActivity,
    };
  }

  private async buildPendingServices(courtIds: string[]): Promise<DashboardWidget> {
    const caseFiles = await this.caseFileRepo.find({
      where: { deleted_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const cf of caseFiles) {
      if (!courtIds.includes(cf.court_id)) continue;

      const serviceRecords = await this.serviceRecordRepo.find({
        where: { case_file_id: cf.id, deleted_at: IsNull() },
      });

      const servedCount = serviceRecords.filter((r) => r.status === 'SERVED').length;
      if (serviceRecords.length === 0 || servedCount < serviceRecords.length) {
        items.push({ id: cf.id, caseId: cf.id, esasNo: cf.esas_no });
      }
    }

    return { count: items.length, items };
  }

  private async buildReadyForFinalization(courtIds: string[]): Promise<DashboardWidget> {
    const caseFiles = await this.caseFileRepo.find({
      where: { deleted_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const cf of caseFiles) {
      if (!courtIds.includes(cf.court_id)) continue;

      const appeals = await this.appealRepo.find({
        where: { case_file_id: cf.id, deleted_at: IsNull() },
      });

      if (appeals.length === 0) {
        const result = await this.sureEngine.calculateSures(cf.id);
        if (result.status === 'TAKIP' || result.status === 'NORMAL') {
          items.push({
            id: cf.id,
            caseId: cf.id,
            esasNo: cf.esas_no,
            remainingDays: result.remainingDays,
          });
        }
      }
    }

    return { count: items.length, items };
  }

  private async buildReadyForAppealTransfer(courtIds: string[]): Promise<DashboardWidget> {
    const appeals = await this.appealRepo.find({
      where: { deleted_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const appeal of appeals) {
      const cf = await this.caseFileRepo.findOne({
        where: { id: appeal.case_file_id, deleted_at: IsNull() },
      });
      if (!cf || !courtIds.includes(cf.court_id)) continue;

      if (appeal.status !== 'TRANSFERRED') {
        items.push({ id: appeal.id, caseId: cf.id, esasNo: cf.esas_no });
      }
    }

    return { count: items.length, items };
  }

  private async buildFeeMuzekkereRequired(courtIds: string[]): Promise<DashboardWidget> {
    const fees = await this.feeTrackingRepo.find({
      where: { status: 'MUZEKKERE_REQUIRED', deleted_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const fee of fees) {
      const cf = await this.caseFileRepo.findOne({
        where: { id: fee.case_file_id, deleted_at: IsNull() },
      });
      if (!cf || !courtIds.includes(cf.court_id)) continue;

      items.push({ id: fee.id, caseId: cf.id, esasNo: cf.esas_no });
    }

    return { count: items.length, items };
  }

  private async buildReturnedServices(courtIds: string[]): Promise<DashboardWidget> {
    const records = await this.serviceRecordRepo.find({
      where: { status: 'RETURNED', deleted_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const r of records) {
      const cf = await this.caseFileRepo.findOne({
        where: { id: r.case_file_id, deleted_at: IsNull() },
      });
      if (!cf || !courtIds.includes(cf.court_id)) continue;

      items.push({ id: r.id, caseId: cf.id, esasNo: cf.esas_no });
    }

    return { count: items.length, items };
  }

  private async buildRecentActivity(courtIds: string[]): Promise<DashboardWidget> {
    const logs = await this.auditLogRepo
      .createQueryBuilder('al')
      .where('al.court_id IN (:...courtIds)', { courtIds })
      .orderBy('al.created_at', 'DESC')
      .take(10)
      .getMany();

    const items = logs.map((l) => ({
      id: l.id,
      caseId: l.case_file_id || '',
      esasNo: l.action,
      title: `${l.module}/${l.entity}`,
    }));

    return { count: items.length, items };
  }
}
