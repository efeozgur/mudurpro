import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';

@Injectable()
export class SystemSettingService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting) private repo: Repository<SystemSetting>,
  ) {}

  private cache = new Map<string, string>();

  async onModuleInit() {
    await this.ensureDefaults();
  }

  private async ensureDefaults() {
    const defaults: Array<{ key: string; value: string; description: string }> = [
      {
        key: 'admin_scope',
        value: 'city_only',
        description: 'ADLIYE_ADMIN yetki kapsamı: city_only (sadece il), city_and_districts (il ve ilçeler)',
      },
    ];
    for (const d of defaults) {
      const existing = await this.repo.findOne({ where: { key: d.key } });
      if (!existing) {
        await this.repo.save(this.repo.create(d));
      }
    }
  }

  async get(key: string): Promise<string> {
    if (this.cache.has(key)) return this.cache.get(key)!;
    const setting = await this.repo.findOne({ where: { key } });
    const value = setting?.value || '';
    this.cache.set(key, value);
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    let setting = await this.repo.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
    } else {
      setting = this.repo.create({ key, value });
    }
    await this.repo.save(setting);
    this.cache.set(key, value);
  }

  async getAll(): Promise<SystemSetting[]> {
    return this.repo.find();
  }
}
