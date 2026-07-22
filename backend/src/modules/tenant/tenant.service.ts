import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Courthouse } from './entities/courthouse.entity';

@Injectable()
export class TenantService implements OnModuleInit {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
  ) {}

  async onModuleInit() {
    await this.createReferenceTable();
    await this.migrateExistingSchemas();
  }

  private async createReferenceTable() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS public.adliye_rehberi (
          id SERIAL PRIMARY KEY,
          sira_no INTEGER,
          name VARCHAR(200) NOT NULL,
          bolge INTEGER,
          teskilat_turu VARCHAR(50),
          faaliyet_durumu VARCHAR(50),
          bagli_oldugu_adliye VARCHAR(200),
          acm VARCHAR(200),
          il VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      // Clear and re-seed adliye_rehberi
      try {
        const path = require('path');
        const fs = require('fs');
        const seedPath = path.join(__dirname, '../../database/seed-hsk.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        // Clear existing data and insert fresh
        await this.dataSource.query(`TRUNCATE TABLE public.adliye_rehberi RESTART IDENTITY CASCADE`);
        const statements = seedSql.split(';').filter((s: string) => s.trim().length > 0);
        for (const stmt of statements) {
          if (stmt.trim().startsWith('INSERT') || stmt.trim().startsWith('SELECT')) {
            await this.dataSource.query(stmt);
          }
        }
        this.logger.log('adliye_rehberi seeded with HSK data (' + statements.filter((s: string) => s.trim().startsWith('INSERT')).length + ' entries)');
      } catch (e) {
        this.logger.warn('Could not seed adliye_rehberi: ' + (e as Error).message);
      }
      this.logger.log('adliye_rehberi reference table ready');
    } catch (e) {
      this.logger.warn('Could not create adliye_rehberi table: ' + (e as Error).message);
    }
  }

  private async migrateExistingSchemas() {
    try {
      const courthouses = await this.courthouseRepo.find({ where: { deleted_at: IsNull() } });
      for (const ch of courthouses) {
        try {
          await this.dataSource.query(
            `ALTER TABLE "${ch.schema_name}"."case_files" ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ`
          );
        } catch { /* table may not exist yet */ }
        // Add the missing fee_trackings table for old schemas
        try {
          await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS "${ch.schema_name}".fee_trackings (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              case_file_id UUID NOT NULL REFERENCES "${ch.schema_name}".case_files(id) ON DELETE RESTRICT,
              debtor_party_id UUID NOT NULL REFERENCES "${ch.schema_name}".parties(id) ON DELETE RESTRICT,
              type VARCHAR(50),
              amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
              served_date DATE,
              payment_due_date DATE,
              status VARCHAR(50) DEFAULT 'CREATED',
              payment_date DATE,
              aciklama TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              deleted_at TIMESTAMPTZ,
              created_by UUID,
              updated_by UUID
            )
          `);
        } catch { /* skip */ }
        // Add appeal_responses table and new columns for existing schemas
        try {
          await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS "${ch.schema_name}".appeal_responses (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              appeal_id UUID NOT NULL REFERENCES "${ch.schema_name}".appeals(id) ON DELETE RESTRICT,
              opposing_party_id UUID NOT NULL REFERENCES "${ch.schema_name}".parties(id) ON DELETE RESTRICT,
              response_date DATE NOT NULL,
              content TEXT,
              received_date DATE,
              aciklama TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              deleted_at TIMESTAMPTZ,
              created_by UUID,
              updated_by UUID,
              UNIQUE(appeal_id, opposing_party_id)
            )
          `);
          await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_appeal_responses_appeal ON "${ch.schema_name}".appeal_responses(appeal_id)`);
          await this.dataSource.query(`ALTER TABLE "${ch.schema_name}".appeals ADD COLUMN IF NOT EXISTS result TEXT`);
          await this.dataSource.query(`ALTER TABLE "${ch.schema_name}".appeals ADD COLUMN IF NOT EXISTS is_sent_to_upper_court BOOLEAN DEFAULT FALSE`);
          await this.dataSource.query(`ALTER TABLE "${ch.schema_name}".appeals ADD COLUMN IF NOT EXISTS sent_to_upper_court_date DATE`);
        } catch { /* skip */ }
      }
      if (courthouses.length > 0) {
        this.logger.log(`Migrated ${courthouses.length} tenant schemas`);
      }
    } catch (e) {
      this.logger.warn('Schema migration skipped (first run / no courthouses yet)');
    }
  }

  async createTenantSchema(schemaName: string): Promise<void> {
    const ds = this.dataSource;
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".courts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          courthouse_id UUID NOT NULL,
          name VARCHAR(200) NOT NULL,
          type VARCHAR(50),
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".user_courts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          court_id UUID NOT NULL REFERENCES "${schemaName}".courts(id) ON DELETE RESTRICT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID,
          UNIQUE(user_id, court_id)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".case_files (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          court_id UUID NOT NULL REFERENCES "${schemaName}".courts(id) ON DELETE RESTRICT,
          esas_no VARCHAR(50) NOT NULL,
          karar_no VARCHAR(50),
          karar_tarihi DATE,
          karar_sonucu VARCHAR(100),
          kanun_yolu VARCHAR(50),
          durum VARCHAR(50) DEFAULT 'ACTIVE',
          aciklama TEXT,
          finalized_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID,
          UNIQUE(court_id, esas_no)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".parties (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_file_id UUID NOT NULL REFERENCES "${schemaName}".case_files(id) ON DELETE RESTRICT,
          party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('PERSON', 'ORGANIZATION')),
          role VARCHAR(20) NOT NULL CHECK (role IN ('PLAINTIFF', 'DEFENDANT')),
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          organization_name VARCHAR(250),
          national_id VARCHAR(11),
          tax_number VARCHAR(20),
          phone VARCHAR(30),
          email VARCHAR(254),
          address TEXT,
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          removal_reason TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".service_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_file_id UUID NOT NULL REFERENCES "${schemaName}".case_files(id) ON DELETE RESTRICT,
          party_id UUID NOT NULL REFERENCES "${schemaName}".parties(id) ON DELETE RESTRICT,
          type VARCHAR(100),
          sent_date TIMESTAMPTZ,
          served_date TIMESTAMPTZ,
          status VARCHAR(50) DEFAULT 'PREPARED' CHECK (status IN ('DRAFT','PREPARED','SENT','SERVED','RETURNED','CANCELLED')),
          aciklama TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".appeals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_file_id UUID NOT NULL REFERENCES "${schemaName}".case_files(id) ON DELETE RESTRICT,
          applicant_party_id UUID NOT NULL REFERENCES "${schemaName}".parties(id) ON DELETE RESTRICT,
          type VARCHAR(50) NOT NULL CHECK (type IN ('ISTINAF', 'TEMYIZ')),
          application_date DATE,
          status VARCHAR(50) DEFAULT 'CREATED',
          result TEXT,
          is_sent_to_upper_court BOOLEAN DEFAULT FALSE,
          sent_to_upper_court_date DATE,
          aciklama TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".appeal_responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          appeal_id UUID NOT NULL REFERENCES "${schemaName}".appeals(id) ON DELETE RESTRICT,
          opposing_party_id UUID NOT NULL REFERENCES "${schemaName}".parties(id) ON DELETE RESTRICT,
          response_date DATE NOT NULL,
          content TEXT,
          received_date DATE,
          aciklama TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID,
          UNIQUE(appeal_id, opposing_party_id)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".fee_trackings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_file_id UUID NOT NULL REFERENCES "${schemaName}".case_files(id) ON DELETE RESTRICT,
          debtor_party_id UUID NOT NULL REFERENCES "${schemaName}".parties(id) ON DELETE RESTRICT,
          type VARCHAR(100),
          amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
          served_date DATE,
          payment_due_date TIMESTAMPTZ,
          status VARCHAR(50) DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','CREATED','WAITING_FOR_SERVICE','WAITING_PAYMENT','PAYMENT_COMPLETED','MUZEKKERE_REQUIRED','OVERDUE','CLOSED')),
          payment_date DATE,
          aciklama TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          case_file_id UUID REFERENCES "${schemaName}".case_files(id) ON DELETE RESTRICT,
          type VARCHAR(50) NOT NULL,
          priority VARCHAR(20) DEFAULT 'P3',
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'CREATED',
          read_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          court_id UUID,
          case_file_id UUID REFERENCES "${schemaName}".case_files(id) ON DELETE RESTRICT,
          action VARCHAR(100) NOT NULL,
          module VARCHAR(100),
          entity VARCHAR(100),
          entity_id UUID,
          old_value JSONB,
          new_value JSONB,
          ip_address VARCHAR(50),
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Indexes
      await queryRunner.query(`CREATE INDEX idx_case_files_court ON "${schemaName}".case_files(court_id)`);
      await queryRunner.query(`CREATE INDEX idx_case_files_esas ON "${schemaName}".case_files(esas_no)`);
      await queryRunner.query(`CREATE INDEX idx_parties_case ON "${schemaName}".parties(case_file_id)`);
      await queryRunner.query(`CREATE INDEX idx_service_records_case ON "${schemaName}".service_records(case_file_id)`);
      await queryRunner.query(`CREATE INDEX idx_service_records_status ON "${schemaName}".service_records(status)`);
      await queryRunner.query(`CREATE INDEX idx_audit_logs_user ON "${schemaName}".audit_logs(user_id, created_at)`);
      await queryRunner.query(`CREATE INDEX idx_notifications_user ON "${schemaName}".notifications(user_id, status)`);
      await queryRunner.query(`CREATE INDEX idx_appeal_responses_appeal ON "${schemaName}".appeal_responses(appeal_id)`);

      this.logger.log(`Created tenant schema: ${schemaName}`);
    } finally {
      await queryRunner.release();
    }
  }
}
