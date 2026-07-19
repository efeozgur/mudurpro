import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private dataSource: DataSource) {}

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
          type VARCHAR(50),
          sent_date DATE,
          served_date DATE,
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
          aciklama TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          created_by UUID,
          updated_by UUID
        )
      `);

      await queryRunner.query(`
        CREATE TABLE "${schemaName}".fee_tracking (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_file_id UUID NOT NULL REFERENCES "${schemaName}".case_files(id) ON DELETE RESTRICT,
          debtor_party_id UUID NOT NULL REFERENCES "${schemaName}".parties(id) ON DELETE RESTRICT,
          type VARCHAR(50),
          amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
          served_date DATE,
          payment_due_date DATE,
          status VARCHAR(50) DEFAULT 'CREATED' CHECK (status IN ('CREATED','WAITING_FOR_SERVICE','WAITING_PAYMENT','PAYMENT_COMPLETED','MUZEKKERE_REQUIRED','CLOSED')),
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

      this.logger.log(`Created tenant schema: ${schemaName}`);
    } finally {
      await queryRunner.release();
    }
  }
}
