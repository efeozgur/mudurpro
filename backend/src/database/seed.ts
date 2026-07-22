import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5433/mudurpro',
  });
  await ds.initialize();

  const passwordHash = await bcrypt.hash('admin123', 10);

  // Ensure courthouse_id column exists in public.users
  await ds.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS courthouse_id UUID`);

  // 1. Seed Super Admin
  await ds.query(`
    INSERT INTO public.users (id, name, email, password_hash, role, active, created_at, updated_at)
    VALUES ('e8d53018-971c-4b5c-897d-6b5cf1691234', 'Super Admin', 'admin@ozgurapp.com', $1, 'SUPER_ADMIN', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
  `, [passwordHash]);
  console.log('Seed: Super Admin created (admin@ozgurapp.com / admin123)');

  // 2. Seed Courthouse
  const courthouseId = '9f8b7a6c-5d4e-3c2b-1a0f-9e8d7c6b5a4f';
  const schemaName = 'courthouse_istanbul';
  await ds.query(`
    INSERT INTO public.courthouses (id, name, city, schema_name, active, created_at, updated_at)
    VALUES ($1, 'İstanbul Çağlayan Adliyesi', 'İstanbul', $2, true, NOW(), NOW())
    ON CONFLICT (schema_name) DO NOTHING
  `, [courthouseId, schemaName]);
  console.log('Seed: Demo Courthouse created (İstanbul Çağlayan Adliyesi)');

  // 3. Seed Mudur User connected to Courthouse
  const mudurId = '1f2e3d4c-5b6a-7f8e-9d0c-1b2a3f4e5d6c';
  await ds.query(`
    INSERT INTO public.users (id, name, email, password_hash, role, courthouse_id, active, created_at, updated_at)
    VALUES ($1, 'Yazı İşleri Müdürü Ahmet', 'mudur@ozgurapp.com', $2, 'MUDUR', $3, true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
  `, [mudurId, passwordHash, courthouseId]);
  console.log('Seed: Mudur User created (mudur@ozgurapp.com / admin123)');

  // 4. Create Tenant Schema and Tables
  await ds.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".courts (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".user_courts (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".case_files (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".parties (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".service_records (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".appeals (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".fee_trackings (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".notifications (
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

  await ds.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".audit_logs (
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
  await ds.query(`CREATE INDEX IF NOT EXISTS idx_case_files_court ON "${schemaName}".case_files(court_id)`);
  await ds.query(`CREATE INDEX IF NOT EXISTS idx_case_files_esas ON "${schemaName}".case_files(esas_no)`);
  await ds.query(`CREATE INDEX IF NOT EXISTS idx_parties_case ON "${schemaName}".parties(case_file_id)`);
  await ds.query(`CREATE INDEX IF NOT EXISTS idx_service_records_case ON "${schemaName}".service_records(case_file_id)`);
  await ds.query(`CREATE INDEX IF NOT EXISTS idx_service_records_status ON "${schemaName}".service_records(status)`);

  // 5. Seed Demo Court (1. Asliye Hukuk Mahkemesi)
  const courtId = '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d';
  await ds.query(`
    INSERT INTO "${schemaName}".courts (id, courthouse_id, name, type, active)
    VALUES ($1, $2, '1. Asliye Hukuk Mahkemesi', 'Asliye Hukuk', true)
    ON CONFLICT (id) DO NOTHING
  `, [courtId, courthouseId]);
  console.log('Seed: Demo Court created');

  // 6. Assign Mudur to Court
  await ds.query(`
    INSERT INTO "${schemaName}".user_courts (user_id, court_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [mudurId, courtId]);
  console.log('Seed: Mudur assigned to Demo Court');

  // 7. Seed Demo Case File
  const caseFileId = 'd5885632-5a54-48aa-a560-4200f0eeb6fc';
  await ds.query(`
    INSERT INTO "${schemaName}".case_files (id, court_id, esas_no, karar_no, karar_tarihi, karar_sonucu, kanun_yolu, durum, aciklama)
    VALUES ($1, $2, '2026/1', '2026/10', '2026-07-01', 'Kabul', 'ISTINAF', 'ACTIVE', 'Örnek dava dosyası açıklaması')
    ON CONFLICT (id) DO NOTHING
  `, [caseFileId, courtId]);
  console.log('Seed: Demo Case File created');

  // 8. Seed Demo Parties (Davacı ve Davalı)
  const plaintiffId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
  const defendantId = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
  await ds.query(`
    INSERT INTO "${schemaName}".parties (id, case_file_id, party_type, role, first_name, last_name, national_id, is_active)
    VALUES ($1, $2, 'PERSON', 'PLAINTIFF', 'Ahmet', 'Yılmaz', '12345678901', true)
    ON CONFLICT (id) DO NOTHING
  `, [plaintiffId, caseFileId]);
  await ds.query(`
    INSERT INTO "${schemaName}".parties (id, case_file_id, party_type, role, first_name, last_name, national_id, is_active)
    VALUES ($1, $2, 'PERSON', 'DEFENDANT', 'Mehmet', 'Kaya', '98765432109', true)
    ON CONFLICT (id) DO NOTHING
  `, [defendantId, caseFileId]);
  console.log('Seed: Demo Parties created');

  await ds.destroy();
}

seed().catch(console.error);
