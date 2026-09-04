# Flashcards — Resumo do Backend

> API REST para o sistema Flashcards — repetição espaçada com FSRS, sincronização offline/online.

## Status Atual

O **Backend** está com a estrutura completa implementada: autenticação (JWT + refresh rotation), RBAC com 3 roles (develop/admin/user), CRUD de decks/cards, sessões de estudo FSRS completas (preview de intervalos, undo, suspend/bury), sincronização offline/online, audit logging, log routes (atividade e acesso), Swagger docs, reCAPTCHA v3+v2 fallback, métricas Prometheus e suite de testes automatizados (138 testes). Compilando com **zero erros TypeScript** e **zero vulnerabilidades** (`npm audit` + OSV scan de 353 pacotes).

---

## Stack Tecnológica

| Tecnologia | Versão Instalada | Papel |
|---|---|---|
| Node.js | >= 18 | Runtime |
| TypeScript | 5.9 | Linguagem |
| Express | 4.22 | Framework HTTP |
| MySQL / MariaDB | — | Banco de dados |
| mysql2 | 3.22 | Driver MySQL (pool, prepared statements) |
| ts-fsrs | 4.7 | Algoritmo FSRS de repetição espaçada |
| jsonwebtoken | 9.0 | JWT (access + refresh tokens) |
| bcrypt | 6.0 | Hash de senhas |
| helmet | 8.1 | Headers de segurança + CSP |
| express-rate-limit | 7.5 | Rate limiting (4 tiers) |
| express-validator | 7.3 | Validação de input |
| winston | 3.19 | Logging estruturado |
| swagger-ui-express | 5.0 | Documentação interativa |
| nodemailer | 8.0 | Envio de emails (reset de senha) |
| prom-client | 15.1 | Métricas Prometheus |
| axios | 1.15 | HTTP client (reCAPTCHA API) |
| cookie-parser | 1.4 | Parse de cookies (refresh token) |
| cors | 2.8 | CORS (whitelist com reutilização de config) |
| disposable-email-domains | 1.0 | Detecção de emails descartáveis |
| PM2 | — | Deploy em cluster |
| **Dev** | | |
| jest | 29.7 | Framework de testes |
| ts-jest | 29.4 | Preset Jest para TypeScript |
| supertest | 7.2 | Testes de rotas HTTP |
| nock | 14.0 | Mock de requisições HTTP |

### Padrões Arquiteturais

- **4 camadas:** Routes → Controllers → Services → Repositories
- **Raw SQL** com prepared statements (sem ORM)
- **DB Instrumentation:** Pool e conexões instrumentadas com Prometheus (duração por operação/tabela)

---

## Estrutura do Projeto

```
Backend/
├── src/
│   ├── server.ts                           # Entry point — HTTP server + graceful shutdown
│   ├── app.ts                              # Express app — middleware chain + rotas
│   ├── swagger.ts                          # Swagger UI (merge de YAMLs)
│   │
│   ├── config/
│   │   ├── env.ts                          # Variáveis de ambiente centralizadas + validação
│   │   ├── database.ts                     # Pool MySQL (initDatabase, healthCheck, close)
│   │   ├── logger.ts                       # Winston (dev: colorido, prod: JSON + file rotation)
│   │   └── metrics.ts                      # Registros Prometheus (http_duration, db_query, login_total)
│   │
│   ├── errors/
│   │   └── httpError.ts                    # Hierarquia: HttpError → Bad/Unauthorized/Forbidden/NotFound/Conflict/TooMany/Internal
│   │
│   ├── middlewares/
│   │   ├── securityMiddleware.ts           # Helmet CSP, headers extras, noCacheAuth, abortDetection
│   │   ├── authMiddleware.ts               # verifyToken (JWT), optionalAuth, requireRole (RBAC)
│   │   ├── errorHandler.ts                 # Handler global + 404 (nunca expõe sqlMessage)
│   │   ├── rateLimiter.ts                  # 4 tiers: global(1500), auth(30), passwordReset(5), sync(60)
│   │   ├── validationMiddleware.ts         # express-validator → 422 com detalhes por campo
│   │   ├── dateConverterMiddleware.ts      # Monkey-patch res.json() — converte Date para ISO-8601
│   │   └── metricsMiddleware.ts            # Prometheus: duração + contagem de requests HTTP
│   │
│   ├── models/
│   │   ├── user.model.ts                   # UserRow + User + toUser() + RoleName ('develop'|'admin'|'user')
│   │   ├── refreshToken.model.ts           # RefreshTokenRow (jti, token_hash, replaced_by)
│   │   ├── deck.model.ts                   # DeckRow + Deck (FSRS settings, hierarquia pai)
│   │   ├── card.model.ts                   # CardRow + Card (estado FSRS + is_suspended + is_buried), CardState, Rating
│   │   └── reviewLog.model.ts              # ReviewLogRow + ReviewLog (snapshot pós + snapshot pré para undo)
│   │
│   ├── dtos/
│   │   ├── auth.dto.ts                     # Signin, AuthResponse, ForgotPassword, Reset, ChangePassword
│   │   ├── user.dto.ts                     # CreateUser, UpdateUser (admin CRUD)
│   │   ├── deck.dto.ts                     # CreateDeck, UpdateDeck
│   │   ├── card.dto.ts                     # CreateCard, UpdateCard
│   │   ├── review.dto.ts                   # SubmitReview, StudySession
│   │   └── sync.dto.ts                     # SyncRequest, SyncChange, SyncResponse, SyncConflict
│   │
│   ├── repositories/
│   │   ├── user.repository.ts              # CRUD users + refresh tokens + password reset + access/activity logs
│   │   ├── deck.repository.ts              # CRUD + softDelete + countCards + countCardsForDecks (batch)
│   │   ├── deckAssignment.repository.ts    # isAssigned, assign, unassign, listByDeck, listByUser
│   │   ├── card.repository.ts              # CRUD + findDueCards (com daily limit fix) + updateFSRSState
│   │   │                                   # + suspend/unsuspend/bury/unbury/unburyAll/unburyExpired
│   │   ├── review.repository.ts            # create (com pre-snapshot), findByCard, findLastByCard,
│   │   │                                   # deleteById, findByUser, getStudyStats
│   │   ├── sync.repository.ts              # getChangedSince (decks/cards/reviewLogs), saveSyncTimestamp
│   │   └── activityLog.repository.ts       # insert (silencioso) + list paginado com filtros
│   │
│   ├── services/
│   │   ├── auth.service.ts                 # signin, refresh (rotation + replay detection), logout, forgot/reset/change password
│   │   ├── user.service.ts                 # CRUD de usuários (admin cria) + changePassword + deactivate
│   │   ├── deck.service.ts                 # CRUD com RBAC + batch countCards + assignUsers/unassignUsers
│   │   ├── card.service.ts                 # CRUD + bulk paralelo + suspend/unsuspend/bury/unbury/unburyAll
│   │   ├── review.service.ts               # getStudySession (auto-unbury), previewCard, submitReview,
│   │   │                                   # getStats, getCardHistory, undoLastReview
│   │   ├── log.service.ts                  # listActivityLogs, listAccessLogs (com RBAC)
│   │   └── sync.service.ts                 # sync() — push/pull, last-write-wins, soft deletes
│   │
│   ├── controllers/                        # Parse request → call service → format response { success, data }
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── deck.controller.ts
│   │   ├── card.controller.ts
│   │   ├── review.controller.ts
│   │   ├── log.controller.ts
│   │   └── sync.controller.ts
│   │
│   ├── routes/                             # Express Router + express-validator inline + middlewares
│   │   ├── auth.routes.ts                  # POST signin/refresh/logout/forgot/reset, GET me, PUT change-password
│   │   ├── user.routes.ts                  # Admin CRUD usuarios: POST, GET, PUT, DELETE, PATCH activate/deactivate
│   │   ├── deck.routes.ts                  # CRUD + POST /:id/assign, DELETE /:id/assign/:userId, GET /:id/users
│   │   ├── card.routes.ts                  # CRUD + POST /bulk + PATCH /:id/suspend|unsuspend|bury|unbury
│   │   │                                   # + POST /deck/:deckId/unbury-all
│   │   ├── review.routes.ts                # GET /study/:deckId, GET /preview/:cardId, POST /,
│   │   │                                   # POST /undo, GET /stats, GET /history/:cardId
│   │   ├── log.routes.ts                   # GET /logs/activity, GET /logs/access
│   │   └── sync.routes.ts                  # POST / (sync endpoint)
│   │
│   ├── database/                           # Migrations (CREATE TABLE IF NOT EXISTS)
│   │   ├── migration.ts                    # Runner — executa na ordem de FK
│   │   ├── users.migration.ts              # tb_users, tb_roles, tb_refresh_tokens,
│   │   │                                   # tb_password_reset_tokens, tb_access_logs
│   │   ├── decks.migration.ts              # tb_decks + tb_deck_assignments
│   │   ├── cards.migration.ts              # tb_cards (estado FSRS + is_suspended + is_buried)
│   │   ├── reviewLogs.migration.ts         # tb_review_logs (snapshot pós + 10 colunas pre_* para undo)
│   │   ├── sync.migration.ts               # tb_sync_log (user_id, synced_at)
│   │   └── activityLogs.migration.ts       # tb_activity_logs (audit log CRUD)
│   │
│   ├── jobs/
│   │   └── purge.ts                        # refreshTokenPurge + syncLogPurge (ambos com GET_LOCK,
│   │                                       # executados imediatamente no boot + a cada 6h)
│   │
│   ├── utils/
│   │   ├── password.ts                     # hashPassword, comparePassword (bcrypt, 10 rounds)
│   │   ├── validates.ts                    # isDisposableEmail, stripHtml, sanitizeString, toISOBrasilia
│   │   ├── recaptcha.ts                    # verifyRecaptcha v3, verifyRecaptchaV2 (fallback), bypass dev/test
│   │   └── index.ts                        # sleep, randomInt, cleanObject
│   │
│   └── interfaces/
│       └── pagination.interface.ts         # PaginationParams, PaginatedResult
│
├── docs/                                   # Swagger YAML (merge automático)
│   ├── base.yaml
│   ├── auth.yaml
│   ├── decks.yaml
│   ├── cards.yaml
│   ├── reviews.yaml
│   └── sync.yaml
│
├── test/
│   ├── setup.ts                            # Setup global (env vars, console mocking, timeout)
│   └── unit/
│       ├── config/                         # env.test.ts, logger.test.ts
│       ├── errors/                         # httpError.test.ts
│       ├── middlewares/                    # auth, errorHandler, rateLimiter, security, validation, dateConverter
│       ├── routes/                         # health.test.ts, auth.test.ts (supertest + mocks)
│       └── utils/                          # index, password, recaptcha, validates
│
├── jest.config.js
├── package.json
├── tsconfig.json
├── ecosystem.config.js                     # PM2 (cluster mode, 512M max, log rotation)
├── .env.example
├── .env.test
└── .gitignore
```

---

## Banco de Dados

### Diagrama de Tabelas

```
tb_roles
└── tb_users                  (role_id FK)
    ├── tb_refresh_tokens      (user_id FK)
    ├── tb_password_reset_tokens (user_id FK)
    ├── tb_access_logs         (user_id FK)
    ├── tb_activity_logs       (user_id FK)
    ├── tb_decks               (user_id FK — criador)
    │   ├── tb_deck_assignments (deck_id FK, user_id FK — alunos)
    │   └── tb_cards           (deck_id FK, user_id FK)
    │       └── tb_review_logs (card_id FK, user_id FK)
    └── tb_sync_log            (user_id FK)
```

### Tabelas (11)

| Tabela | Descrição |
|---|---|
| `tb_roles` | Perfis de acesso: develop, admin, user |
| `tb_users` | Usuários (name, email, password_hash, role_id FK, is_active, created_by FK) |
| `tb_refresh_tokens` | Refresh tokens hashados (jti, token_hash, replaced_by, is_revoked, expires_at) |
| `tb_password_reset_tokens` | Códigos OTP de reset de senha (6 dígitos, 15 min TTL) |
| `tb_access_logs` | Logs de tentativa de login — sucesso e falha (IP, user-agent) |
| `tb_decks` | Decks de flashcards (user_id = admin criador, FSRS settings, hierarquia, soft delete) |
| `tb_deck_assignments` | Atribuição de decks a alunos (deck_id, user_id, assigned_by) |
| `tb_cards` | Cards com estado FSRS completo + `is_suspended` + `is_buried` (soft delete) |
| `tb_review_logs` | Histórico de reviews (snapshot pós-review + 10 colunas `pre_*` para undo) |
| `tb_sync_log` | Registro de sincronizações (user_id, synced_at) |
| `tb_activity_logs` | Audit log de operações CRUD (table_name, record_id, action, summary, details JSON) |

### Colunas Notáveis

**`tb_cards`**
- `is_suspended BOOLEAN DEFAULT FALSE` — removido de todas as sessões de estudo até unsuspend
- `is_buried BOOLEAN DEFAULT FALSE` — removido da sessão do dia; auto-reset ao iniciar nova sessão no dia seguinte

**`tb_review_logs`**
- `pre_state`, `pre_difficulty`, `pre_stability`, `pre_retrievability`, `pre_elapsed_days`, `pre_scheduled_days`, `pre_reps`, `pre_lapses`, `pre_due`, `pre_last_review` — snapshot do estado FSRS antes do review, usado para undo

---

## RBAC (Controle de Acesso)

### Hierarquia de Roles

```
develop > admin > user
```

| Role | Quem é | Permissões |
|---|---|---|
| `develop` | Super admin técnico | Acesso total — vê tudo, gerencia tudo |
| `admin` | Professor / gestor | Cria usuários, cria decks, atribui decks a alunos |
| `user` | Aluno | Estuda decks atribuídos a ele; sem acesso admin |

### Como Funciona

- **Signup removido** — somente `admin` ou `develop` criam usuários via `POST /users`
- **Decks:** `develop` vê todos; `admin` vê os que criou; `user` vê os atribuídos
- **Cards:** baseado no deck — `user` só acessa cards do próprio deck atribuído
- **Logs:** `develop` vê todos os logs; `admin` vê apenas os próprios
- **FSRS:** cada usuário tem estado FSRS independente por card

### Seed User (develop)

Um usuário `develop` é criado automaticamente pela migration para acesso inicial:

```
Email:  lucasleal@dombarreto.g12.br
Senha:  shockwave003
Role:   develop
```

---

## FSRS (Free Spaced Repetition Scheduler)

### Integração com ts-fsrs v4.7

O sistema usa `ts-fsrs` para calcular o agendamento de repetição espaçada com suporte completo ao algoritmo FSRS-5.

**Estados do card:**

| Estado | Valor | Descrição |
|---|---|---|
| New | 0 | Card nunca estudado |
| Learning | 1 | Em fase de aprendizado |
| Review | 2 | Em revisão periódica |
| Relearning | 3 | Re-aprendendo após "lapso" |

**Ratings:**

| Rating | Valor | Significado |
|---|---|---|
| Again | 1 | Não lembrou |
| Hard | 2 | Lembrou com dificuldade |
| Good | 3 | Lembrou bem |
| Easy | 4 | Muito fácil |

**Fluxo de estudo:**

```
1. GET /reviews/study/:deckId
   → auto-unbury de cards do dia anterior (unburyExpired)
   → respeita limites diários (new_cards_per_day - já revisados hoje)
   → filtra is_suspended=TRUE e is_buried=TRUE

2. GET /reviews/preview/:cardId
   → retorna {again, hard, good, easy} com due/scheduledDays/state por rating
   → usa desired_retention do deck (não global)
   → sem salvar nada

3. POST /reviews { cardId, rating, durationMs? }
   → bloqueia se is_suspended ou is_buried (400)
   → cria instância FSRS com desired_retention do deck
   → salva snapshot pré-review (campos pre_*) para permitir undo
   → atualiza estado do card + cria review log

4. POST /reviews/undo { cardId }
   → restaura estado FSRS do snapshot pre_* do último review
   → deleta o review log
```

**Configurações por deck:**

| Campo | Padrão | Descrição |
|---|---|---|
| `new_cards_per_day` | 20 | Máximo de cards novos por dia |
| `review_cards_per_day` | 200 | Máximo de revisões por dia |
| `desired_retention` | 0.9 | Retenção alvo (0.5–0.99) — alimenta o FSRS por deck |

**Suspend vs Bury:**

| Ação | Efeito | Duração |
|---|---|---|
| Suspend | Remove de todas as sessões | Permanente até unsuspend |
| Bury | Remove da sessão do dia | Auto-reset no início da próxima sessão (via `unburyExpired`) |

---

## Segurança

### Camadas de Proteção

| Camada | Implementação |
|---|---|
| **HTTP Headers** | Helmet v8 com CSP completo + X-Frame-Options DENY + Referrer-Policy + Permissions-Policy |
| **Fingerprint** | `x-powered-by` desabilitado |
| **Trust Proxy** | Configurável via `TRUST_PROXY` (nginx) |
| **CORS** | Config única reutilizada em `app.use` e `app.options` (sem duplicação) |
| **Body Limit** | 2MB (prevenção DoS de payload) |
| **Rate Limiting** | 4 tiers com extração de IP real (X-Forwarded-For), headers draft-7 |
| **JWT** | Access token HS256 (15min) + Refresh token rotation com SHA-256 hash |
| **Replay Detection** | Hash mismatch no refresh → revoga todos os tokens do usuário |
| **reCAPTCHA v3+v2** | Verificação invisível (score) + fallback checkbox; bypass em dev/test |
| **Senhas** | bcrypt com 10 salt rounds |
| **Emails descartáveis** | Bloqueio de domínios descartáveis (mailinator, yopmail, etc.) |
| **Input** | express-validator em todas as rotas + prepared statements SQL |
| **No-Cache Auth** | Header `Cache-Control: no-store` em todas as rotas `/auth/*` |
| **Error Handler** | Nunca expõe `sqlMessage` ao client |
| **Abort Detection** | Middleware que detecta desconexão do client |
| **RBAC** | `requireRole()` com hierarquia develop > admin > user |
| **Audit Log** | Toda operação CRUD registrada em tb_activity_logs (silencioso) |
| **Access Log** | Login success/failure registrado com IP e user-agent |

### Rate Limiting

| Tier | Limite | Janela | Alvo |
|---|---|---|---|
| Global | 1500 req | 15 min | Todas as rotas |
| Auth | 30 req | 15 min | Login, refresh |
| Password Reset | 5 req | 1 hora | Forgot/reset password |
| Sync | 60 req | 15 min | Endpoint de sincronização |

---

## Autenticação

### Fluxo JWT + Refresh Token Rotation

```
1. POST /auth/signin → { accessToken } + cookie httpOnly (refreshToken)
2. Requests autenticados: Authorization: Bearer <accessToken>
3. Expirou? POST /auth/refresh → novo accessToken + novo refreshToken (rotation)
4. POST /auth/logout → revoga refreshToken + limpa cookie
```

**Refresh Token Security:**
- Token raw nunca armazenado — apenas SHA-256 hash
- Cada uso gera novo token (rotation) e revoga o anterior
- `replaced_by` rastreia a cadeia
- Hash mismatch = possível roubo → revoga **todos** os tokens do usuário
- Suporte a "remember me" (7 dias vs 30 dias)

---

## Endpoints da API

### Auth (`/auth`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/signin` | Não | Login (access token + refresh cookie) |
| POST | `/auth/refresh` | Não | Renovar access token via cookie |
| POST | `/auth/logout` | Não | Logout (revoga refresh + limpa cookie) |
| POST | `/auth/forgot-password` | Não | Solicitar código OTP |
| POST | `/auth/reset-password` | Não | Redefinir senha com OTP |
| GET | `/auth/me` | Sim | Perfil do usuário autenticado |
| PUT | `/auth/change-password` | Sim | Alterar senha |

> Signup removido — usuários são criados pelo admin via `POST /users`

### Users (`/users`) — admin/develop

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users` | Listar usuários (filtros: role, isActive, search) |
| POST | `/users` | Criar usuário |
| GET | `/users/:id` | Buscar usuário por ID |
| PUT | `/users/:id` | Atualizar usuário |
| DELETE | `/users/:id` | Excluir usuário |
| PATCH | `/users/:id/activate` | Ativar usuário |
| PATCH | `/users/:id/deactivate` | Desativar usuário |

### Decks (`/decks`)

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/decks` | all | Listar decks (develop=todos, admin=criados, user=atribuídos) |
| GET | `/decks/:id` | all | Buscar deck por ID |
| POST | `/decks` | admin | Criar deck |
| PUT | `/decks/:id` | admin | Atualizar deck |
| DELETE | `/decks/:id` | admin | Excluir deck (soft delete) |
| POST | `/decks/:id/assign` | admin | Atribuir deck a usuários |
| DELETE | `/decks/:id/assign/:userId` | admin | Remover atribuição |
| GET | `/decks/:id/users` | admin | Listar usuários do deck |

### Cards (`/cards`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/cards/deck/:deckId` | Listar cards de um deck |
| GET | `/cards/:id` | Buscar card por ID |
| POST | `/cards` | Criar card |
| POST | `/cards/bulk` | Criar cards em lote (até 500, paralelo) |
| PUT | `/cards/:id` | Atualizar card |
| DELETE | `/cards/:id` | Excluir card (soft delete) |
| PATCH | `/cards/:id/suspend` | Suspender card |
| PATCH | `/cards/:id/unsuspend` | Reativar card suspenso |
| PATCH | `/cards/:id/bury` | Enterrar card (dia atual) |
| PATCH | `/cards/:id/unbury` | Desenterra card individual |
| POST | `/cards/deck/:deckId/unbury-all` | Desenterra todos os cards do deck |

### Reviews (`/reviews`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/reviews/study/:deckId` | Cards para sessão de estudo (auto-unbury + daily limit fix) |
| GET | `/reviews/preview/:cardId` | Preview de intervalos para cada rating (sem salvar) |
| POST | `/reviews` | Submeter avaliação (bloqueia suspended/buried, salva pré-snapshot) |
| POST | `/reviews/undo` | Desfazer último review (restaura estado anterior) |
| GET | `/reviews/stats` | Estatísticas de estudo (período configurável) |
| GET | `/reviews/history/:cardId` | Histórico de reviews de um card |

### Logs (`/logs`) — admin/develop

| Método | Rota | Descrição |
|---|---|---|
| GET | `/logs/activity` | Audit logs (filtros: action, table, userId, dateRange) |
| GET | `/logs/access` | Logs de acesso/login (filtros: success, userId, dateRange) |

### Sync (`/sync`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/sync` | Sincronização offline/online (protocolo AnkiWeb-like) |

### Health & Monitoring

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | Não | Status completo (DB, uptime, connections) |
| GET | `/healthz` | Não | Liveness probe (retorna "OK") |
| GET | `/metrics` | admin | Métricas Prometheus |

### Docs

| Rota | Descrição |
|---|---|
| `/docs` | Swagger UI interativo |

---

## Sincronização Offline/Online

### Protocolo (inspirado no AnkiWeb)

```
POST /sync
{
  "lastSyncAt": "2024-01-01T00:00:00Z" | null,
  "changes": [
    {
      "entity": "deck" | "card" | "reviewLog",
      "action": "create" | "update" | "delete",
      "id": 123,
      "clientId": "uuid",
      "data": { ... },
      "updatedAt": "2024-01-02T10:00:00Z"
    }
  ]
}
```

**Estratégia de conflito:** Last-write-wins (comparando `updated_at`)

---

## Audit Logging

Toda operação CRUD nos serviços registra um log em `tb_activity_logs`:

```typescript
await activityLogRepository.insert({
  tableName: 'tb_decks',
  recordId: id,
  action: 'CREATE',   // 'CREATE' | 'UPDATE' | 'DELETE'
  userId,
  summary: 'Deck criado: Inglês Básico',
  details: { name, description },
});
```

O `insert()` é silencioso — se falhar, registra no Winston mas **nunca** interrompe a operação principal.

---

## Jobs Periódicos

| Job | Lock | Boot | Intervalo | Descrição |
|---|---|---|---|---|
| `refreshTokenPurge` | `GET_LOCK` MySQL | ✅ imediato | 6 horas | Remove refresh tokens expirados/revogados |
| `syncLogPurge` | `GET_LOCK` MySQL | ✅ imediato | 6 horas | Remove registros de sync > 90 dias |

Ambos usam `GET_LOCK` para evitar duplicação em ambiente de cluster. São executados imediatamente no boot e depois a cada 6 horas. Ativados apenas em produção via `startPurgeJobs()`.

---

## Métricas Prometheus

| Métrica | Tipo | Descrição |
|---|---|---|
| `http_request_duration_seconds` | Histogram | Duração das requisições HTTP (method, route, status) |
| `db_query_duration_seconds` | Histogram | Duração das queries MySQL (operation, table) |
| `login_total` | Counter | Contagem de logins (success/failure) |

**Endpoint:** `GET /metrics` (requer role `admin`)

---

## reCAPTCHA v3 + v2

```
1. Frontend envia token v3 (invisível) → verifyRecaptcha()
2. Se score < RECAPTCHA_MIN_SCORE → lança RecaptchaChallengeRequired (HTTP 449)
3. Frontend mostra checkbox v2 → usuário resolve → envia token v2
4. verifyRecaptchaV2() valida o token v2
```

**Degradação graciosa:** Se a API Google não responder, o login prossegue normalmente.  
**Bypass:** Em `NODE_ENV=test` ou `development`, retorna `success: true` automaticamente.

---

## Scripts NPM

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia servidor com ts-node-dev (hot-reload) |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm start` | Roda build compilado |
| `npm run start:pm2` | Inicia via PM2 (cluster mode) |
| `npm run stop:pm2` | Para PM2 |
| `npm run migration` | Executa todas as migrations |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint com auto-fix |
| `npm run format` | Prettier em todos os `.ts` |
| `npm test` | Jest (todos os testes) |
| `npm run test:unit` | Jest (apenas `test/unit/`) |
| `npm run test:coverage` | Jest com relatório de coverage |
| `npm run test:watch` | Jest em watch mode |
| `npm run test:ci` | Jest para CI/CD (coverage + ci + forceExit) |

---

## Testes Automatizados

| Métrica | Valor |
|---|---|
| Test Suites | 15 passando |
| Testes | 138 passando |
| Tempo | ~3s |

### Cobertura por Área

| Área | Arquivos Testados |
|---|---|
| **Config** | env, logger |
| **Errors** | httpError (400, 401, 403, 404, 409, 429, 500) |
| **Middlewares** | authMiddleware, errorHandler, rateLimiter, securityMiddleware, validationMiddleware, dateConverterMiddleware |
| **Routes** | health (/health, /healthz), auth (signin, refresh, logout, forgot/reset-password, signup=404) |
| **Utils** | password (bcrypt), recaptcha (bypass em test), validates (sanitização, disposable email), index (sleep, randomInt, cleanObject) |

### Configuração

- **Framework:** Jest 29 + ts-jest
- **Setup:** `test/setup.ts` (env vars, console mocking, timeout)
- **Coverage threshold:** 30% global
- **Exclusões de coverage:** `server.ts`, `database/**`, `jobs/**`

---

## Configuração do Ambiente

```env
# Server
NODE_ENV=development
PORT=3007
HOST=0.0.0.0
TRUST_PROXY=0
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=***
DB_PASSWORD=***
DB_NAME=db_flashcards
DB_CONNECTION_LIMIT=10
DB_CONNECT_TIMEOUT=10000

# JWT
JWT_SECRET=***
JWT_REFRESH_SECRET=***
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
REFRESH_TOKEN_REMEMBER_DAYS=30

# reCAPTCHA v3 + v2 (fallback)
RECAPTCHA_V3_SECRET_KEY=
RECAPTCHA_V3_SITE_KEY=
RECAPTCHA_V2_SECRET_KEY=
RECAPTCHA_V2_SITE_KEY=
RECAPTCHA_MIN_SCORE=0.5

# CORS & Cookies
CORS_ORIGINS=http://localhost:3007,http://localhost:5177
CROSS_SITE_COOKIES=false
COOKIE_DOMAIN=

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=***
SMTP_PASS=***
SMTP_FROM="Flashcards <noreply@flashcards.com>"
```

---

## Como Rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 3. Criar banco de dados
mysql -u root -e "CREATE DATABASE db_flashcards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 4. Executar migrations (cria as 11 tabelas + seed do usuário develop)
npm run migration

# 5. Rodar em desenvolvimento
npm run dev

# 6. Acessar docs
# http://localhost:3007/docs

# Credenciais do usuário develop (criado pela migration)
# Email: lucasleal@dombarreto.g12.br
# Senha: shockwave003
```

---

## Próximos Passos

- [ ] Implementar envio real de emails (EmailService com nodemailer)
- [ ] Adicionar testes de integração (supertest + banco real)
- [ ] Testes de rotas protegidas (deck, card, review, sync, users, logs)
- [ ] Testes de services com repository mockado
- [ ] Atualizar Swagger YAML para cobrir: users, logs, preview, undo, suspend/bury
- [ ] Configurar CI/CD
- [ ] Configurar nginx reverse proxy
- [ ] Adicionar importação/exportação de decks (formato Anki `.apkg`)
- [ ] Implementar WebSocket para sync em tempo real
- [ ] Aumentar threshold de cobertura progressivamente
