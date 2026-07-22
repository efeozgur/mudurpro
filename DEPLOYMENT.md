# MüdürPro - VDS Kurulum Notları

## Sunucu Bilgileri

- Domain: dosyatakip.ozgurapp.com
- Sunucu: 45-94-169-47
- Proje yolu: `/opt/docker-apps/mudurpro`
- GitHub: https://github.com/efeozgur/mudurpro.git

## Portlar

| Servis | İç Port | Dış Port (127.0.0.1) |
|---|---|---|
| Backend (NestJS) | 3000 | 3100 |
| Frontend (Nginx) | 80 | 9090 |
| PostgreSQL | 5432 | 5433 |
| pgAdmin | 80 | 5151 |

## Konteynerlar

| İsim | Rol |
|---|---|
| `docker-app-1` | NestJS backend |
| `docker-web-1` | Frontend (Nginx statik dosya sunar) |
| `docker-db-1` | PostgreSQL 16 |
| `docker-pgadmin-1` | pgAdmin yönetim arayüzü |

## Önemli URL'ler

| Adres | Açıklama |
|---|---|
| `https://dosyatakip.ozgurapp.com` | Frontend (web uygulaması) |
| `https://dosyatakip.ozgurapp.com/api/v1/` | Backend API |
| `https://dosyatakip.ozgurapp.com:5151` | pgAdmin |

## Admin Girişi

- **E-posta:** admin@ozgurapp.com
- **Şifre:** admin123

## Kurulum Adımları

```bash
# Projeyi çek
cd /opt/docker-apps
git clone https://github.com/efeozgur/mudurpro.git
cd mudurpro

# .env dosyası
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://mudurpro:mudurpro_secret@db:5432/mudurpro
JWT_SECRET=degistir-benzeri-64-karakter
JWT_EXPIRES_IN=24h
EOF

# Docker stack'i başlat
docker compose -f docker/docker-compose.yml up -d --build

# Nginx config
sudo tee /etc/nginx/sites-available/dosyatakip > /dev/null << 'NGINX'
server {
    listen 80;
    server_name dosyatakip.ozgurapp.com;

    location / {
        proxy_pass http://127.0.0.1:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/dosyatakip /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d dosyatakip.ozgurapp.com

# Admin kullanıcı oluştur
docker exec docker-app-1 node -e "const b=require('bcrypt');console.log(b.hashSync('admin123',10))" | xargs -I {} docker exec docker-db-1 psql -U mudurpro -d mudurpro -c "INSERT INTO public.users (id,name,email,password_hash,role,active,created_at,updated_at) VALUES (gen_random_uuid(),'Admin','admin@ozgurapp.com','{}','SUPER_ADMIN',true,NOW(),NOW());"
```

## Yararlı Komutlar

```bash
# Logları takip et
docker compose -f docker/docker-compose.yml logs -f --tail=50

# Backend log
docker logs docker-app-1 --tail 20

# DB'ye bağlan
docker exec -it docker-db-1 psql -U mudurpro -d mudurpro

# Yeniden build al (kod güncellendiğinde)
git pull origin master
docker compose -f docker/docker-compose.yml up -d --build

# Değişiklikleri GitHub'a gönder
git add -A
git commit -m "açıklama"
git push origin master

# API test
curl -s -X POST http://127.0.0.1:3100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@ozgurapp.com\",\"password\":\"admin123\"}"
```

## Güncelleme

```bash
cd /opt/docker-apps/mudurpro
git pull origin master
docker compose -f docker/docker-compose.yml up -d --build
```
