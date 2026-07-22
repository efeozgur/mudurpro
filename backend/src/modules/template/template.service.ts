import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Template } from './entities/template.entity';
import { User } from '../auth/entities/user.entity';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template) private repo: Repository<Template>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
  ) {}

  async findAll(userId: string, userCourthouseId?: string) {
    const userCourthouse = userCourthouseId
      ? await this.courthouseRepo.findOne({ where: { id: userCourthouseId, deleted_at: IsNull() } })
      : null;

    const userCity = userCourthouse?.city || null;
    const userDistrict = userCourthouse?.district || null;

    const all = await this.repo.find({
      where: { deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });

    const visibleTemplates = all.filter((t) => {
      // Own templates
      if (t.created_by === userId) return true;
      // National
      if (t.visibility === 'NATIONAL') return true;
      // City — same city
      if (t.visibility === 'CITY' && userCity && t.city === userCity) return true;
      // District — same district
      if (t.visibility === 'DISTRICT' && userDistrict && t.district === userDistrict) return true;
      return false;
    });

    const creatorIds = [...new Set(
      visibleTemplates
        .filter((template) => template.visibility !== 'PRIVATE')
        .map((template) => template.created_by),
    )];
    const creators = creatorIds.length
      ? await this.userRepo.find({ where: { id: In(creatorIds) } })
      : [];
    const creatorNames = new Map(creators.map((user) => [user.id, user.name]));

    return visibleTemplates.map((t) => ({
      ...t,
      isOwner: t.created_by === userId,
      creator_name: t.visibility !== 'PRIVATE' && t.created_by !== userId
        ? creatorNames.get(t.created_by) ?? null
        : null,
    }));
  }

  async findById(id: string) {
    const entity = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!entity) throw new NotFoundException('Şablon bulunamadı.');
    return entity;
  }

  async create(dto: CreateTemplateDto, userId: string, userCourthouseId?: string) {
    if (dto.visibility === 'CITY' || dto.visibility === 'DISTRICT') {
      if (!userCourthouseId) {
        throw new BadRequestException('Şablonu il/ilçe kapsamında paylaşmak için bir adliyeye bağlı olmalısınız.');
      }
    }

    let city: string | null = null;
    let district: string | null = null;

    if (userCourthouseId) {
      const courthouse = await this.courthouseRepo.findOne({ where: { id: userCourthouseId, deleted_at: IsNull() } });
      if (courthouse) {
        city = courthouse.city || null;
        district = courthouse.district || null;
      }
    }

    const entity = this.repo.create({
      title: dto.title,
      content: dto.content,
      category: dto.category,
      visibility: dto.visibility || 'PRIVATE',
      created_by: userId,
      courthouse_id: userCourthouseId || null,
      city,
      district,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateTemplateDto, userId: string) {
    const entity = await this.findById(id);
    if (entity.created_by !== userId) {
      throw new ForbiddenException('Yalnızca kendi şablonlarınızı düzenleyebilirsiniz.');
    }
    Object.assign(entity, dto, { updated_at: new Date() });
    return this.repo.save(entity);
  }

  async remove(id: string, userId: string) {
    const entity = await this.findById(id);
    if (entity.created_by !== userId) {
      throw new ForbiddenException('Yalnızca kendi şablonlarınızı silebilirsiniz.');
    }
    entity.deleted_at = new Date();
    return this.repo.save(entity);
  }
}
