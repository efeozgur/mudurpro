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

- [ ] **Step 5: Create docker/.gitignore** — ignore any temporary files

- [ ] **Step 6: Commit**

```bash
git add docker/
git commit -m "feat: add Docker Compose infrastructure (db, app, web, pgadmin)"
```
