import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppVersion } from './entities/app-version.entity';
import { AppVersionChange } from './entities/app-version-change.entity';

const releases = [
  { version: 'v1.0.0', date: '2026-07-19', summary: 'İlk çalışan temel sürüm.', hash: '1410dfc', changes: ['Docker, NestJS, React, PostgreSQL ve TypeORM altyapısı.', 'JWT giriş, roller ve tenant yapısı.', 'Dosya, taraf, tebligat, kanun yolu ve dashboard modülleri.'] },
  { version: 'v1.1.0', date: '2026-07-19', summary: 'Kurumsal arayüz sürümü.', hash: '022e5b1', changes: ['Premium kurumsal arayüz tasarımı.', 'Dashboard, dosya listesi ve dosya detay ekranları.', 'Kritik süre, ücret ve taraf form iyileştirmeleri.'] },
  { version: 'v1.2.0', date: '2026-07-22', summary: 'Müdür ve şablon yönetimi.', hash: 'fe0555d', changes: ['Katip yetkileri ve müdür-katip atamaları.', 'Şablon oluşturma, önizleme ve içerik arama.', 'İl, ilçe ve Türkiye genelinde şablon paylaşımı.'] },
  { version: 'v1.3.0', date: '2026-07-23', summary: 'Bildirim ve arama sistemi.', hash: '03ed092', changes: ['Kritik süre ve kanun yolu bildirimleri.', 'Okunmuş ve tamamlanmış bildirim yönetimi.', 'Tekrarlanan bildirimlerin engellenmesi.'] },
  { version: 'v1.4.0', date: '2026-07-24', summary: 'Dosya iş akışı ve kesinleşme.', hash: 'eb2c6fe', changes: ['Kesinleşme tarihinin taraf tebligatlarına göre hesaplanması.', 'Kritik sürelerde yapılacak işlem bilgisinin gösterilmesi.', 'Kanun yolu ile başvuru türünün eşleştirilmesi.'] },
];

@Injectable()
export class VersionService implements OnModuleInit {
  constructor(@InjectRepository(AppVersion) private readonly versions: Repository<AppVersion>, @InjectRepository(AppVersionChange) private readonly changes: Repository<AppVersionChange>) {}
  async onModuleInit() {
    if (await this.versions.count() > 0) return;
    for (const release of releases) {
      const version = await this.versions.save(this.versions.create({ version: release.version, release_date: release.date, summary: release.summary, commit_hash: release.hash, is_current: release.version === 'v1.4.0' }));
      await this.changes.save(release.changes.map((description, sort_order) => this.changes.create({ version_id: version.id, description, sort_order })));
    }
  }
  findAll() { return this.versions.find({ relations: { changes: true }, order: { release_date: 'DESC' } }); }
}
