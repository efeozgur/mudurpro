### Task 2.1: Auth Module (Login, JWT, Roles)

**All code and steps are in the plan file.** Read:
`docs/superpowers/plans/2026-07-19-yazi-isleri-muduru-implementation.md`
from line 631 (Task 2.1 heading) through line 865.

**Files to create:**
- backend/src/modules/auth/auth.module.ts
- backend/src/modules/auth/auth.controller.ts
- backend/src/modules/auth/auth.service.ts
- backend/src/modules/auth/strategies/jwt.strategy.ts
- backend/src/modules/auth/dto/login.dto.ts
- backend/src/modules/auth/entities/user.entity.ts
- backend/src/common/guards/jwt-auth.guard.ts
- backend/src/common/guards/roles.guard.ts
- backend/src/common/decorators/roles.decorator.ts
- backend/src/common/decorators/current-user.decorator.ts

**Key requirements:**
- User entity in `public` schema, uses BaseEntity
- Password hashing with bcrypt
- JWT payload: { sub, email, role }
- Roles: SUPER_ADMIN, ADLIYE_ADMIN, MUDUR
- Standard response: { success: true, data: ..., message: null }
- AuthModule imports TypeOrmModule.forFeature([User])
- Update app.module.ts to import AuthModule and TypeOrmModule.forRoot
- Verify build compiles
- Commit: `feat: add Auth module with JWT login, roles guard, current-user decorator`
