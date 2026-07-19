### Task 1.4: TypeORM Database Connection & Base Entity

Create 3 files in the existing NestJS backend:

**File 1: `backend/src/common/entities/base.entity.ts`**

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

**File 2: `backend/src/database/data-source.ts`**

```typescript
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
```

**File 3: `backend/src/database/migrations/`** — Create an empty directory with a `.gitkeep` file so the directory is tracked.

**Verify:** `npm run build` compiles without errors.

**Commit:**
```bash
git add backend/src/common/ backend/src/database/
git commit -m "feat: add TypeORM BaseEntity (UUID PK, soft delete, timestamps) and DataSource"
```
