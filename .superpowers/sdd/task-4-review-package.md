 backend/src/common/entities/base.entity.ts | 21 +++++++++++++++++++++
 backend/src/database/data-source.ts        | 10 ++++++++++
 backend/src/database/migrations/.gitkeep   |  0
 3 files changed, 31 insertions(+)

---

diff --git a/backend/src/common/entities/base.entity.ts b/backend/src/common/entities/base.entity.ts
new file mode 100644
index 0000000..050f667
--- /dev/null
+++ b/backend/src/common/entities/base.entity.ts
@@ -0,0 +1,21 @@
+import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column } from 'typeorm';
+
+export abstract class BaseEntity {
+  @PrimaryGeneratedColumn('uuid')
+  id!: string;
+
+  @CreateDateColumn({ type: 'timestamptz' })
+  created_at!: Date;
+
+  @UpdateDateColumn({ type: 'timestamptz' })
+  updated_at!: Date;
+
+  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
+  deleted_at!: Date | null;
+
+  @Column({ type: 'uuid', nullable: true })
+  created_by!: string | null;
+
+  @Column({ type: 'uuid', nullable: true })
+  updated_by!: string | null;
+}
diff --git a/backend/src/database/data-source.ts b/backend/src/database/data-source.ts
new file mode 100644
index 0000000..c901cea
--- /dev/null
+++ b/backend/src/database/data-source.ts
@@ -0,0 +1,10 @@
+import { DataSource } from 'typeorm';
+
+export const AppDataSource = new DataSource({
+  type: 'postgres',
+  url: process.env.DATABASE_URL || 'postgresql://mudurpro:mudurpro_secret@localhost:5432/mudurpro',
+  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
+  migrations: [__dirname + '/migrations/*{.ts,.js}'],
+  synchronize: false,
+  logging: process.env.NODE_ENV === 'development',
+});
diff --git a/backend/src/database/migrations/.gitkeep b/backend/src/database/migrations/.gitkeep
new file mode 100644
index 0000000..e69de29
