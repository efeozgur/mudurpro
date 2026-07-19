import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
  });
  await ds.initialize();

  const passwordHash = await bcrypt.hash('admin123', 10);

  await ds.query(`
    INSERT INTO public.users (id, name, email, password_hash, role, active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Super Admin', 'admin@mudurpro.com', $1, 'SUPER_ADMIN', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
  `, [passwordHash]);

  console.log('Seed: super admin kullanıcısı oluşturuldu (admin@mudurpro.com / admin123)');
  await ds.destroy();
}

seed().catch(console.error);
