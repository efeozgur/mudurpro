 backend/package-lock.json                          | 22 +++++++++++++++
 backend/package.json                               |  1 +
 backend/src/app.module.ts                          |  2 ++
 .../modules/courthouse/courthouse.controller.ts    | 31 ++++++++++++++++++++++
 .../src/modules/courthouse/courthouse.module.ts    | 13 +++++++++
 .../src/modules/courthouse/courthouse.service.ts   | 29 ++++++++++++++++++++
 .../courthouse/dto/create-courthouse.dto.ts        | 12 +++++++++
 .../courthouse/dto/update-courthouse.dto.ts        |  9 +++++++
 8 files changed, 119 insertions(+)
diff --git a/backend/src/app.module.ts b/backend/src/app.module.ts
index c143f31..f76f044 100644
--- a/backend/src/app.module.ts
+++ b/backend/src/app.module.ts
@@ -2,6 +2,7 @@ import { Module } from '@nestjs/common';
 import { TypeOrmModule } from '@nestjs/typeorm';
 import { AppController } from './app.controller';
 import { AuthModule } from './modules/auth/auth.module';
+import { CourthouseModule } from './modules/courthouse/courthouse.module';
 
 @Module({
   imports: [
@@ -12,6 +13,7 @@ import { AuthModule } from './modules/auth/auth.module';
       synchronize: false,
     }),
     AuthModule,
+    CourthouseModule,
   ],
   controllers: [AppController],
 })
diff --git a/backend/src/modules/courthouse/courthouse.controller.ts b/backend/src/modules/courthouse/courthouse.controller.ts
new file mode 100644
index 0000000..3ad9af0
--- /dev/null
+++ b/backend/src/modules/courthouse/courthouse.controller.ts
@@ -0,0 +1,31 @@
+import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
+import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
+import { Roles } from '../../common/decorators/roles.decorator';
+import { RolesGuard } from '../../common/guards/roles.guard';
+import { CourthouseService } from './courthouse.service';
+import { CreateCourthouseDto } from './dto/create-courthouse.dto';
+import { UpdateCourthouseDto } from './dto/update-courthouse.dto';
+
+@Controller('courthouses')
+@UseGuards(JwtAuthGuard, RolesGuard)
+export class CourthouseController {
+  constructor(private service: CourthouseService) {}
+
+  @Get()
+  @Roles('SUPER_ADMIN')
+  async findAll() {
+    return { success: true, data: await this.service.findAll(), message: null };
+  }
+
+  @Post()
+  @Roles('SUPER_ADMIN')
+  async create(@Body() dto: CreateCourthouseDto) {
+    return { success: true, data: await this.service.create(dto), message: null };
+  }
+
+  @Put(':id')
+  @Roles('SUPER_ADMIN')
+  async update(@Param('id') id: string, @Body() dto: UpdateCourthouseDto) {
+    return { success: true, data: await this.service.update(id, dto), message: null };
+  }
+}
diff --git a/backend/src/modules/courthouse/courthouse.module.ts b/backend/src/modules/courthouse/courthouse.module.ts
new file mode 100644
index 0000000..99f4034
--- /dev/null
+++ b/backend/src/modules/courthouse/courthouse.module.ts
@@ -0,0 +1,13 @@
+import { Module } from '@nestjs/common';
+import { TypeOrmModule } from '@nestjs/typeorm';
+import { Courthouse } from '../tenant/entities/courthouse.entity';
+import { CourthouseController } from './courthouse.controller';
+import { CourthouseService } from './courthouse.service';
+
+@Module({
+  imports: [TypeOrmModule.forFeature([Courthouse])],
+  controllers: [CourthouseController],
+  providers: [CourthouseService],
+  exports: [CourthouseService],
+})
+export class CourthouseModule {}
diff --git a/backend/src/modules/courthouse/courthouse.service.ts b/backend/src/modules/courthouse/courthouse.service.ts
new file mode 100644
index 0000000..2cf58b9
--- /dev/null
+++ b/backend/src/modules/courthouse/courthouse.service.ts
@@ -0,0 +1,29 @@
+import { Injectable } from '@nestjs/common';
+import { InjectRepository } from '@nestjs/typeorm';
+import { Repository, IsNull } from 'typeorm';
+import { Courthouse } from '../tenant/entities/courthouse.entity';
+import { TenantService } from '../tenant/tenant.service';
+import { CreateCourthouseDto } from './dto/create-courthouse.dto';
+import { UpdateCourthouseDto } from './dto/update-courthouse.dto';
+
+@Injectable()
+export class CourthouseService {
+  constructor(
+    @InjectRepository(Courthouse) private repo: Repository<Courthouse>,
+    private tenantService: TenantService,
+  ) {}
+
+  async findAll() { return this.repo.find({ where: { deleted_at: IsNull() } }); }
+
+  async create(dto: CreateCourthouseDto) {
+    const courthouse = this.repo.create({ ...dto, schema_name: `courthouse_${Date.now()}` });
+    const saved = await this.repo.save(courthouse);
+    await this.tenantService.createTenantSchema(saved.schema_name);
+    return saved;
+  }
+
+  async update(id: string, dto: UpdateCourthouseDto) {
+    await this.repo.update(id, { ...dto, updated_at: new Date() });
+    return this.repo.findOne({ where: { id, deleted_at: IsNull() } });
+  }
+}
diff --git a/backend/src/modules/courthouse/dto/create-courthouse.dto.ts b/backend/src/modules/courthouse/dto/create-courthouse.dto.ts
new file mode 100644
index 0000000..a7c43f2
--- /dev/null
+++ b/backend/src/modules/courthouse/dto/create-courthouse.dto.ts
@@ -0,0 +1,12 @@
+import { IsString, IsOptional, MaxLength } from 'class-validator';
+
+export class CreateCourthouseDto {
+  @IsString()
+  @MaxLength(200)
+  name!: string;
+
+  @IsOptional()
+  @IsString()
+  @MaxLength(100)
+  city?: string;
+}
diff --git a/backend/src/modules/courthouse/dto/update-courthouse.dto.ts b/backend/src/modules/courthouse/dto/update-courthouse.dto.ts
new file mode 100644
index 0000000..da049b5
--- /dev/null
+++ b/backend/src/modules/courthouse/dto/update-courthouse.dto.ts
@@ -0,0 +1,9 @@
+import { PartialType } from '@nestjs/mapped-types';
+import { IsOptional, IsBoolean } from 'class-validator';
+import { CreateCourthouseDto } from './create-courthouse.dto';
+
+export class UpdateCourthouseDto extends PartialType(CreateCourthouseDto) {
+  @IsOptional()
+  @IsBoolean()
+  active?: boolean;
+}
