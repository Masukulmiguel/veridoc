# VeriDoc — Confiança Digital

<p align="center">
  <img src="public/logotipo.png" alt="Logotipo VeriDoc" width="420">
</p>

Plataforma de **emissão, assinatura e validação de documentos digitais**. As instituições
registadas emitem documentos com proteção criptográfica (hash SHA-256 + assinatura RSA-2048),
código de verificação e QR Code; qualquer pessoa pode validar um documento em público usando
apenas o código.

## Funcionalidades

- **Registo de instituições** com autenticação por palavra-passe (PBKDF2) ou **Google OAuth**.
- **Gestão de utilizadores** com RBAC (`ADMIN`, `ISSUER`, `VIEWER`) validado no backend.
- **Emissão de documentos** — o conteúdo é serializado de forma canónica, é calculado o hash
  SHA-256 e o hash é assinado com RSA-2048 (a **chave privada nunca sai do servidor**).
- **QR Code e PDF** gerados no servidor; o QR contém apenas a URL de validação
  `https://veridoc.ao/verificar/{código}`.
- **Validação pública** — recomputa o hash, verifica a assinatura, trata estados
  `VALID | REVOKED | EXPIRED | INVALID | PENDING` e regista cada validação.
- **Revogação** de documentos com motivo.
- **Auditoria** completa de todas as ações (`USER_CREATED`, `LOGIN`, `DOCUMENT_CREATED`,
  `DOCUMENT_SIGNED`, `DOCUMENT_VERIFIED`, `DOCUMENT_REVOKED`, `INSTITUTION_UPDATED`, `USER_UPDATED`).

## Stack

| Camada    | Tecnologias |
|-----------|-------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, TanStack Query, React Hook Form + Zod, Axios |
| Backend   | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2, Authlib, PyJWT, cryptography, qrcode, ReportLab |
| Base de dados | PostgreSQL (Docker) / SQLite (desenvolvimento) |
| Testes    | pytest + httpx (TestClient) |

## Estrutura

```
veridoc/
├── src/                      # Frontend React
│   ├── components/           # UI, layout, auth, forms, documents, verification, dashboard
│   ├── pages/                # Home, Login, Register, VerifyDocument, Dashboard, ...
│   ├── services/             # api.ts (axios + refresh + transform snake/camel), services, mocks
│   ├── hooks/                # useAuth, useDocuments, useVerification
│   ├── routes/               # AppRoutes + ProtectedRoute
│   ├── types/                # Tipos partilhados (auth, document, verification, ...)
│   └── utils/                # hashing, pdf, format, cn
└── backend/                  # API FastAPI
    ├── app/
    │   ├── core/             # config, database, security (JWT, password, RBAC)
    │   ├── models/           # Institution, User, Document, Signature, Verification, Audit
    │   ├── schemas/          # Pydantic
    │   ├── api/routes/       # auth, users, institutions, documents, dashboard, verification, audit
    │   ├── services/         # auth, document, signature, qr, pdf, verification, audit
    │   └── utils/            # hashing (canónico), identifiers
    ├── migrations/           # Alembic
    ├── tests/                # pytest (segurança e fluxos)
    ├── Dockerfile
    └── docker-compose.yml
```

## Como correr localmente

### Frontend

```bash
npm install
npm run dev          # http://localhost:5173
```

Variáveis em `.env`:

```
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCKS=true          # true = dados de demonstração (sem backend)
```

> Com `VITE_USE_MOCKS=true` não é preciso backend para explorar a UI.

### Backend (sem Docker)

```bash
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env       # ajustar DATABASE_URL (sqlite por omissão)
alembic upgrade head         # criar o esquema
uvicorn app.main:app --reload --port 8000
```

- API + Swagger: http://localhost:8000/api/docs
- Saúde: http://localhost:8000/health

### Backend (Docker + PostgreSQL)

```bash
docker compose up --build
```

O primeiro arranque gera as tabelas via Alembic manualmente (`docker compose exec backend alembic upgrade head`).
Defina `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e `CORS_ORIGINS` no ambiente.

## Contas de demonstração (modo mock)

| Papel    | E-mail                  | Palavra-passe  |
|----------|-------------------------|----------------|
| Admin    | `admin@veridoc.ao`      | `veridoc123`   |
| Emissor  | `emissor@veridoc.ao`    | `veridoc123`   |
| Consultor| `consultor@veridoc.ao`  | `veridoc123`   |

Com o backend real, o registo cria automaticamente a instituição e o utilizador administrador.

## Segurança

- Palavras-passe com PBKDF2-HMAC-SHA256 (260k iterações) e salt aleatório.
- JWT HS256 com `exp`/`iat`; refresh token separado (`type=refresh`).
- RBAC aplicado no servidor: emitir/revogar exige `ADMIN` ou `ISSUER`; gerir utilizadores e
  auditoria exige `ADMIN`; o acesso a documentos está limitado à instituição.
- Assinatura RSA-2048 (RS256) feita **apenas no backend**; a chave privada nunca é enviada ao
  cliente. O QR Code é apenas um atalho — a autenticidade é validada pelo serviço de verificação.
- Validação por código, recomputação do hash canónico e verificação da assinatura antes de
  declarar um documento `VALID`.

## Testes

```bash
cd backend
.venv\Scripts\python -m pytest
```

Cobrem: hashing/assinatura, registo/login/refresh, RBAC (incluindo negação), ciclo de vida do
documento (emitir → validar → revogar), deteção de adulteração, expiração, isolamento entre
instituições, QR/PDF e auditoria.

## Endpoints principais

| Método | Rota | Acesso |
|--------|------|--------|
| POST | `/api/auth/register` · `/api/auth/login` · `/api/auth/refresh` | público |
| GET  | `/api/auth/me` | autenticado |
| POST | `/api/auth/google` | público (id_token) |
| GET/POST | `/api/documents` | autenticado / `ISSUER`+ |
| GET | `/api/documents/{id}` · `/qrcode` · `/pdf` | autenticado |
| POST | `/api/documents/{id}/revoke` | `ISSUER`+ |
| GET | `/api/verify/{code}` | público |
| GET/PUT | `/api/institutions/me` | autenticado / `ADMIN` |
| GET/POST/PUT/DELETE | `/api/users` · `/api/users/{id}` | `ADMIN` |
| GET | `/api/dashboard` · `/api/audit` | autenticado / `ADMIN` |
