 backend/src/app.module.ts                          |  2 ++
 .../common/decorators/current-user.decorator.ts    |  4 +++
 backend/src/common/decorators/roles.decorator.ts   |  3 ++
 backend/src/common/guards/jwt-auth.guard.ts        |  5 +++
 backend/src/common/guards/roles.guard.ts           | 18 ++++++++++
 backend/src/modules/auth/auth.controller.ts        | 22 ++++++++++++
 backend/src/modules/auth/auth.module.ts            | 23 +++++++++++++
 backend/src/modules/auth/auth.service.ts           | 40 ++++++++++++++++++++++
 backend/src/modules/auth/dto/login.dto.ts          | 10 ++++++
 backend/src/modules/auth/entities/user.entity.ts   | 21 ++++++++++++
 .../src/modules/auth/strategies/jwt.strategy.ts    | 20 +++++++++++
 11 files changed, 168 insertions(+)

---

diff --git a/backend/src/app.module.ts b/backend/src/app.module.ts
index a6cacef..c143f31 100644
--- a/backend/src/app.module.ts
+++ b/backend/src/app.module.ts
@@ -1,16 +1,18 @@
 import { Module } from '@nestjs/common';
 import { TypeOrmModule } from '@nestjs/typeorm';
 import { AppController } from './app.controller';
+import { AuthModule } from './modules/auth/auth.module';
 
 @Module({
   imports: [
     TypeOrmModule.forRoot({
       type: 'postgres',
       url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
       entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
       synchronize: false,
     }),
+    AuthModule,
   ],
   controllers: [AppController],
 })
 export class AppModule {}
diff --git a/backend/src/common/decorators/current-user.decorator.ts b/backend/src/common/decorators/current-user.decorator.ts
new file mode 100644
index 0000000..8615e5b
--- /dev/null
+++ b/backend/src/common/decorators/current-user.decorator.ts
@@ -0,0 +1,4 @@
+import { createParamDecorator, ExecutionContext } from '@nestjs/common';
+export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
+  return ctx.switchToHttp().getRequest().user;
+});
diff --git a/backend/src/common/decorators/roles.decorator.ts b/backend/src/common/decorators/roles.decorator.ts
new file mode 100644
index 0000000..3e3861f
--- /dev/null
+++ b/backend/src/common/decorators/roles.decorator.ts
@@ -0,0 +1,3 @@
+import { SetMetadata } from '@nestjs/common';
+export const ROLES_KEY = 'roles';
+export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
diff --git a/backend/src/common/guards/jwt-auth.guard.ts b/backend/src/common/guards/jwt-auth.guard.ts
new file mode 100644
index 0000000..2155290
--- /dev/null
+++ b/backend/src/common/guards/jwt-auth.guard.ts
@@ -0,0 +1,5 @@
+import { Injectable } from '@nestjs/common';
+import { AuthGuard } from '@nestjs/passport';
+
+@Injectable()
+export class JwtAuthGuard extends AuthGuard('jwt') {}
diff --git a/backend/src/common/guards/roles.guard.ts b/backend/src/common/guards/roles.guard.ts
new file mode 100644
index 0000000..5d37962
--- /dev/null
+++ b/backend/src/common/guards/roles.guard.ts
@@ -0,0 +1,18 @@
+import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
+import { Reflector } from '@nestjs/core';
+import { ROLES_KEY } from '../decorators/roles.decorator';
+
+@Injectable()
+export class RolesGuard implements CanActivate {
+  constructor(private reflector: Reflector) {}
+
+  canActivate(context: ExecutionContext): boolean {
+    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
+      context.getHandler(),
+      context.getClass(),
+    ]);
+    if (!requiredRoles) return true;
+    const { user } = context.switchToHttp().getRequest();
+    return requiredRoles.includes(user.role);
+  }
+}
diff --git a/backend/src/modules/auth/auth.controller.ts b/backend/src/modules/auth/auth.controller.ts
new file mode 100644
index 0000000..95a4cdb
--- /dev/null
+++ b/backend/src/modules/auth/auth.controller.ts
@@ -0,0 +1,22 @@
+import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
+import { AuthGuard } from '@nestjs/passport';
+import { AuthService } from './auth.service';
+import { LoginDto } from './dto/login.dto';
+
+@Controller('auth')
+export class AuthController {
+  constructor(private authService: AuthService) {}
+
+  @Post('login')
+  async login(@Body() dto: LoginDto) {
+    const result = await this.authService.login(dto);
+    return { success: true, data: result, message: null };
+  }
+
+  @UseGuards(AuthGuard('jwt'))
+  @Get('me')
+  async me(@Req() req: any) {
+    const user = await this.authService.getMe(req.user.id);
+    return { success: true, data: user, message: null };
+  }
+}
diff --git a/backend/src/modules/auth/auth.module.ts b/backend/src/modules/auth/auth.module.ts
new file mode 100644
index 0000000..9a01fd0
--- /dev/null
+++ b/backend/src/modules/auth/auth.module.ts
@@ -0,0 +1,23 @@
+import { Module } from '@nestjs/common';
+import { JwtModule } from '@nestjs/jwt';
+import { PassportModule } from '@nestjs/passport';
+import { TypeOrmModule } from '@nestjs/typeorm';
+import { AuthController } from './auth.controller';
+import { AuthService } from './auth.service';
+import { JwtStrategy } from './strategies/jwt.strategy';
+import { User } from './entities/user.entity';
+
+@Module({
+  imports: [
+    TypeOrmModule.forFeature([User]),
+    PassportModule,
+    JwtModule.register({
+      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
+      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
+    }),
+  ],
+  controllers: [AuthController],
+  providers: [AuthService, JwtStrategy],
+  exports: [AuthService],
+})
+export class AuthModule {}
diff --git a/backend/src/modules/auth/auth.service.ts b/backend/src/modules/auth/auth.service.ts
new file mode 100644
index 0000000..b5761dc
--- /dev/null
+++ b/backend/src/modules/auth/auth.service.ts
@@ -0,0 +1,40 @@
+import { Injectable, UnauthorizedException } from '@nestjs/common';
+import { JwtService } from '@nestjs/jwt';
+import { InjectRepository } from '@nestjs/typeorm';
+import { Repository } from 'typeorm';
+import * as bcrypt from 'bcrypt';
+import { User } from './entities/user.entity';
+import { LoginDto } from './dto/login.dto';
+
+@Injectable()
+export class AuthService {
+  constructor(
+    @InjectRepository(User) private userRepo: Repository<User>,
+    private jwtService: JwtService,
+  ) {}
+
+  async login(dto: LoginDto) {
+    const user = await this.userRepo.findOne({ where: { email: dto.email, active: true } });
+    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');
+
+    const valid = await bcrypt.compare(dto.password, user.password_hash);
+    if (!valid) throw new UnauthorizedException('INVALID_CREDENTIALS');
+
+    const payload = { sub: user.id, email: user.email, role: user.role };
+    return {
+      access_token: this.jwtService.sign(payload),
+      user: { id: user.id, email: user.email, role: user.role, name: user.name },
+    };
+  }
+
+  async getMe(userId: string) {
+    const user = await this.userRepo.findOne({ where: { id: userId } });
+    if (!user) throw new UnauthorizedException();
+    const { password_hash, ...result } = user;
+    return result;
+  }
+
+  async validateUser(payload: { sub: string }) {
+    return this.userRepo.findOne({ where: { id: payload.sub, active: true } });
+  }
+}
diff --git a/backend/src/modules/auth/dto/login.dto.ts b/backend/src/modules/auth/dto/login.dto.ts
new file mode 100644
index 0000000..db75554
--- /dev/null
+++ b/backend/src/modules/auth/dto/login.dto.ts
@@ -0,0 +1,10 @@
+import { IsEmail, IsString, MinLength } from 'class-validator';
+
+export class LoginDto {
+  @IsEmail()
+  email!: string;
+
+  @IsString()
+  @MinLength(6)
+  password!: string;
+}
diff --git a/backend/src/modules/auth/entities/user.entity.ts b/backend/src/modules/auth/entities/user.entity.ts
new file mode 100644
index 0000000..1ff1cf2
--- /dev/null
+++ b/backend/src/modules/auth/entities/user.entity.ts
@@ -0,0 +1,21 @@
+import { Entity, Column, Index } from 'typeorm';
+import { BaseEntity } from '../../../common/entities/base.entity';
+
+@Entity('users', { schema: 'public' })
+export class User extends BaseEntity {
+  @Column({ type: 'varchar', length: 255 })
+  name!: string;
+
+  @Index({ unique: true })
+  @Column({ type: 'varchar', length: 255 })
+  email!: string;
+
+  @Column({ type: 'varchar', length: 255 })
+  password_hash!: string;
+
+  @Column({ type: 'varchar', length: 50 })
+  role!: string;
+
+  @Column({ type: 'boolean', default: true })
+  active!: boolean;
+}
diff --git a/backend/src/modules/auth/strategies/jwt.strategy.ts b/backend/src/modules/auth/strategies/jwt.strategy.ts
new file mode 100644
index 0000000..5b07019
--- /dev/null
+++ b/backend/src/modules/auth/strategies/jwt.strategy.ts
@@ -0,0 +1,20 @@
+import { Injectable, UnauthorizedException } from '@nestjs/common';
+import { PassportStrategy } from '@nestjs/passport';
+import { ExtractJwt, Strategy } from 'passport-jwt';
+import { AuthService } from '../auth.service';
+
+@Injectable()
+export class JwtStrategy extends PassportStrategy(Strategy) {
+  constructor(private authService: AuthService) {
+    super({
+      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
+      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
+    });
+  }
+
+  async validate(payload: { sub: string; email: string; role: string }) {
+    const user = await this.authService.validateUser(payload);
+    if (!user) throw new UnauthorizedException();
+    return { id: payload.sub, email: payload.email, role: payload.role };
+  }
+}
