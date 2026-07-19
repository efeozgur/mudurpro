### Task 1.2: NestJS Backend Scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/nest-cli.json`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/.env`

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
    "esModuleInterop": true
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
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
      entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
      synchronize: false,
    }),
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Create backend/.env**

```
DATABASE_URL=postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=8h
```

- [ ] **Step 7: Create backend/test/jest-e2e.json** and backend/jest.config.js (basic Jest config)

```json
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

- [ ] **Step 8: Add a simple health endpoint** — Create `backend/src/app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { success: true, data: { status: 'ok' }, message: null };
  }
}
```

Update `app.module.ts` to include this controller.

- [ ] **Step 9: Install dependencies** — Run `cd backend; npm install`

- [ ] **Step 10: Verify** — Run `npm run start:dev` from backend/, verify app boots without errors. Test `GET http://localhost:3000/api/v1/health` returns `{"success":true,"data":{"status":"ok"},"message":null}`.

- [ ] **Step 11: Add backend/.gitignore** — node_modules, dist, .env (but keep .env.example)

- [ ] **Step 12: Commit**

```bash
git add backend/
git commit -m "feat: scaffold NestJS backend with TypeORM, health endpoint, /api/v1 prefix"
```
