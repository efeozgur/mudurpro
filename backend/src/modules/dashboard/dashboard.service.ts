import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThanOrEqual, In } from 'typeorm';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Court } from '../court/entities/court.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { AppealResponse } from '../appeal/entities/appeal-response.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';
import { Party } from '../party/entities/party.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';
import { SureEngineService, KritikSureEntry } from '../sure-engine/sure-engine.service';

export interface FeeSummary {
  totalCount: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  byStatus: Record<string, number>;
  overdueItems: Array<{
    id: string;
    caseId: string;
    esasNo: string;
    type: string;
    amount: number;
    debtorName: string;
    paymentDueDate: string | null;
    status: string;
    courtName?: string;
    courtId?: string;
    muzekkereRemainingDays: number;
  }>;
}

export interface ServiceTrackingItem {
  id: string;
  caseFileId: string;
  esasNo: string;
  courtName: string;
  courtId: string;
  partyName: string;
  partyRole: string;
  type: string;
  status: string;
  sentDate: string | null;
  servedDate: string | null;
}

export interface ServiceTrackingWidget {
  items: ServiceTrackingItem[];
  byStatus: Record<string, number>;
  totalCount: number;
}

export interface AppealStatsItem {
  id: string;
  caseId: string;
  esasNo: string;
  type: string;
  applicantName: string;
  status: string;
  courtName: string;
  courtId: string;
  responseCount: number;
  opposingCount: number;
  isSentToUpperCourt: boolean;
}

export interface DashboardWidget {
  count: number;
  items: Array<{
    id: string;
    caseId: string;
    esasNo: string;
    title?: string;
    remainingDays?: number;
    courtName?: string;
    courtId?: string;
    date?: Date;
  }>;
}

export interface DashboardData {
  totalCasesCount: number;
  activeCasesCount: number;
  finalizedCasesCount: number;
  courts: Array<{ id: string; name: string }>;
  criticalDeadlines: DashboardWidget;
  pendingServices: DashboardWidget;
  readyForFinalization: DashboardWidget;
  readyForAppealTransfer: DashboardWidget;
  feeMuzekkereRequired: DashboardWidget;
  returnedServices: DashboardWidget;
  appealResponseDeadlines: DashboardWidget;
  recentActivity: DashboardWidget;
  feeSummary: FeeSummary;
  serviceTracking: ServiceTrackingWidget;
  appealStats: {
    totalCount: number;
    istinafCount: number;
    temyizCount: number;
    pendingCount: number;
    completedCount: number;
    sentToUpperCourtCount: number;
    items: AppealStatsItem[];
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CaseFile) private caseFileRepo: Repository<CaseFile>,
    @InjectRepository(Court) private courtRepo: Repository<Court>,
    @InjectRepository(ServiceRecord) private serviceRecordRepo: Repository<ServiceRecord>,
    @InjectRepository(Appeal) private appealRepo: Repository<Appeal>,
    @InjectRepository(AppealResponse) private appealResponseRepo: Repository<AppealResponse>,
    @InjectRepository(FeeTracking) private feeTrackingRepo: Repository<FeeTracking>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
    private sureEngine: SureEngineService,
  ) {}

  async getDashboard(userId: string, courtIds: string[]): Promise<DashboardData> {
    if (!courtIds || courtIds.length === 0) {
      return {
        totalCasesCount: 0,
        activeCasesCount: 0,
        finalizedCasesCount: 0,
        courts: [],
        criticalDeadlines: { count: 0, items: [] },
        pendingServices: { count: 0, items: [] },
        readyForFinalization: { count: 0, items: [] },
        readyForAppealTransfer: { count: 0, items: [] },
        feeMuzekkereRequired: { count: 0, items: [] },
        returnedServices: { count: 0, items: [] },
        appealResponseDeadlines: { count: 0, items: [] },
        recentActivity: { count: 0, items: [] },
        feeSummary: { totalCount: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, byStatus: {}, overdueItems: [] },
        serviceTracking: { items: [], byStatus: {}, totalCount: 0 },
        appealStats: { totalCount: 0, istinafCount: 0, temyizCount: 0, pendingCount: 0, completedCount: 0, sentToUpperCourtCount: 0, items: [] },
      };
    }

    const courts = await this.courtRepo.find({
      where: { id: In(courtIds), deleted_at: IsNull() }
    });

    const courtMap = courts.reduce((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {} as Record<string, string>);

    const totalCasesCount = await this.caseFileRepo.count({
      where: { court_id: In(courtIds), deleted_at: IsNull() }
    });

    const activeCasesCount = await this.caseFileRepo.count({
      where: { court_id: In(courtIds), durum: 'ACTIVE', deleted_at: IsNull() }
    });

    const finalizedCasesCount = await this.caseFileRepo.count({
      where: { court_id: In(courtIds), durum: 'FINALIZED', deleted_at: IsNull() }
    });

    const kritikSures = await this.sureEngine.getKritikSures(courtIds);
    const criticalDeadlinesItems = await Promise.all(
      kritikSures.map(async (k) => {
        const cf = await this.caseFileRepo.findOne({ where: { id: k.caseId } });
        const actionByStatus: Record<string, string> = {
          GECMIS: 'Süre geçmiş: tebligat ve kanun yolu durumunu hemen kontrol edin.',
          KRITIK: 'Kritik süre: ilgili tebligat veya kanun yolu işlemini tamamlayın.',
          YAKLASIYOR: 'Süre yaklaşıyor: dosyadaki eksik işlemleri tamamlayın.',
          READY_FOR_FINALIZATION: 'Tüm taraf karar tebligatlarını kontrol edip kesinleştirin.',
          READY_FOR_APPEAL_TRANSFER: 'Kanun yolu evrakını kontrol edip üst mahkemeye gönderin.',
        };
        return {
          id: k.id,
          caseId: k.caseId,
          esasNo: k.esasNo,
          remainingDays: k.remainingDays,
          title: actionByStatus[k.status] || 'Dosya süre durumunu kontrol edin.',
          courtName: cf ? courtMap[cf.court_id] : '',
          courtId: cf ? cf.court_id : undefined,
        };
      })
    );

    const criticalDeadlines: DashboardWidget = {
      count: kritikSures.length,
      items: criticalDeadlinesItems,
    };

    const pendingServices = await this.buildPendingServices(courtIds, courtMap);
    const readyForFinalization = await this.buildReadyForFinalization(courtIds, courtMap);
    const readyForAppealTransfer = await this.buildReadyForAppealTransfer(courtIds, courtMap);
    const feeMuzekkereRequired = await this.buildFeeMuzekkereRequired(courtIds, courtMap);
    const returnedServices = await this.buildReturnedServices(courtIds, courtMap);
    const appealResponseDeadlines = await this.buildAppealResponseDeadlines(courtIds, courtMap);
    const recentActivity = await this.buildRecentActivity(courtIds);
    const feeSummary = await this.buildFeeSummary(courtIds, courtMap);
    const serviceTracking = await this.buildServiceTracking(courtIds, courtMap);
    const appealStats = await this.buildAppealStats(courtIds, courtMap);

    return {
      totalCasesCount,
      activeCasesCount,
      finalizedCasesCount,
      courts: courts.map((c) => ({ id: c.id, name: c.name })),
      criticalDeadlines,
      pendingServices,
      readyForFinalization,
      readyForAppealTransfer,
      feeMuzekkereRequired,
      returnedServices,
      appealResponseDeadlines,
      recentActivity,
      feeSummary,
      serviceTracking,
      appealStats,
    };
  }

  private async buildPendingServices(courtIds: string[], courtMap: Record<string, string>): Promise<DashboardWidget> {
    const caseFiles = await this.caseFileRepo.find({
      where: { court_id: In(courtIds), deleted_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const cf of caseFiles) {
      const serviceRecords = await this.serviceRecordRepo.find({
        where: { case_file_id: cf.id, deleted_at: IsNull() },
      });

      const servedCount = serviceRecords.filter((r) => r.status === 'SERVED').length;
      if (serviceRecords.length === 0 || servedCount < serviceRecords.length) {
        items.push({ 
          id: cf.id, 
          caseId: cf.id, 
          esasNo: cf.esas_no, 
          courtName: courtMap[cf.court_id] || '',
          courtId: cf.court_id
        });
      }
    }

    return { count: items.length, items };
  }

  private async buildReadyForFinalization(courtIds: string[], courtMap: Record<string, string>): Promise<DashboardWidget> {
    const caseFiles = await this.caseFileRepo.find({
      where: { court_id: In(courtIds), deleted_at: IsNull(), finalized_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const cf of caseFiles) {
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
            courtName: courtMap[cf.court_id] || '',
            courtId: cf.court_id
          });
        }
      }
    }

    return { count: items.length, items };
  }

  private async buildReadyForAppealTransfer(courtIds: string[], courtMap: Record<string, string>): Promise<DashboardWidget> {
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
        items.push({ 
          id: appeal.id, 
          caseId: cf.id, 
          esasNo: cf.esas_no, 
          courtName: courtMap[cf.court_id] || '',
          courtId: cf.court_id
        });
      }
    }

    return { count: items.length, items };
  }

  private async buildAppealResponseDeadlines(courtIds: string[], courtMap: Record<string, string>): Promise<DashboardWidget> {
    const caseFiles = await this.caseFileRepo.find({
      where: { court_id: In(courtIds), deleted_at: IsNull(), durum: Not('UST_MAHKEMEDE') },
    });

    const items: DashboardWidget['items'] = [];

    for (const cf of caseFiles) {
      try {
        const calculated = await this.sureEngine.calculateSures(cf.id);
        if (calculated.opposingPartyDeadlines && calculated.opposingPartyDeadlines.length > 0) {
          for (const deadline of calculated.opposingPartyDeadlines) {
            if (deadline.remainingDays <= 7 && !deadline.hasResponded) {
              items.push({
                id: `${cf.id}-${deadline.partyId}`,
                caseId: cf.id,
                esasNo: cf.esas_no,
                title: deadline.partyName,
                remainingDays: deadline.remainingDays,
                courtName: courtMap[cf.court_id] || '',
                courtId: cf.court_id,
              });
            }
          }
        }
      } catch {
        // skip engine errors
      }
    }

    items.sort((a, b) => (a.remainingDays ?? 999) - (b.remainingDays ?? 999));
    return { count: items.length, items };
  }

  private async buildFeeMuzekkereRequired(courtIds: string[], courtMap: Record<string, string>): Promise<DashboardWidget> {
    // Find fees with MUZEKKERE_REQUIRED status OR unpaid fees past their payment_due_date
    const fees = await this.feeTrackingRepo.find({
      where: { deleted_at: IsNull() },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;

    const items: DashboardWidget['items'] = [];

    for (const fee of fees) {
      const cf = await this.caseFileRepo.findOne({
        where: { id: fee.case_file_id, deleted_at: IsNull() },
      });
      if (!cf || !courtIds.includes(cf.court_id)) continue;

      // Include if status is MUZEKKERE_REQUIRED, or if unpaid and past due date
      const isUnpaid = fee.status !== 'PAYMENT_COMPLETED' && fee.status !== 'CLOSED';

      if (fee.status === 'MUZEKKERE_REQUIRED') {
        const remainingDays = fee.payment_due_date
          ? 15 - Math.floor((now.getTime() - new Date(fee.payment_due_date).getTime()) / msPerDay)
          : 0;
        items.push({
          id: fee.id,
          caseId: cf.id,
          esasNo: cf.esas_no,
          courtName: courtMap[cf.court_id] || '',
          courtId: cf.court_id,
          remainingDays,
        });
      } else if (isUnpaid && fee.payment_due_date) {
        const dueDate = new Date(fee.payment_due_date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate <= now) {
          const daysSinceDue = Math.floor((now.getTime() - dueDate.getTime()) / msPerDay);
          const remainingDays = 15 - daysSinceDue;
          items.push({
            id: fee.id,
            caseId: cf.id,
            esasNo: cf.esas_no,
            courtName: courtMap[cf.court_id] || '',
            courtId: cf.court_id,
            remainingDays,
          });
        }
      }
    }

    return { count: items.length, items };
  }

  private async buildReturnedServices(courtIds: string[], courtMap: Record<string, string>): Promise<DashboardWidget> {
    const records = await this.serviceRecordRepo.find({
      where: { status: 'RETURNED', deleted_at: IsNull() },
    });

    const items: DashboardWidget['items'] = [];

    for (const r of records) {
      const cf = await this.caseFileRepo.findOne({
        where: { id: r.case_file_id, deleted_at: IsNull() },
      });
      if (!cf || !courtIds.includes(cf.court_id)) continue;

      items.push({ 
        id: r.id, 
        caseId: cf.id, 
        esasNo: cf.esas_no, 
        courtName: courtMap[cf.court_id] || '',
        courtId: cf.court_id
      });
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

    if (logs.length === 0) return { count: 0, items: [] };

    const userIds = logs.map(l => l.user_id);
    const usersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const users = await this.auditLogRepo.manager.query(
        `SELECT id, name FROM public.users WHERE id = ANY($1)`,
        [userIds]
      );
      for (const u of users) {
        usersMap[u.id] = u.name;
      }
    }

    const items = logs.map((l) => ({
      id: l.id,
      caseId: l.case_file_id || '',
      esasNo: l.action,
      title: `${usersMap[l.user_id] || 'Bilinmeyen'} - ${l.module === 'case-file' ? 'Dosya' : l.module === 'party' ? 'Taraf' : l.module === 'service-record' ? 'Tebligat' : l.module === 'appeal' ? 'Kanun Yolu' : l.module} İşlemi`,
      date: l.created_at,
      courtId: l.court_id || undefined
    }));

    return { count: items.length, items };
  }

  private async buildServiceTracking(courtIds: string[], courtMap: Record<string, string>): Promise<ServiceTrackingWidget> {
    // Status count breakdown
    const statusCounts = await this.serviceRecordRepo
      .createQueryBuilder('sr')
      .innerJoin('case_files', 'cf', 'cf.id = sr.case_file_id AND cf.deleted_at IS NULL')
      .where('cf.court_id IN (:...courtIds)', { courtIds })
      .andWhere('sr.deleted_at IS NULL')
      .select('sr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sr.status')
      .getRawMany();

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status] = parseInt(row.count, 10);
    }
    const totalCount = Object.values(byStatus).reduce((sum, c) => sum + c, 0);

    // Individual records (limited to 100)
    const records = await this.serviceRecordRepo
      .createQueryBuilder('sr')
      .innerJoin('case_files', 'cf', 'cf.id = sr.case_file_id AND cf.deleted_at IS NULL')
      .leftJoin('parties', 'p', 'p.id = sr.party_id AND p.deleted_at IS NULL')
      .where('cf.court_id IN (:...courtIds)', { courtIds })
      .andWhere('sr.deleted_at IS NULL')
      .select([
        'sr.id',
        'sr.case_file_id',
        'sr.type',
        'sr.sent_date',
        'sr.served_date',
        'sr.status',
        'cf.esas_no',
        'cf.court_id',
        'p.first_name',
        'p.last_name',
        'p.organization_name',
        'p.role',
        'p.party_type',
      ])
      .orderBy('sr.created_at', 'DESC')
      .take(100)
      .getRawMany();

    const items: ServiceTrackingItem[] = records.map((r: any) => {
      const partyName = r.p_party_type === 'ORGANIZATION'
        ? (r.p_organization_name || 'Bilinmeyen')
        : `${r.p_first_name || ''} ${r.p_last_name || ''}`.trim() || 'Bilinmeyen';

      return {
        id: r.sr_id,
        caseFileId: r.sr_case_file_id,
        esasNo: r.cf_esas_no,
        courtName: courtMap[r.cf_court_id] || '',
        courtId: r.cf_court_id,
        partyName,
        partyRole: r.p_role || '',
        type: r.sr_type,
        status: r.sr_status,
        sentDate: r.sr_sent_date ? new Date(r.sr_sent_date).toISOString() : null,
        servedDate: r.sr_served_date ? new Date(r.sr_served_date).toISOString() : null,
      };
    });

    return { items, byStatus, totalCount };
  }

  private async buildFeeSummary(courtIds: string[], courtMap: Record<string, string>): Promise<FeeSummary> {
    const allFees = await this.feeTrackingRepo.find({
      where: { deleted_at: IsNull() },
    });

    const caseFiles = await this.caseFileRepo.find({
      where: { court_id: In(courtIds), deleted_at: IsNull() },
    });
    const caseFileMap = new Map(caseFiles.map(cf => [cf.id, cf]));
    const caseFileIds = new Set(caseFiles.map(cf => cf.id));

    const feesInScope = allFees.filter(f => caseFileIds.has(f.case_file_id));

    let totalAmount = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;
    const byStatus: Record<string, number> = {};
    const overdueItems: FeeSummary['overdueItems'] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const debtorPartyIds = [...new Set(feesInScope.map(f => f.debtor_party_id))];
    const debtorParties = debtorPartyIds.length > 0
      ? await this.partyRepo.find({
          where: debtorPartyIds.map(id => ({ id, deleted_at: IsNull() })),
        } as any)
      : [];
    const debtorMap = new Map(debtorParties.map(p => [p.id, p]));

    for (const fee of feesInScope) {
      const amount = Number(fee.amount);
      totalAmount += amount;

      byStatus[fee.status] = (byStatus[fee.status] || 0) + 1;

      if (fee.status === 'PAYMENT_COMPLETED') {
        collectedAmount += amount;
      } else if (fee.status !== 'CLOSED') {
        pendingAmount += amount;
      }

      if (
        fee.status !== 'PAYMENT_COMPLETED' &&
        fee.status !== 'CLOSED' &&
        fee.payment_due_date
      ) {
        const dueDate = new Date(fee.payment_due_date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate <= now) {
          const cf = caseFileMap.get(fee.case_file_id);
          const debtor = debtorMap.get(fee.debtor_party_id);
          const debtorName = debtor
            ? debtor.organization_name || `${debtor.first_name || ''} ${debtor.last_name || ''}`.trim()
            : 'Bilinmeyen';

          const msPerDay = 1000 * 60 * 60 * 24;
          const daysSinceDue = Math.floor((now.getTime() - dueDate.getTime()) / msPerDay);
          const muzekkereRemainingDays = 15 - daysSinceDue;

          overdueItems.push({
            id: fee.id,
            caseId: fee.case_file_id,
            esasNo: cf?.esas_no || 'Bilinmeyen',
            type: fee.type,
            amount,
            debtorName,
            paymentDueDate: fee.payment_due_date ? fee.payment_due_date.toISOString().split('T')[0] : null,
            status: fee.status,
            courtName: cf ? courtMap[cf.court_id] || '' : '',
            courtId: cf?.court_id,
            muzekkereRemainingDays,
          });
        }
      }
    }

    overdueItems.sort((a, b) => (a.paymentDueDate || '').localeCompare(b.paymentDueDate || ''));

    return { totalCount: feesInScope.length, totalAmount, collectedAmount, pendingAmount, byStatus, overdueItems };
  }

  private async buildAppealStats(courtIds: string[], courtMap: Record<string, string>) {
    // Find case files in user's courts
    const caseFiles = await this.caseFileRepo.find({
      where: { court_id: In(courtIds), deleted_at: IsNull() },
    });
    const caseFileIds = caseFiles.map(cf => cf.id);

    if (caseFileIds.length === 0) {
      return { totalCount: 0, istinafCount: 0, temyizCount: 0, pendingCount: 0, completedCount: 0, sentToUpperCourtCount: 0, items: [] };
    }

    const cfMap = new Map(caseFiles.map(cf => [cf.id, cf]));
    const caseFileIdSet = new Set(caseFileIds);

    // Get all appeals for user's case files
    const allAppeals = await this.appealRepo.find({
      where: { deleted_at: IsNull() },
    });

    const appeals = allAppeals.filter(a => caseFileIdSet.has(a.case_file_id));

    if (appeals.length === 0) {
      return { totalCount: 0, istinafCount: 0, temyizCount: 0, pendingCount: 0, completedCount: 0, sentToUpperCourtCount: 0, items: [] };
    }

    // Batch load applicant parties
    const applicantPartyIds = [...new Set(appeals.map(a => a.applicant_party_id))];
    const applicantParties = await this.partyRepo.find({
      where: { id: In(applicantPartyIds), deleted_at: IsNull() },
    });
    const applicantMap = new Map(applicantParties.map(p => [p.id, p]));

    // Count responses per appeal
    const appealIds = appeals.map(a => a.id);
    const responseCounts: Record<string, number> = {};
    const responseRaw = await this.appealResponseRepo
      .createQueryBuilder('ar')
      .select('ar.appeal_id', 'appeal_id')
      .addSelect('COUNT(*)', 'count')
      .where('ar.appeal_id IN (:...appealIds)', { appealIds })
      .andWhere('ar.deleted_at IS NULL')
      .groupBy('ar.appeal_id')
      .getRawMany();
    for (const row of responseRaw) {
      responseCounts[row.appeal_id] = parseInt(row.count, 10);
    }

    // Count opposing parties per case file (all parties minus the applicant)
    const partyCounts: Record<string, number> = {};
    const partyRaw = await this.partyRepo
      .createQueryBuilder('p')
      .select('p.case_file_id', 'case_file_id')
      .addSelect('COUNT(*)', 'count')
      .where('p.case_file_id IN (:...caseFileIds)', { caseFileIds })
      .andWhere('p.deleted_at IS NULL')
      .groupBy('p.case_file_id')
      .getRawMany();
    for (const row of partyRaw) {
      partyCounts[row.case_file_id] = parseInt(row.count, 10);
    }

    let istinafCount = 0;
    let temyizCount = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let sentToUpperCourtCount = 0;

    const items: AppealStatsItem[] = appeals.map(appeal => {
      if (appeal.type === 'ISTINAF') istinafCount++;
      else if (appeal.type === 'TEMYIZ') temyizCount++;

      if (appeal.status === 'CREATED' || appeal.status === 'PENDING' || appeal.status === 'ACTIVE') pendingCount++;
      else if (appeal.status === 'COMPLETED' || appeal.status === 'FINALIZED' || appeal.status === 'TRANSFERRED') completedCount++;

      if (appeal.is_sent_to_upper_court) sentToUpperCourtCount++;

      const cf = cfMap.get(appeal.case_file_id);
      const applicant = applicantMap.get(appeal.applicant_party_id);
      const applicantName = applicant
        ? (applicant.organization_name || `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || 'Bilinmeyen')
        : 'Bilinmeyen';

      const totalPartiesInCase = partyCounts[appeal.case_file_id] || 0;
      const opposingCount = totalPartiesInCase > 0 ? totalPartiesInCase - 1 : 0;

      return {
        id: appeal.id,
        caseId: appeal.case_file_id,
        esasNo: cf?.esas_no || 'Bilinmeyen',
        type: appeal.type,
        applicantName,
        status: appeal.status,
        courtName: cf ? courtMap[cf.court_id] || '' : '',
        courtId: cf?.court_id || '',
        responseCount: responseCounts[appeal.id] || 0,
        opposingCount,
        isSentToUpperCourt: appeal.is_sent_to_upper_court,
      };
    });

    return {
      totalCount: appeals.length,
      istinafCount,
      temyizCount,
      pendingCount,
      completedCount,
      sentToUpperCourtCount,
      items,
    };
  }
}
