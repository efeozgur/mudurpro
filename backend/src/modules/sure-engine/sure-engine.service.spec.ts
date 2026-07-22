import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SureEngineService } from './sure-engine.service';
import { CaseFile } from '../case-file/entities/case-file.entity';
import { Party } from '../party/entities/party.entity';
import { ServiceRecord } from '../service-record/entities/service-record.entity';
import { Appeal } from '../appeal/entities/appeal.entity';
import { AppealResponse } from '../appeal/entities/appeal-response.entity';
import { FeeTracking } from '../fee-tracking/entities/fee-tracking.entity';
import { NotFoundException } from '@nestjs/common';

describe('SureEngineService', () => {
  let service: SureEngineService;
  let caseFileRepoMock: any;
  let partyRepoMock: any;
  let serviceRecordRepoMock: any;
  let appealRepoMock: any;
  let appealResponseRepoMock: any;
  let feeTrackingRepoMock: any;
  beforeEach(async () => {
    caseFileRepoMock = {
      findOne: jest.fn(),
    };
    partyRepoMock = {
      find: jest.fn(),
    };
    serviceRecordRepoMock = {
      find: jest.fn(),
    };
    appealRepoMock = {
      find: jest.fn(),
    };
    feeTrackingRepoMock = {
      find: jest.fn(),
    };
    appealResponseRepoMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SureEngineService,
        { provide: getRepositoryToken(CaseFile), useValue: caseFileRepoMock },
        { provide: getRepositoryToken(Party), useValue: partyRepoMock },
        { provide: getRepositoryToken(ServiceRecord), useValue: serviceRecordRepoMock },
        { provide: getRepositoryToken(Appeal), useValue: appealRepoMock },
        { provide: getRepositoryToken(FeeTracking), useValue: feeTrackingRepoMock },
        { provide: getRepositoryToken(AppealResponse), useValue: appealResponseRepoMock },
      ],
    }).compile();

    service = module.get<SureEngineService>(SureEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSures', () => {
    const caseId = 'case-uuid-1';

    it('should throw NotFoundException if case file does not exist', async () => {
      caseFileRepoMock.findOne.mockResolvedValue(null);
      await expect(service.calculateSures(caseId)).rejects.toThrow(NotFoundException);
    });

    it('should return PENDING_SERVICES if there are no active parties', async () => {
      caseFileRepoMock.findOne.mockResolvedValue({ id: caseId, esas_no: '2026/10' });
      partyRepoMock.find.mockResolvedValue([]);

      const result = await service.calculateSures(caseId);
      expect(result.status).toBe('PENDING_SERVICES');
      expect(result.details).toContain('Dosyada aktif taraf bulunmuyor');
    });

    it('should return RETURNED_SERVICES if a party service notice is returned and has no successful served record', async () => {
      caseFileRepoMock.findOne.mockResolvedValue({ id: caseId, esas_no: '2026/10' });
      partyRepoMock.find.mockResolvedValue([
        { id: 'party-1', role: 'PLAINTIFF', is_active: true },
        { id: 'party-2', role: 'DEFENDANT', is_active: true },
      ]);
      serviceRecordRepoMock.find.mockResolvedValue([
        { party_id: 'party-1', type: 'KARAR', status: 'SERVED', served_date: new Date('2026-07-01') },
        { party_id: 'party-2', type: 'KARAR', status: 'RETURNED', served_date: null },
      ]);
      appealRepoMock.find.mockResolvedValue([]);
      feeTrackingRepoMock.find.mockResolvedValue([]);

      const result = await service.calculateSures(caseId);
      expect(result.status).toBe('RETURNED_SERVICES');
      expect(result.details).toContain('Tebligat iade edildi. Süre başlamadı.');
    });

    it('should return PENDING_SERVICES if some active parties have not been served', async () => {
      caseFileRepoMock.findOne.mockResolvedValue({ id: caseId, esas_no: '2026/10' });
      partyRepoMock.find.mockResolvedValue([
        { id: 'party-1', role: 'PLAINTIFF', is_active: true },
        { id: 'party-2', role: 'DEFENDANT', is_active: true },
      ]);
      serviceRecordRepoMock.find.mockResolvedValue([
        { party_id: 'party-1', type: 'KARAR', status: 'SERVED', served_date: new Date('2026-07-01') },
      ]);
      appealRepoMock.find.mockResolvedValue([]);
      feeTrackingRepoMock.find.mockResolvedValue([]);

      const result = await service.calculateSures(caseId);
      expect(result.status).toBe('PENDING_SERVICES');
      expect(result.details?.[0]).toContain('tebligat yapılması bekleniyor');
    });

    it('should calculate finalization correctly when all parties served and no appeal exists', async () => {
      caseFileRepoMock.findOne.mockResolvedValue({ id: caseId, esas_no: '2026/10' });
      partyRepoMock.find.mockResolvedValue([
        { id: 'party-1', role: 'PLAINTIFF', is_active: true },
        { id: 'party-2', role: 'DEFENDANT', is_active: true },
      ]);
      
      const servedDate1 = new Date();
      servedDate1.setDate(servedDate1.getDate() - 15); // 15 days ago (so 14-day limit passed)
      
      serviceRecordRepoMock.find.mockResolvedValue([
        { party_id: 'party-1', type: 'KARAR', status: 'SERVED', served_date: servedDate1 },
        { party_id: 'party-2', type: 'KARAR', status: 'SERVED', served_date: servedDate1 },
      ]);
      appealRepoMock.find.mockResolvedValue([]);
      feeTrackingRepoMock.find.mockResolvedValue([]);

      const result = await service.calculateSures(caseId);
      expect(result.status).toBe('READY_FOR_FINALIZATION');
      expect(result.remainingDays).toBeLessThanOrEqual(0);
    });

    it('should check opposing party appeal services and return READY_FOR_APPEAL_TRANSFER if period has passed', async () => {
      caseFileRepoMock.findOne.mockResolvedValue({ id: caseId, esas_no: '2026/10' });
      partyRepoMock.find.mockResolvedValue([
        { id: 'party-1', role: 'PLAINTIFF', is_active: true },
        { id: 'party-2', role: 'DEFENDANT', is_active: true },
      ]);
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 20);

      serviceRecordRepoMock.find.mockResolvedValue([
        // Decision served
        { party_id: 'party-1', type: 'KARAR', status: 'SERVED', served_date: oldDate },
        { party_id: 'party-2', type: 'KARAR', status: 'SERVED', served_date: oldDate },
        // Appeal petition served to defendant (party-2) by plaintiff (party-1)
        { party_id: 'party-2', type: 'ISTINAF_DILEKCESI', status: 'SERVED', served_date: oldDate },
      ]);

      appealRepoMock.find.mockResolvedValue([
        { applicant_party_id: 'party-1', type: 'ISTINAF', application_date: oldDate },
      ]);
      feeTrackingRepoMock.find.mockResolvedValue([]);

      const result = await service.calculateSures(caseId);
      expect(result.status).toBe('READY_FOR_APPEAL_TRANSFER');
    });
  });
});
