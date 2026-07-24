import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppVersion } from './entities/app-version.entity';
import { AppVersionChange } from './entities/app-version-change.entity';
import { readFileSync } from 'fs';
import { join } from 'path';


@Injectable()
export class VersionService implements OnModuleInit {
  constructor(@InjectRepository(AppVersion) private readonly versions: Repository<AppVersion>, @InjectRepository(AppVersionChange) private readonly changes: Repository<AppVersionChange>) {}
  async onModuleInit() {
    const file = join(process.cwd(), 'src/modules/version/version-history.json');
    const releases: Array<{ version: string; releaseDate: string; summary: string; commitHash: string; current: boolean; changes: string[] }> = JSON.parse(readFileSync(file, 'utf8'));
    for (const release of releases) {
      let version = await this.versions.findOne({ where: { version: release.version } });
      version = await this.versions.save(this.versions.create({ ...(version || {}), version: release.version, release_date: release.releaseDate, summary: release.summary, commit_hash: release.commitHash, is_current: release.current }));
      for (const [sort_order, description] of release.changes.entries()) {
        const existing = await this.changes.findOne({ where: { version_id: version.id, sort_order } });
        await this.changes.save(this.changes.create({ ...(existing || {}), version_id: version.id, description, sort_order }));
      }
    }
    await this.versions.createQueryBuilder().update().set({ is_current: false }).where('version NOT IN (:...versions)', { versions: releases.filter((release) => release.current).map((release) => release.version) }).execute();
  }
  async findAll() {
    const versions = await this.versions.find({ relations: { changes: true } });
    return versions.sort((a, b) => {
      const parse = (value: string) => value.replace(/^v/i, '').split('.').map(Number);
      const av = parse(a.version);
      const bv = parse(b.version);
      for (let i = 0; i < Math.max(av.length, bv.length); i += 1) {
        if ((bv[i] || 0) !== (av[i] || 0)) return (bv[i] || 0) - (av[i] || 0);
      }
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
    });
  }
}
