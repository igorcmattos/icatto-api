# Como Iniciar o Projeto

## Pré-requisitos
- Node.js 20+ instalado
- Docker Desktop (para o PostgreSQL local)
- Conta Google Cloud com Drive API ativada

## 1. Instalar dependências

```bash
npm install
```

## 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` e preencha:

```bash
cp apps/api/.env.example apps/api/.env
```

Edite `apps/api/.env`:
- `DATABASE_URL` — já configurado para o Docker local
- `JWT_SECRET` — troque por uma string aleatória segura
- `GOOGLE_SERVICE_ACCOUNT_JSON` — cole o JSON da Service Account do Google (veja abaixo)
- `GOOGLE_DRIVE_ROOT_FOLDER_ID` — ID da pasta raiz no seu Google Drive

## 3. Subir o banco de dados (Docker)

```bash
docker-compose up -d
```

## 4. Rodar as migrations do Prisma

```bash
npm run db:generate
npm run db:migrate
```

## 5. Iniciar o projeto (dev)

```bash
npm run dev
```

- API: http://localhost:3333
- Frontend: http://localhost:5173
- Prisma Studio: `npm run db:studio`

---

## Configurar Google Drive API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto novo
3. Ative a **Google Drive API**
4. Em "Credenciais" → Crie uma **Service Account**
5. Baixe o arquivo JSON da Service Account
6. No Google Drive, crie uma pasta chamada **"Icatto"**
7. Compartilhe essa pasta com o e-mail da Service Account (pode ser `editor`)
8. Copie o ID da pasta da URL do Drive (ex: `1AbCdEfGhIjKlMnOpQrStUvWxYz`)
9. Cole o JSON da Service Account na variável `GOOGLE_SERVICE_ACCOUNT_JSON` (em uma linha só)
10. Cole o ID da pasta em `GOOGLE_DRIVE_ROOT_FOLDER_ID`

---

## Criar a primeira conta da imobiliária

```bash
curl -X POST http://localhost:3333/auth/cadastro \
  -H "Content-Type: application/json" \
  -d '{"nome":"Minha Imobiliária","cnpj":"12345678000199","email":"admin@imob.com","senha":"senha123"}'
```

---

## Deploy no VPS Locaweb

Siga o script `deploy/setup-vps.sh`. Antes, edite:
- As credenciais do banco
- Os domínios (api.icatto.com.br / app.icatto.com.br)
- O e-mail para o SSL (Let's Encrypt)

```bash
# No servidor VPS:
bash deploy/setup-vps.sh
```
