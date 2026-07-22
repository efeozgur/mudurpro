import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Party } from '../party/entities/party.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { AppealResponse } from '../appeal/entities/appeal-response.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';

export interface OpposingPartyDeadline {
  partyId: string;
  partyName: string;
  role: string;
  servedDate: string;
  deadlineDate: string;
  remainingDays: number;
  hasResponded: boolean;
  responseId?: string;
}

export interface SureResult {
  status: string;
  remainingDays?: number;
  finalizationDate?: string;
  details?: string[];
  opposingPartyDeadlines?: OpposingPartyDeadline[];
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
    @InjectRepository(AppealResponse) private appealResponseRepo: Repository<AppealResponse>,
    @InjectRepository(FeeTracking) private feeTrackingRepo: Repository<FeeTracking>,
  ) {}

  async calculateSures(caseFileId: string): Promise<SureResult> {
    const caseFile = await this.caseFileRepo.findOne({
      where: { id: caseFileId, deleted_at: IsNull() },
    });
    if (!caseFile) throw new NotFoundException('Case file not found');

    const details: string[] = [];
    const activeParties = await this.partyRepo.find({
      where: { case_file_id: caseFileId, is_active: true, deleted_at: IsNull() },
    });

    if (activeParties.length === 0) {
      return { status: 'PENDING_SERVICES', details: ['Dosyada aktif taraf bulunmuyor'] };
    }

    const serviceRecords = await this.serviceRecordRepo.find({
      where: { case_file_id: caseFileId, deleted_at: IsNull() },
    });

    // 1. Karar tebligatlarını filtrele (İstinaf/temyiz dilekçesi tebligatı dışındakiler)
    const decisionServices = serviceRecords.filter(
      (r) => !r.type.toUpperCase().includes('ISTINAF') && !r.type.toUpperCase().includes('TEMYIZ')
    );

    // İade kontrolü: Eğer bir tarafın son tebligatı iade edilmişse ve başarılı bir tebligatı yoksa süre başlamaz.
    const partyReturned = new Set<string>();
    const partyServed = new Set<string>();

    for (const p of activeParties) {
      const pServices = decisionServices.filter((s) => s.party_id === p.id);
      if (pServices.some((s) => s.status === 'RETURNED')) {
        partyReturned.add(p.id);
      }
      if (pServices.some((s) => s.status === 'SERVED')) {
        partyServed.add(p.id);
        partyReturned.delete(p.id); // Başarılı tebligat varsa iade durumunu ez
      }
    }

    if (partyReturned.size > 0) {
      return {
        status: 'RETURNED_SERVICES',
        details: ['Tebligat iade edildi. Süre başlamadı.'],
      };
    }

    const appeals = await this.appealRepo.find({
      where: { case_file_id: caseFileId, deleted_at: IsNull() },
    });

    // Tüm taraflara başarılı tebliğ yapılmış olmalıdır (appeal yoksa zorunlu)
    const unservedParties = activeParties.filter((p) => !partyServed.has(p.id));
    if (unservedParties.length > 0) {
      // Appeal varsa ve tüm karşı taraflar cevap verdiyse karar tebligatı kontrolünü atla
      if (appeals.length > 0) {
        const applicant = activeParties.find((p) => p.id === appeals[0].applicant_party_id);
        if (applicant) {
          const opposingRole = applicant.role === 'PLAINTIFF' ? 'DEFENDANT' : 'PLAINTIFF';
          const opposingParties = activeParties.filter((p) => p.role === opposingRole);
          const allResponses: boolean[] = [];
          for (const op of opposingParties) {
            const responseRecord = await this.appealResponseRepo.findOne({
              where: { appeal_id: appeals[0].id, opposing_party_id: op.id, deleted_at: IsNull() },
            });
            allResponses.push(!!responseRecord);
          }
          const allOpponentsResponded = opposingParties.length > 0 && allResponses.every((r) => r);
          if (allOpponentsResponded) {
            // Tüm karşı taraflar cevap verdi — karar tebligatı kontrolünü atla
          } else {
            return {
              status: 'PENDING_SERVICES',
              details: [`${unservedParties.length} aktif tarafa tebligat yapılması bekleniyor`],
            };
          }
        } else {
          return {
            status: 'PENDING_SERVICES',
            details: [`${unservedParties.length} aktif tarafa tebligat yapılması bekleniyor`],
          };
        }
      } else {
        return {
          status: 'PENDING_SERVICES',
          details: [`${unservedParties.length} aktif tarafa tebligat yapılması bekleniyor`],
        };
      }
    }

    const latestServedDate = decisionServices.reduce((latest, r) => {
      if (r.status !== 'SERVED' || !r.served_date) return latest;
      const servedDate = new Date(r.served_date);
      return latest && latest > servedDate ? latest : servedDate;
    }, null as Date | null);

    if (!latestServedDate && appeals.length === 0) {
      return { status: 'PENDING_SERVICES', details: ['Geçerli tebliğ tarihi bulunamadı'] };
    }

    let status = 'NORMAL';
    let remainingDays: number | undefined;
    let finalizationDate: string | undefined;
    let opposingPartyDeadlines: OpposingPartyDeadline[] | undefined;

    if (appeals.length === 0) {
      // Başvuru yok: Kesinleşme Süreci (14 Gün)
      finalizationDate = this.addDays(latestServedDate!, 14).toISOString().split('T')[0];
      remainingDays = this.daysUntil(finalizationDate);

      if (remainingDays <= 0) {
        status = 'READY_FOR_FINALIZATION';
        details.push(`Dosya kesinleşmeye hazır. Karar tebliğ tamamlanma: ${latestServedDate!.toISOString().split('T')[0]}`);
      } else {
        status = this.determineUrgency(remainingDays);
        details.push(`Kesinleşme için kalan süre: ${remainingDays} gün (Tebliğ: ${latestServedDate!.toISOString().split('T')[0]})`);
      }
    } else {
      // Başvuru var: Karşı tarafa tebligat ve 14 günlük süre kontrolü
      const appeal = appeals[0]; // İlk başvuruyu baz alalım
      const applicant = activeParties.find((p) => p.id === appeal.applicant_party_id);
      
      if (!applicant) {
        return { status: 'EKSİK_BİLGİ', details: ['Başvuru yapan taraf bulunamadı'] };
      }

      // Karşı tarafları belirle
      const opposingRole = applicant.role === 'PLAINTIFF' ? 'DEFENDANT' : 'PLAINTIFF';
      const opposingParties = activeParties.filter((p) => p.role === opposingRole);

      if (opposingParties.length === 0) {
        status = 'READY_FOR_APPEAL_TRANSFER';
        details.push(`Karşı taraf bulunmuyor, dosya üst mahkemeye gönderilmeye hazır`);
      } else {
        // Karşı taraflara yapılan istinaf/temyiz tebligatlarını filtrele
        const appealServices = serviceRecords.filter(
          (r) => r.type.toUpperCase().includes('ISTINAF') || r.type.toUpperCase().includes('TEMYIZ')
        );

        // Önce tüm karşı tarafların cevap dilekçesi verip vermediğini kontrol et
        const allResponses: { partyId: string; hasResponded: boolean }[] = [];
        for (const op of opposingParties) {
          const responseRecord = await this.appealResponseRepo.findOne({
            where: { appeal_id: appeal.id, opposing_party_id: op.id, deleted_at: IsNull() },
          });
          allResponses.push({ partyId: op.id, hasResponded: !!responseRecord });
        }
        const allOpponentsResponded = opposingParties.length > 0 && allResponses.every((r) => r.hasResponded);

        if (allOpponentsResponded) {
          status = 'READY_FOR_APPEAL_TRANSFER';
          details.push('Tüm karşı taraflar cevap dilekçesini vermiştir. Dosya üst mahkemeye gönderilmeye hazır.');
          // deadlines oluştur (dashboard için)
          const deadlines: OpposingPartyDeadline[] = [];
          for (const op of opposingParties) {
            const resp = allResponses.find((r) => r.partyId === op.id);
            const partyName = op.organization_name || `${op.first_name || ''} ${op.last_name || ''}`.trim();
            deadlines.push({
              partyId: op.id,
              partyName: partyName || 'İsimsiz Taraf',
              role: op.role === 'PLAINTIFF' ? 'Davacı' : 'Davalı',
              servedDate: '',
              deadlineDate: '',
              remainingDays: 0,
              hasResponded: true,
            });
          }
          opposingPartyDeadlines = deadlines;
        } else {
          const opposingServed = new Set<string>();
          const opposingReturned = new Set<string>();

          for (const op of opposingParties) {
            const opServices = appealServices.filter((s) => s.party_id === op.id);
            if (opServices.some((s) => s.status === 'RETURNED')) {
              opposingReturned.add(op.id);
            }
            if (opServices.some((s) => s.status === 'SERVED')) {
              opposingServed.add(op.id);
              opposingReturned.delete(op.id);
            }
          }

          if (opposingReturned.size > 0) {
            return {
              status: 'RETURNED_SERVICES',
              details: ['Karşı tarafa yapılan kanun yolu tebligatı iade edildi. Süre başlamadı.'],
            };
          }

          const unservedOpposing = opposingParties.filter((op) => !opposingServed.has(op.id));
          if (unservedOpposing.length > 0) {
            return {
              status: 'PENDING_SERVICES',
              details: [`Karşı taraftaki ${unservedOpposing.length} kişiye tebligat yapılması bekleniyor`],
            };
          }

          const latestAppealServedDate = appealServices.reduce((latest, r) => {
            if (r.status !== 'SERVED' || !r.served_date) return latest;
            const servedDate = new Date(r.served_date);
            return latest && latest > servedDate ? latest : servedDate;
          }, null as Date | null);

          if (!latestAppealServedDate) {
            return { status: 'PENDING_SERVICES', details: ['Karşı tarafa yapılan tebliğ tarihleri bulunamadı'] };
          }

          // Her karşı taraf için bireysel deadline hesapla
          const deadlines: OpposingPartyDeadline[] = [];
          for (const op of opposingParties) {
            const opServices = appealServices.filter((s) => s.party_id === op.id);
            const servedRec = opServices.find((s) => s.status === 'SERVED' && s.served_date);
            if (servedRec && servedRec.served_date) {
              const deadlineDate = this.addDays(servedRec.served_date, 14);
              const deadlineStr = deadlineDate.toISOString().split('T')[0];
              const responseRecord = await this.appealResponseRepo.findOne({
                where: { appeal_id: appeal.id, opposing_party_id: op.id, deleted_at: IsNull() },
              });
              const partyName = op.organization_name || `${op.first_name || ''} ${op.last_name || ''}`.trim();
              deadlines.push({
                partyId: op.id,
                partyName: partyName || 'İsimsiz Taraf',
                role: op.role === 'PLAINTIFF' ? 'Davacı' : 'Davalı',
                servedDate: servedRec.served_date.toISOString().split('T')[0],
                deadlineDate: deadlineStr,
                remainingDays: this.daysUntil(deadlineStr),
                hasResponded: !!responseRecord,
                responseId: responseRecord?.id,
              });
            }
          }

          finalizationDate = this.addDays(latestAppealServedDate, 14).toISOString().split('T')[0];
          remainingDays = this.daysUntil(finalizationDate);

          const allResponded = deadlines.length > 0 && deadlines.every((d) => d.hasResponded);
          if (remainingDays <= 0 || allResponded) {
            status = 'READY_FOR_APPEAL_TRANSFER';
            if (allResponded) {
              details.push('Tüm karşı taraflar cevap dilekçesini vermiştir. Dosya üst mahkemeye gönderilmeye hazır.');
            } else {
              details.push('Tüm karşı tarafların tebliğ süreleri tamamlandı. Dosya üst mahkemeye gönderilmeye hazır.');
            }
          } else {
            status = this.determineUrgency(remainingDays);
            details.push(`Kanun yolu tebliğ süreci devam ediyor. Kalan: ${remainingDays} gün`);
          }

          deadlines.sort((a, b) => a.remainingDays - b.remainingDays);
          opposingPartyDeadlines = deadlines;
        }
      }
    }

    // Harçların kontrolü
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
          details.push(`Harç ödeme süresi geçti - Tahsilat Müzekkeresi Gerekli (${fee.type})`);
        }
      }
    }

    return { status, remainingDays, finalizationDate, details, opposingPartyDeadlines };
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
          sure.status !== 'PENDING_SERVICES' &&
          sure.status !== 'RETURNED_SERVICES'
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
