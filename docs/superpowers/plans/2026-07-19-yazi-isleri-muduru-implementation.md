# Yazı İşleri Müdürü Süre Takip Sistemi - Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adliyelerdeki Yazı İşleri Müdürleri için çok kullanıcılı (multi-tenant) süre takip sistemi geliştirmek

**Architecture:** Modüler monolit NestJS backend + React frontend + PostgreSQL (adliye-bazlı tenant şema izolasyonu). Backend'de tüm iş kuralları servis katmanında, UI hiçbir iş kuralı içermez.

**Tech Stack:** Docker, NestJS + TypeScript, React + Vite + Tailwind CSS + shadcn/ui, PostgreSQL 16+, TanStack Query, React Hook Form + Zod, pgadmin

## Global Constraints

- İngilizce tablo/field adları: `courthouses`, `case_files`, `service_records` vb.
- UUID birincil anahtar, snake_case
- Soft Delete (`deleted_at`), ON DELETE RESTRICT (cascade yok)
- `/api/v1/` prefix, `{ success, data, message }` yanıt formatı
- JWT auth, mahkeme bazlı yetkilendirme (dosya bazlı değil)
- Sistem kullanıcı yerine karar vermez — sadece hesaplar/uyarır/önerir
- Tüm kritik işlemler Audit Log'a yazılır
- PostgreSQL 16+, UTF-8, UTC timestamptz
- Her modül için test yazılacak

## File Structure Map

```
backend/
  src/
    main.ts                          # NestJS bootstrap
    app.module.ts
    common/
      decorators/
        tenant.decorator.ts
        roles.decorator.ts
        current-user.decorator.ts
      guards/
        jwt-auth.guard.ts
        roles.guard.ts
        tenant.guard.ts
      interceptors/
        tenant.interceptor.ts
        audit-log.interceptor.ts
        response-transform.interceptor.ts
      filters/
        http-exception.filter.ts
      pipes/
        uuid-validation.pipe.ts
    modules/
      auth/
        auth.module.ts, auth.controller.ts, auth.service.ts
        dto/ login.dto.ts, refresh.dto.ts
        strategies/ jwt.strategy.ts
      tenant/
        tenant.module.ts, tenant.service.ts
      courthouse/
        courthouse.module.ts, courthouse.controller.ts, courthouse.service.ts
        entities/ courthouse.entity.ts
        dto/ create-courthouse.dto.ts, update-courthouse.dto.ts
      court/
        court.module.ts, court.controller.ts, court.service.ts
        entities/ court.entity.ts
        dto/ create-court.dto.ts, update-court.dto.ts
      user/
        user.module.ts, user.controller.ts, user.service.ts
        entities/ user.entity.ts
        dto/ create-user.dto.ts, update-user.dto.ts
      user-court/
        user-court.module.ts, user-court.controller.ts, user-court.service.ts
        entities/ user-court.entity.ts
        dto/ assign-court.dto.ts
      case-file/
        case-file.module.ts, case-file.controller.ts, case-file.service.ts
        entities/ case-file.entity.ts
        dto/ create-case-file.dto.ts, update-case-file.dto.ts
      party/
        party.module.ts, party.controller.ts, party.service.ts
        entities/ party.entity.ts
        dto/ create-party.dto.ts, update-party.dto.ts
      service-record/
        service-record.module.ts, service-record.controller.ts, service-record.service.ts
        entities/ service-record.entity.ts
        dto/ create-service-record.dto.ts
      appeal/
        appeal.module.ts, appeal.controller.ts, appeal.service.ts
        entities/ appeal.entity.ts
        dto/ create-appeal.dto.ts
      fee-tracking/
        fee-tracking.module.ts, fee-tracking.controller.ts, fee-tracking.service.ts
        entities/ fee-tracking.entity.ts
        dto/ create-fee.dto.ts
      sure-engine/
        sure-engine.module.ts, sure-engine.service.ts
      notification/
        notification.module.ts, notification.controller.ts, notification.service.ts
        entities/ notification.entity.ts
      audit-log/
        audit-log.module.ts, audit-log.controller.ts, audit-log.service.ts
        entities/ audit-log.entity.ts
      dashboard/
        dashboard.module.ts, dashboard.controller.ts, dashboard.service.ts
    database/
      migrations/                    # TypeORM migration files
      data-source.ts
  test/
    app.e2e-spec.ts
  package.json, tsconfig.json, nest-cli.json

frontend/
  src/
    main.tsx                         # Vite entry
    App.tsx                          # Router + QueryClient
    lib/
      api-client.ts                  # Axios instance with JWT interceptor
      utils.ts
    hooks/
      use-auth.ts
      use-cases.ts, use-parties.ts, use-services.ts ...
    components/
      ui/                            # shadcn/ui components
      layout/
        sidebar.tsx, header.tsx, app-layout.tsx
      shared/
        status-badge.tsx, priority-badge.tsx, data-table.tsx
        empty-state.tsx, confirm-dialog.tsx, loading-spinner.tsx
      dashboard/
        stats-card.tsx, critical-table.tsx, suggestion-box.tsx
      case-file/
        case-file-list.tsx, case-file-form.tsx, case-file-detail.tsx
        case-file-timeline.tsx
      party/
        party-list.tsx, party-form.tsx, party-detail.tsx
      service-record/
        service-list.tsx, service-form.tsx, service-history.tsx
      appeal/
        appeal-list.tsx, appeal-form.tsx
      fee-tracking/
        fee-list.tsx, fee-form.tsx
      notification/
        notification-center.tsx, notification-bell.tsx
      audit-log/
        audit-log-viewer.tsx
    pages/
      login.tsx
      dashboard.tsx
      cases.tsx, case-detail.tsx
      courthouse-management.tsx
      court-management.tsx
      user-management.tsx
      settings.tsx
  package.json, vite.config.ts, tailwind.config.ts, tsconfig.json

docker/
  Dockerfile.backend
  Dockerfile.frontend
  docker-compose.yml
  nginx.conf

docs/
  superpowers/
    specs/
    plans/
```

---

# Phase 1: Project Foundation

### Task 1.1: Docker Compose Infrastructure

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/Dockerfile.backend`
- Create: `docker/Dockerfile.frontend`
- Create: `docker/nginx.conf`

**Interfaces:**
- Produces: Docker services `db` (port 5432), `app` (port 3000), `web` (port 80), `pgadmin` (port 5050)

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mudurpro
      POSTGRES_USER: mudurpro
      POSTGRES_PASSWORD: mudurpro_secret
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mudurpro"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@mudurpro.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - db

  app:
    build:
      context: ../backend
      dockerfile: ../docker/Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://mudurpro:mudurpro_secret@db:5432/mudurpro
      JWT_SECRET: change-me-in-production
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ../backend/src:/app/src

  web:
    build:
      context: ../frontend
      dockerfile: ../docker/Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - app

volumes:
  pgdata:
```

- [ ] **Step 2: Create Dockerfile.backend**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

- [ ] **Step 3: Create Dockerfile.frontend** (multi-stage)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 4: Create nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 5: Verify** — Run `docker-compose up -d` from `docker/` directory, verify all 4 services start without errors.

- [ ] **Step 6: Commit**

```bash
git add docker/
git commit -m "feat: add Docker Compose infrastructure (db, app, web, pgadmin)"
```

---

### Task 1.2: NestJS Backend Scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/nest-cli.json`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`

**Interfaces:**
- Produces: `/api/v1/health` endpoint returning `{ success: true, data: { status: "ok" } }`

- [ ] **Step 1: Create backend/package.json**

```json
{
  "name": "mudurpro-backend",
  "version": "0.1.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/typeorm": "^10.0.1",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.19",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/uuid": "^9.0.7",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 3: Create backend/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [ ] **Step 4: Create backend/src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
```

- [ ] **Step 5: Create backend/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { getEnvConfig } from './env.config';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 6: Create backend/.env**

```
DATABASE_URL=postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=8h
```

- [ ] **Step 7: Install and verify** — Run `npm install` then `npm run start:dev` — verify app boots on port 3000.

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: scaffold NestJS backend with global prefix /api/v1"
```

---

### Task 1.3: React Frontend Scaffold

**Files:**
- Create: `frontend/package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`
- Create: `frontend/src/main.tsx`, `App.tsx`
- Create: `frontend/src/lib/api-client.ts`

**Interfaces:**
- Produces: Working React app at `/` with shadcn/ui button component

- [ ] **Step 1: Scaffold via Vite** — Run:

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install tailwindcss @tailwindcss/vite @tanstack/react-query react-hook-form zod @hookform/resolvers react-router-dom axios lucide-react
npm install -D @types/node
```

- [ ] **Step 3: Install shadcn/ui** — Run `npx shadcn@latest init` and accept defaults. Then:

```bash
npx shadcn@latest add button input card table badge dialog dropdown-menu form select calendar popover tabs toast separator sheet avatar tooltip
```

- [ ] **Step 4: Create frontend/src/lib/api-client.ts**

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

- [ ] **Step 5: Setup App.tsx with React Router + QueryClient**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 6: Verify** — Run `npm run dev`, open `http://localhost:5173/login`, confirm blank page loads without errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React frontend with Vite, Tailwind, shadcn/ui, TanStack Query"
```

---

### Task 1.4: TypeORM Database Connection & Base Entity

**Files:**
- Create: `backend/src/database/data-source.ts`
- Create: `backend/src/common/entities/base.entity.ts`
- Create: `backend/src/env.config.ts`

**Interfaces:**
- Produces: `BaseEntity` abstract class (id UUID, created_at, updated_at, deleted_at, created_by, updated_by)

- [ ] **Step 1: Create env.config.ts**

```typescript
export function getEnvConfig() {
  return {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },
  };
}
```

- [ ] **Step 2: Create base.entity.ts**

```typescript
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string | null;
}
```

- [ ] **Step 3: Create data-source.ts**

```typescript
import { DataSource } from 'typeorm';
import { getEnvConfig } from '../env.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: getEnvConfig().database.url,
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
```

- [ ] **Step 4: Create initial migration** — Run:

```bash
cd backend
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:create src/database/migrations/InitialSchema
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/common/entities/ backend/src/database/ backend/src/env.config.ts
git commit -m "feat: add TypeORM setup with BaseEntity (UUID, soft delete, timestamps)"
```

---

# Phase 2: Auth & Multi-Tenancy Core

### Task 2.1: Auth Module (Login, JWT, Roles)

**Files:**
- Create: `backend/src/modules/auth/auth.module.ts`
- Create: `backend/src/modules/auth/auth.controller.ts`
- Create: `backend/src/modules/auth/auth.service.ts`
- Create: `backend/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/modules/auth/dto/login.dto.ts`
- Create: `backend/src/modules/auth/dto/login-response.dto.ts`
- Create: `backend/src/modules/auth/entities/user.entity.ts` (public schema)
- Create: `backend/src/common/guards/jwt-auth.guard.ts`
- Create: `backend/src/common/guards/roles.guard.ts`
- Create: `backend/src/common/decorators/roles.decorator.ts`
- Create: `backend/src/common/decorators/current-user.decorator.ts`

**Interfaces:**
- Consumes: `BaseEntity`
- Produces: `POST /api/v1/auth/login` → `{ success: true, data: { access_token, user: { id, email, role, name } } }`, `GET /api/v1/auth/me`, `@Roles()` decorator

- [ ] **Step 1: Create user.entity.ts**

```typescript
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users', { schema: 'public' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 50 })
  role: string; // SUPER_ADMIN | ADLIYE_ADMIN | MUDUR

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
```

- [ ] **Step 2: Create login.dto.ts**

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

- [ ] **Step 3: Create auth.service.ts**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email, active: true } });
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password_hash, ...result } = user;
    return result;
  }

  async validateUser(payload: { sub: string }) {
    return this.userRepo.findOne({ where: { id: payload.sub, active: true } });
  }
}
```

- [ ] **Step 4: Create jwt.strategy.ts**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.authService.validateUser(payload);
    if (!user) throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

- [ ] **Step 5: Create auth.controller.ts**

```typescript
import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return { success: true, data: result, message: null };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.authService.getMe(req.user.id);
    return { success: true, data: user, message: null };
  }
}
```

- [ ] **Step 6: Create auth.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 7: Create roles.decorator.ts**, **roles.guard.ts**

```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

- [ ] **Step 8: Create current-user.decorator.ts**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user;
});
```

- [ ] **Step 9: Update app.module.ts to import AuthModule and TypeOrmModule**

- [ ] **Step 10: Write test** — `POST /api/v1/auth/login` with valid credentials returns 200 with token.

- [ ] **Step 11: Commit**

```bash
git add backend/src/modules/auth/ backend/src/common/
git commit -m "feat: add Auth module with JWT login, roles guard, current-user decorator"
```

---

### Task 2.2: Tenant Service & Schema Creation

**Files:**
- Create: `backend/src/modules/tenant/tenant.module.ts`
- Create: `backend/src/modules/tenant/tenant.service.ts`
- Create: `backend/src/modules/tenant/entities/courthouse.entity.ts` (public schema)
- Create: `backend/src/common/interceptors/tenant.interceptor.ts`

**Interfaces:**
- Consumes: `User` entity, `BaseEntity`
- Produces: `TenantService.createTenantSchema(schemaName)` — creates PostgreSQL schema + all tenant tables programmatically

- [ ] **Step 1: Create courthouse.entity.ts** (public schema)

```typescript
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('courthouses', { schema: 'public' })
export class Courthouse extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  schema_name: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
```

- [ ] **Step 2: Create tenant.service.ts** — core method:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../database/data-source';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  async createTenantSchema(schemaName: string): Promise<void> {
    const ds = AppDataSource;
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
```

- [ ] **Step 3: Create tenant.module.ts** — export TenantService as global

```typescript
import { Global, Module } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Global()
@Module({
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
```

- [ ] **Step 4: Create tenant.interceptor.ts** — dynamically set search_path for each request

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Courthouse } from '../../modules/tenant/entities/courthouse.entity';
import { AppDataSource } from '../../database/data-source';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Courthouse) private courthouseRepo: Repository<Courthouse>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip tenant routing for super_admin on public schema routes
    if (!user || user.role === 'SUPER_ADMIN' && request.path.startsWith('/api/v1/courthouses')) {
      return next.handle();
    }

    if (!user || !user.role) {
      return next.handle();
    }

    if (user.courthouseId) {
      const courthouse = await this.courthouseRepo.findOne({ where: { id: user.courthouseId, active: true } });
      if (!courthouse) throw new ForbiddenException('TENANT_NOT_FOUND');
      const ds = AppDataSource;
      await ds.query(`SET search_path TO "${courthouse.schema_name}", public`);
    }

    return next.handle();
  }
}
```

- [ ] **Step 5: Write test** — call `TenantService.createTenantSchema('tenant_test_01')`, verify schema+12 tables+indexes exist in PostgreSQL.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/tenant/ backend/src/common/interceptors/
git commit -m "feat: add TenantService for dynamic schema creation + TenantInterceptor"
```

---

# Phase 3: Core Domain Modules

### Task 3.1: Super Admin — Adliye (Courthouse) CRUD

**Files:**
- Create: `backend/src/modules/courthouse/courthouse.module.ts`, `.controller.ts`, `.service.ts`
- Create: `backend/src/modules/courthouse/dto/create-courthouse.dto.ts`, `update-courthouse.dto.ts`

**Interfaces:**
- Produces: `GET/POST/PUT /api/v1/courthouses` (Super Admin only). `POST` triggers `TenantService.createTenantSchema()`
- Consumes: `TenantService`, `Courthouse` entity

- [ ] **Step 1: Create create-courthouse.dto.ts**

```typescript
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCourthouseDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
}
```

- [ ] **Step 2: Create courthouse.service.ts**

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Courthouse } from '../tenant/entities/courthouse.entity';
import { TenantService } from '../tenant/tenant.service';
import { CreateCourthouseDto } from './dto/create-courthouse.dto';
import { UpdateCourthouseDto } from './dto/update-courthouse.dto';

@Injectable()
export class CourthouseService {
  constructor(
    @InjectRepository(Courthouse) private repo: Repository<Courthouse>,
    private tenantService: TenantService,
  ) {}

  async findAll() { return this.repo.find({ where: { deleted_at: null } }); }

  async create(dto: CreateCourthouseDto) {
    const courthouse = this.repo.create({
      ...dto,
      schema_name: `courthouse_${Date.now()}`,
    });
    const saved = await this.repo.save(courthouse);
    await this.tenantService.createTenantSchema(saved.schema_name);
    return saved;
  }

  async update(id: string, dto: UpdateCourthouseDto) {
    await this.repo.update(id, { ...dto, updated_at: new Date() });
    return this.repo.findOne({ where: { id, deleted_at: null } });
  }
}
```

- [ ] **Step 3: Create courthouse.controller.ts**

```typescript
import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourthouseService } from './courthouse.service';
import { CreateCourthouseDto } from './dto/create-courthouse.dto';
import { UpdateCourthouseDto } from './dto/update-courthouse.dto';

@Controller('courthouses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CourthouseController {
  constructor(private service: CourthouseService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  async findAll() {
    return { success: true, data: await this.service.findAll(), message: null };
  }

  @Post()
  @Roles('SUPER_ADMIN')
  async create(@Body() dto: CreateCourthouseDto) {
    return { success: true, data: await this.service.create(dto), message: null };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateCourthouseDto) {
    return { success: true, data: await this.service.update(id, dto), message: null };
  }
}
```

- [ ] **Step 4: Write test** — `POST /api/v1/courthouses` with Super Admin token creates adliye + generates tenant schema in PostgreSQL.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/courthouse/
git commit -m "feat: add Courthouse CRUD with auto tenant schema creation"
```

---

### Task 3.2: Mahkeme (Court) ve Müdür Atama Yönetimi

**Files:**
- Create: `backend/src/modules/court/court.module.ts`, `.controller.ts`, `.service.ts`, dto/ + entities/
- Create: `backend/src/modules/user-court/user-court.module.ts`, `.controller.ts`, `.service.ts`, dto/

**Interfaces:**
- Produces: `GET/POST/PUT /api/v1/courts`, `POST /api/v1/courts/:id/assign-mudur`, `DELETE /api/v1/courts/:id/assign-mudur`

- [ ] **Step 1: Create court.entity.ts** (tenant schema)

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('courts')
export class Court extends BaseEntity {
  @Column('uuid') courthouse_id: string;
  @Column('varchar') name: string;
  @Column('varchar', { nullable: true }) type: string;
  @Column('boolean', { default: true }) active: boolean;
}
```

- [ ] **Step 2: Create court.service.ts** with full CRUD + `assignMudur(courtId, userId)` and `removeMudur(courtId, userId)` methods.

- [ ] **Step 3: Write tests** — Verify Adliye Admin can create/update courts, assign/remove mudur. Verify müdür can only see assigned courts.

- [ ] **Step 4: Commit**

---

### Task 3.3: Dosya (CaseFile) Yönetimi

**Files:**
- Create: `backend/src/modules/case-file/` (module, controller, service, entity, dto)

**Interfaces:**
- Produces: `GET/POST/PUT /api/v1/cases`, `PATCH /api/v1/cases/:id/archive`, `PATCH /api/v1/cases/:id/restore`, `GET /api/v1/cases/:id/timeline`

- [ ] **Step 1: Create case-file.entity.ts**

```typescript
import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('case_files')
@Unique(['court_id', 'esas_no'])
export class CaseFile extends BaseEntity {
  @Column('uuid') court_id: string;
  @Column('varchar') esas_no: string;
  @Column('varchar', { nullable: true }) karar_no: string;
  @Column('date', { nullable: true }) karar_tarihi: Date;
  @Column('varchar', { nullable: true }) karar_sonucu: string;
  @Column('varchar', { nullable: true }) kanun_yolu: string;
  @Column('varchar', { default: 'ACTIVE' }) durum: string;
  @Column('text', { nullable: true }) aciklama: string;
}
```

- [ ] **Step 2: Implement validation** — DV-001 (same court+esas_no → conflict), DV-002 (karar_tarihi validation), DV-003 (archived → no updates), DV-005 (required fields).

- [ ] **Step 3: Write tests** — all 4 test scenarios from Bölüm 06.

- [ ] **Step 4: Commit**

---

### Task 3.4: Taraf (Party) Yönetimi

**Files:**
- Create: `backend/src/modules/party/` (module, controller, service, entity, dto)

**Interfaces:**
- Produces: `GET/POST/PUT /api/v1/cases/:id/parties`, `PATCH /api/v1/parties/:id/deactivate`, `PATCH /api/v1/parties/:id/reactivate`

- [ ] **Step 1: Create party.entity.ts** per Bölüm 07 spec (all fields including `party_type`, `role`, `is_active`, `removal_reason`).

- [ ] **Step 2: Implement validations** — PV-001 through PV-012: required fields per type, TC Kimlik 11-digit check, email format, duplicate warning (not error), role change blocked if active appeal, deactivation requires reason.

- [ ] **Step 3: Implement duplicate detection** — normalize name, check same file for matching name/national_id/tax_number, return warning not error.

- [ ] **Step 4: Write tests** — all 8 test scenarios from Bölüm 07.

- [ ] **Step 5: Commit**

---

# Phase 4: Legal Workflow Modules

### Task 4.1: Tebligat (ServiceRecord) Modülü

**Files:**
- Create: `backend/src/modules/service-record/` (module, controller, service, entity, dto)

**Interfaces:**
- Produces: `GET /api/v1/cases/:id/services`, `POST /api/v1/services`, `PUT /api/v1/services/:id`, `PATCH /api/v1/services/:id/status`
- Triggers: `SureEngineService.calculate(dosyaId)` on status change to SERVED

- [ ] **Step 1: Create service-record.entity.ts** — status enum: DRAFT, PREPARED, SENT, SERVED, RETURNED, CANCELLED

- [ ] **Step 2: Implement rules** — TB-001 through TB-006: served_date not before sent_date, RETURNED cannot have served_date, archived file check, passive party check.

- [ ] **Step 3: Integrate with SureEngine** — when status changes to SERVED, emit event/trigger `SureEngineService.calculateSures(dosyaId)`.

- [ ] **Step 4: Write tests** — 4 scenarios from Bölüm 08.

- [ ] **Step 5: Commit**

---

### Task 4.2: Kanun Yolu (Appeal) Modülü

**Files:**
- Create: `backend/src/modules/appeal/` (module, controller, service, entity, dto)

**Interfaces:**
- Produces: `GET /api/v1/cases/:id/appeals`, `POST /api/v1/appeals`, `PUT /api/v1/appeals/:id`
- After creation: auto-identifies opposing parties, triggers notification

- [ ] **Step 1: Create appeal.entity.ts** — type ISTINAF/TEMYIZ, status CREATED/WAITING_FOR_SERVICE/WAITING_LEGAL_PERIOD/READY_FOR_TRANSFER/TRANSFER_COMPLETED

- [ ] **Step 2: Implement karşı taraf logic** — if applicant is PLAINTIFF, opposing = all active DEFENDANTs; if applicant is DEFENDANT, opposing = all active PLAINTIFFs (per BR-040).

- [ ] **Step 3: Validate** — KV-001 through KV-004: application_date >= karar_tarihi, applicant in file, opposing parties exist, archived file check.

- [ ] **Step 4: Write tests** — 4 scenarios from Bölüm 11.

- [ ] **Step 5: Commit**

---

### Task 4.3: Harç (FeeTracking) Modülü

**Files:**
- Create: `backend/src/modules/fee-tracking/` (module, controller, service, entity, dto)

**Interfaces:**
- Produces: `GET /api/v1/cases/:id/fees`, `POST /api/v1/fees`, `PUT /api/v1/fees/:id`, `PATCH /api/v1/fees/:id/payment`

- [ ] **Step 1: Create fee-tracking.entity.ts** — CHECK amount > 0, status: CREATED/WAITING_FOR_SERVICE/WAITING_PAYMENT/PAYMENT_COMPLETED/MUZEKKERE_REQUIRED/CLOSED

- [ ] **Step 2: Implement fee workflow** — served_date triggers 1-month payment period, after expiry → 15-day muzekkere period → MUZEKKERE_REQUIRED suggestion.

- [ ] **Step 3: Validations** — HV-001 through HV-005.

- [ ] **Step 4: Write tests** — 4 scenarios from Bölüm 12.

- [ ] **Step 5: Commit**

---

# Phase 5: Engine Services

### Task 5.1: Süre Hesaplama Motoru (SureEngine)

**Files:**
- Create: `backend/src/modules/sure-engine/sure-engine.module.ts`
- Create: `backend/src/modules/sure-engine/sure-engine.service.ts`

**Interfaces:**
- Consumes: ServiceRecord, Appeal, FeeTracking, CaseFile entities
- Produces: `calculateSures(dosyaId)` → updates calculated deadlines, `getKritikSures()` → returns urgent items for dashboard

- [ ] **Step 1: Implement calculateSures** — key algorithms:

```typescript
// Pseudocode for the core engine
async calculateSures(caseFileId: string) {
  const caseFile = await this.caseFileRepo.findOne({ where: { id: caseFileId } });
  const parties = await this.partyRepo.find({ where: { case_file_id: caseFileId, is_active: true } });
  const services = await this.serviceRepo.find({ where: { case_file_id: caseFileId } });

  // Rule SM-001: Only SERVED records count
  const servedServices = services.filter(s => s.status === 'SERVED');

  // Rule BR-020/BR-021: Start from latest served date
  const servedDates = servedServices.map(s => s.served_date).filter(d => d !== null);
  if (servedDates.length === 0) return { status: 'NO_SERVED_DATES' };

  const lastServedDate = new Date(Math.max(...servedDates.map(d => d.getTime())));

  // All parties served?
  const partyIds = parties.map(p => p.id);
  const servedPartyIds = servedServices.map(s => s.party_id);
  const allServed = partyIds.every(id => servedPartyIds.includes(id));

  if (!allServed) return { status: 'PENDING_SERVICES' };

  // Check for appeals
  const appeals = await this.appealRepo.find({ where: { case_file_id: caseFileId, deleted_at: null } });

  if (appeals.length === 0) {
    // Kesinleşme: 14 days from last served date
    const finalizationDate = addDays(lastServedDate, 14);
    const remaining = daysBetween(new Date(), finalizationDate);

    if (remaining <= 0) {
      return { status: 'READY_FOR_FINALIZATION', finalizationDate };
    }
    return { status: 'WAITING_LEGAL_PERIOD', finalizationDate, remaining };
  }

  // Appeal in progress: check opposing parties all served
  for (const appeal of appeals) {
    const applicant = await this.partyRepo.findOne({ where: { id: appeal.applicant_party_id } });
    const opposingParties = parties.filter(p => p.role !== applicant.role && p.is_active);
    const opposingServed = opposingParties.every(op =>
      servedServices.some(s => s.party_id === op.id)
    );

    if (opposingServed) {
      const transferDate = addDays(lastServedDate, 14);
      const remaining = daysBetween(new Date(), transferDate);
      if (remaining <= 0) {
        return { status: 'READY_FOR_APPEAL_TRANSFER', appealId: appeal.id };
      }
      return { status: 'WAITING_LEGAL_PERIOD', appealId: appeal.id, remaining };
    }
  }

  return { status: 'WAITING_FOR_SERVICE' };
}
```

- [ ] **Step 2: Implement urgency level calculation** — per BR-070/BR-071 and spec (0 days: past/red, 1-3: critical/red, 4-7: approaching/amber, 8-14: tracking/yellow, 15+: normal/green).

- [ ] **Step 3: Write comprehensive tests** — scenarios from Bölüm 02 + Bölüm 09: single plaintiff/defendant, 8 defendants, returned service, appeal only shows opposing parties.

- [ ] **Step 4: Commit**

---

### Task 5.2: Bildirim Motoru (Notification Engine)

**Files:**
- Create: `backend/src/modules/notification/notification.module.ts`, `.controller.ts`, `.service.ts`, entity, dto

**Interfaces:**
- Consumes: SureEngine results
- Produces: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/:id/complete`

- [ ] **Step 1: Create notification.entity.ts** — type INFO/WARNING/CRITICAL/SUCCESS/SYSTEM, priority P1-P4, status CREATED/UNREAD/READ/COMPLETED/ARCHIVED

- [ ] **Step 2: Implement idempotent notification production** — check existing notification for same event type + file + user before creating new one (BM-002).

- [ ] **Step 3: Implement notification types** per Bölüm 13: deadline started, deadline approaching, deadline exceeded, ready for finalization, ready for appeal transfer, fee payment due, fee muzekkere required, service returned, missing data.

- [ ] **Step 4: Write tests** — 4 scenarios from Bölüm 13.

- [ ] **Step 5: Commit**

---

### Task 5.3: Audit Log Module

**Files:**
- Create: `backend/src/modules/audit-log/audit-log.module.ts`, `.controller.ts`, `.service.ts`, entity
- Create: `backend/src/common/interceptors/audit-log.interceptor.ts`

**Interfaces:**
- Produces: `GET /api/v1/audit`, `GET /api/v1/cases/:id/audit`, `GET /api/v1/cases/:id/timeline`
- All write operations auto-captured via interceptor

- [ ] **Step 1: Create audit-log.entity.ts** (tenant schema, no BaseEntity — audit records have no deleted_at/updated_by since immutable)

- [ ] **Step 2: Implement audit-log.interceptor.ts** — intercepts POST/PUT/PATCH requests, captures old_value (JSONB), new_value (JSONB), user_id, action, module, entity, ip_address.

- [ ] **Step 3: Implement timeline endpoint** — `GET /api/v1/cases/:id/timeline` returns chronological list of all actions on a case file.

- [ ] **Step 4: Enforce immutability** — AuditLog records cannot be updated or deleted (AL-001, AL-002).

- [ ] **Step 5: Write tests** — create case, update case, verify audit records created; attempt to delete audit record → 403.

- [ ] **Step 6: Commit**

---

### Task 5.4: Dashboard & Response Transform Interceptor

**Files:**
- Create: `backend/src/modules/dashboard/dashboard.module.ts`, `.controller.ts`, `.service.ts`
- Create: `backend/src/common/interceptors/response-transform.interceptor.ts`

**Interfaces:**
- Produces: `GET /api/v1/dashboard` → widgets: critical_deadlines, pending_services, ready_for_finalization, ready_for_appeal_transfer, fee_muzekkere_required, returned_services, missing_data, recent_activity

- [ ] **Step 1: Create response-transform.interceptor.ts** — wraps all successful responses in `{ success: true, data: ..., message: null }` format.

- [ ] **Step 2: Implement dashboard.service.ts** — aggregate queries per widget, user-specific (court-based filtering), cached with 30-second TTL.

- [ ] **Step 3: Dashboard widgets** — each widget returns count + list of top 5 items. Color coding: critical=red, approaching=amber, normal=green.

- [ ] **Step 4: Write tests** — 4 scenarios from Bölüm 10.

- [ ] **Step 5: Commit**

---

# Phase 6: Frontend Implementation

### Task 6.1: Login Page & Auth Context

**Files:**
- Create: `frontend/src/pages/login.tsx`
- Create: `frontend/src/hooks/use-auth.ts`

- [ ] **Step 1: Create use-auth.ts**:

```typescript
import { create } from 'zustand';
import apiClient from '../lib/api-client';

interface AuthState {
  user: { id: string; email: string; role: string; name: string } | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuth = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { access_token, user } = data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token: access_token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
```

- [ ] **Step 2: Create login.tsx** — centered card with email/password inputs, shadcn/ui Button+Input+Card, error state, loading state.

- [ ] **Step 3: Add protected route wrapper** — redirects to `/login` if not authenticated.

- [ ] **Step 4: Commit**

---

### Task 6.2: App Shell (Sidebar + Header + Layout)

**Files:**
- Create: `frontend/src/components/layout/sidebar.tsx`, `header.tsx`, `app-layout.tsx`

- [ ] **Step 1: Create sidebar.tsx** — role-based menu items (Super Admin: Courthouses; Adliye Admin: Courts, Mudurs; Müdür: Dashboard, Cases, Calendar, Fees, Notifications; All: Settings). Active state highlighting. Collapsible on mobile.

- [ ] **Step 2: Create header.tsx** — Notification bell with unread count badge, user dropdown (profile, logout), "+ New Case" button (Müdür only).

- [ ] **Step 3: Create app-layout.tsx** — sidebar + header + `<main>` content area with `max-w-[1600px] mx-auto p-6`.

- [ ] **Step 4: Commit**

---

### Task 6.3: Shared Components

**Files:**
- Create: `frontend/src/components/shared/status-badge.tsx`, `priority-badge.tsx`, `data-table.tsx`, `empty-state.tsx`, `confirm-dialog.tsx`, `loading-spinner.tsx`

- [ ] **Step 1: status-badge.tsx** — maps status codes to colors: ACTIVE=green, ARCHIVED=gray, SERVED=green, RETURNED=red, CRITICAL=red, WARNING=amber, etc.

- [ ] **Step 2: data-table.tsx** — reusable powered by TanStack Table: sortable columns, pagination, search, column visibility toggle.

- [ ] **Step 3: Commit**

---

### Task 6.4: Dashboard Page

**Files:**
- Create: `frontend/src/pages/dashboard.tsx`
- Create: `frontend/src/components/dashboard/stats-card.tsx`, `critical-table.tsx`, `suggestion-box.tsx`
- Create: `frontend/src/hooks/use-dashboard.ts`

- [ ] **Step 1: Create use-dashboard.ts** — `useQuery` fetching `GET /api/v1/dashboard`, returns individual widgets.

- [ ] **Step 2: Create dashboard.tsx** — 4-column stats grid (critical=red, pending=amber, finalization=blue, fees=green). Critical deadlines table below. Suggestion box at bottom (as mockup design).

- [ ] **Step 3: Implement loading skeletons** — Skeleton cards while data loads.

- [ ] **Step 4: Commit**

---

### Task 6.5: Case File Pages (List + Detail + Form)

**Files:**
- Create: `frontend/src/pages/cases.tsx`, `case-detail.tsx`
- Create: `frontend/src/components/case-file/case-file-list.tsx`, `case-file-form.tsx`, `case-file-detail.tsx`, `case-file-timeline.tsx`

- [ ] **Step 1: case-file-list.tsx** — paginated data-table with columns: esas_no, karar_no, court, durum, karar_tarihi, same_court+esas_no uniqueness indicator. Filter by court, status. Search by esas_no.

- [ ] **Step 2: case-file-form.tsx** — all required fields from Bölüm 06 (court dropdown, esas_no, karar_no, karar_tarihi via calendar, karar_sonucu, kanun_yolu). React Hook Form + Zod validation.

- [ ] **Step 3: case-detail.tsx** — tabbed page: Genel Bilgiler, Taraflar, Tebligatlar, Kanun Yolu, Harç, Audit Geçmişi (per Bölüm 06 + Bölüm 17).

- [ ] **Step 4: case-file-timeline.tsx** — vertical timeline showing chronological history: created → parties added → services sent → served → appeals → fees.

- [ ] **Step 5: Commit**

---

### Task 6.6: Party Pages

**Files:**
- Create: `frontend/src/components/party/party-list.tsx`, `party-form.tsx`, `party-detail.tsx`
- Create: `frontend/src/hooks/use-parties.ts`

- [ ] **Step 1: party-list.tsx** — table: role badge (PLAINTIFF=blue/DEFENDANT=orange), display name, party type, active status, latest service status. Action menu (edit, deactivate, view details).

- [ ] **Step 2: party-form.tsx** — dynamic fields based on PERSON/ORGANIZATION selection. PERSON: first_name, last_name (required). ORGANIZATION: organization_name (required). Duplicate warning modal. Zod schema with conditional validation.

- [ ] **Step 3: party-detail.tsx** — party info + service history + appeal relationships + fee relationships + audit summary.

- [ ] **Step 4: Commit**

---

### Task 6.7: ServiceRecord, Appeal, Fee Pages

**Files:**
- Create: `frontend/src/components/service-record/`
- Create: `frontend/src/components/appeal/`
- Create: `frontend/src/components/fee-tracking/`

- [ ] **Step 1: service-list.tsx** — table per file: type, party, sent_date, served_date, status badge, status change button (SERVED/RETURNED).

- [ ] **Step 2: service-form.tsx** — party selector (active only), type selector, sent_date calendar, status dropdown.

- [ ] **Step 3: appeal-form.tsx** — type (ISTINAF/TEMYIZ), applicant party selector, auto-lists opposing parties after selection.

- [ ] **Step 4: fee-form.tsx** — debtor party selector, type, amount, served_date, status management.

- [ ] **Step 5: Commit**

---

### Task 6.8: Notification Center & Audit Log Viewer

**Files:**
- Create: `frontend/src/components/notification/notification-center.tsx`, `notification-bell.tsx`
- Create: `frontend/src/components/audit-log/audit-log-viewer.tsx`

- [ ] **Step 1: notification-bell.tsx** — bell icon in header, unread count badge, dropdown showing last 5 notifications. Click → notification center.

- [ ] **Step 2: notification-center.tsx** — full page with filters (type, priority, read/unread), mark as read/complete actions.

- [ ] **Step 3: audit-log-viewer.tsx** — paginated table with user, action, module, timestamp. Filter by date range, user, module, action type. Read-only (no edit/delete buttons).

- [ ] **Step 4: Commit**

---

### Task 6.9: Courthouse & Court Management (Admin Pages)

**Files:**
- Create: `frontend/src/pages/courthouse-management.tsx`, `court-management.tsx`, `user-management.tsx`

- [ ] **Step 1: courthouse-management.tsx** — Super Admin only: table of courthouses, create/edit form, delete (soft) confirmation.

- [ ] **Step 2: court-management.tsx** — Adliye Admin: table of courts for their courthouse, create/edit form, mudur assignment dropdown per court.

- [ ] **Step 3: user-management.tsx** — Adliye Admin: create MUDUR users, assign to courts via multi-select.

- [ ] **Step 4: Commit**

---

# Phase 7: Polish & Integration

### Task 7.1: E2E Integration Tests

- [ ] **Step 1:** Full flow test: Super Admin creates courthouse → creates Adliye Admin → Adliye Admin creates courts + mudurs → Mudur creates case file → adds parties → creates service records → updates status to SERVED → SureEngine calculates deadlines → notifications appear on dashboard → Mudur creates appeal → opposing parties identified → fee tracking added.

- [ ] **Step 2: Commit**

---

### Task 7.2: Performance Optimization

- [ ] **Step 1:** Add composite indexes per Bölüm 16 (court_id+esas_no, case_file_id+status, party_id+served_date).

- [ ] **Step 2:** Implement query caching for dashboard widgets (30s TTL).

- [ ] **Step 3:** Verify dashboard loads < 2 seconds, API responses < 500ms.

- [ ] **Step 4: Commit**

---

### Task 7.3: Security Hardening

- [ ] **Step 1:** Add rate limiting (express-rate-limit) to auth endpoint.

- [ ] **Step 2:** Helmet middleware for security headers.

- [ ] **Step 3:** JWT refresh token rotation.

- [ ] **Step 4:** Verify no sensitive data (national_id, tax_number) in API responses unmasked.

- [ ] **Step 5: Commit**
