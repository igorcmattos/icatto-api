#!/bin/bash
# Script de configuração inicial do VPS Locaweb
# Execute como root: bash setup-vps.sh

set -e

echo "=== Instalando dependências do sistema ==="
apt-get update && apt-get install -y curl git nginx certbot python3-certbot-nginx

echo "=== Instalando Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== Instalando PM2 ==="
npm install -g pm2

echo "=== Instalando PostgreSQL ==="
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

echo "=== Criando banco e usuário ==="
sudo -u postgres psql <<EOF
CREATE USER icatto WITH PASSWORD 'TROQUE_ESTA_SENHA';
CREATE DATABASE icatto_db OWNER icatto;
GRANT ALL PRIVILEGES ON DATABASE icatto_db TO icatto;
EOF

echo "=== Clonando o projeto ==="
mkdir -p /var/www
cd /var/www
# git clone https://seu-repo/icatto-api.git
# cd icatto-api

echo "=== Instalando dependências Node ==="
npm install

echo "=== Gerando Prisma client e rodando migrations ==="
npx prisma generate --schema=prisma/schema.prisma
DATABASE_URL="postgresql://icatto:TROQUE_ESTA_SENHA@localhost:5432/icatto_db" \
  npx prisma migrate deploy --schema=prisma/schema.prisma

echo "=== Build da API ==="
npm run build --workspace=apps/api

echo "=== Build do Frontend ==="
npm run build --workspace=apps/web
cp -r apps/web/dist /var/www/icatto-web

echo "=== Configurando Nginx ==="
cp deploy/nginx.conf /etc/nginx/sites-available/icatto
ln -sf /etc/nginx/sites-available/icatto /etc/nginx/sites-enabled/icatto
nginx -t && systemctl reload nginx

echo "=== Iniciando API com PM2 ==="
cd /var/www/icatto-api
pm2 start apps/api/dist/server.js --name icatto-api
pm2 save
pm2 startup systemd -u root --hp /root

echo "=== Configurando SSL (Let's Encrypt) ==="
certbot --nginx -d api.icatto.com.br -d app.icatto.com.br --non-interactive --agree-tos -m seu@email.com

echo "=== Deploy concluído! ==="
echo "API: https://api.icatto.com.br"
echo "App: https://app.icatto.com.br"
