# Task 1.1 Report: Docker Compose Infrastructure

**Status:** DONE

**Commit:** `1410dfc` — feat: add Docker Compose infrastructure (db, app, web, pgadmin)

**Summary:** Created the Docker Compose foundation for the MDRPro project with 4 services: PostgreSQL 16 (db), NestJS backend (app), React frontend (web via Nginx), and pgAdmin.

## Files Created

| File | Description |
|------|-------------|
| `docker/docker-compose.yml` | Orchestrates 4 services with healthchecks, volumes, and environment variables |
| `docker/Dockerfile.backend` | Node 20 Alpine-based backend image, runs `dist/main` |
| `docker/Dockerfile.frontend` | Multi-stage build: Node build stage → Nginx serving stage |
| `docker/nginx.conf` | Serves React SPA via try_files, proxies `/api/` to backend on port 3000 |
| `docker/.gitignore` | Ignores all files except the four tracked Docker files |

## Services

| Service | Port | Image/Build | Status |
|---------|------|------------|--------|
| `db` | 5432 | `postgres:16-alpine` | Configured (POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD, healthcheck, pgdata volume) |
| `app` | 3000 | NestJS (built from `../backend`) | Configured (DATABASE_URL, JWT_SECRET, depends_on `db` healthy, src volume mount) |
| `web` | 80 | React + Nginx (built from `../frontend`) | Configured (depends_on `app`) |
| `pgadmin` | 5050 | `dpage/pgadmin4` | Configured (depends_on `db`) |

## Notes

- `JWT_SECRET` is set to `change-me-in-production` — must be rotated before production deployment.
- The backend `src/` directory is volume-mounted for hot-reload during development.
- `npx dotenv-cli` can be used later to generate `.env` files from `docker-compose.yml` if needed.
- LF→CRLF warnings are harmless Windows artifacts; `.gitattributes` could be added later to normalize line endings.

---

## Bug Fix (Review Finding)

**Status:** DONE

**Commit:** `800f2b5` — fix: change Docker build context to project root to fix nginx.conf COPY path

**Problem:** The `web` service had `context: ../frontend` but `Dockerfile.frontend` referenced `docker/nginx.conf` which is outside the frontend directory. Docker would look for `frontend/docker/nginx.conf` which doesn't exist, causing a build failure.

**Fix:**
- Changed both `app` and `web` build contexts from `../backend` / `../frontend` to `.` (project root)
- Updated `dockerfile:` paths from `../docker/...` to `docker/...`
- Updated `Dockerfile.backend`: `COPY package*.json ./` → `COPY backend/package*.json ./` and `COPY . .` → `COPY backend/ .`
- Updated `Dockerfile.frontend`: `COPY package*.json ./` → `COPY frontend/package*.json ./` and `COPY . .` → `COPY frontend/ .`
- Updated `app` volume mount from `../backend/src:/app/src` → `./backend/src:/app/src`
