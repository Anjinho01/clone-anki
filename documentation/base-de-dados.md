# Base de Dados

## Fonte de verdade

- Esta documentacao descreve a base a partir das migrations atuais em `Backend/src/database`.
- O banco principal continua sendo MySQL.
- `tb_packages`, `tb_decks` e `tb_cards` possuem `uuid` publico via migration dedicada.

## Visao geral por dominio

### Identidade e acesso

- `tb_roles`: catalogo de perfis RBAC.
- `tb_users`: usuarios do sistema, com criador opcional e role normalizada.
- `tb_refresh_tokens`: refresh tokens persistidos por usuario.
- `tb_password_reset_tokens`: codigos temporarios de redefinicao de senha.
- `tb_access_logs`: trilha de tentativas de acesso.

### Catalogo e conteudo

- `tb_packages`: agrupador logico de decks.
- `tb_decks`: deck publico ou privado.
- `tb_cards`: conteudo reutilizavel dos cards.
- `tb_deck_cards`: associacao N:N entre deck e card reutilizavel.

### Estudo e revisao

- `tb_card_progress`: estado FSRS por usuario em um `deck_card`.
- `tb_review_logs`: historico imutavel de revisoes associado a `card_progress_id`.

### Operacao e observabilidade

- `tb_sync_log`: checkpoints de sync por usuario.
- `tb_activity_logs`: trilha de CRUD por tabela e registro.
- `tb_notifications`: notificacoes unicast ou broadcast por role.
- `tb_notification_receipts`: recibos de leitura para notificacoes broadcast.

## Tabelas principais

### `tb_roles`

- Finalidade: normalizar papeis de acesso.
- Chave primaria: `id`.
- Colunas principais: `name`, `description`, `created_at`.
- Relacoes: 1:N com `tb_users`.

### `tb_users`

- Finalidade: cadastro principal de usuarios.
- Chave primaria: `id`.
- Colunas principais: `name`, `email`, `password_hash`, `role_id`, `is_active`, `created_by`, timestamps.
- Relacoes:
  - N:1 com `tb_roles`
  - auto-relacao opcional em `created_by`
  - 1:N com tokens, logs, progresso, notificacoes e auditoria
- Observacao: seed privilegiado agora e opt-in via ambiente.

### `tb_packages`

- Finalidade: agrupador logico que contem varios decks.
- Chave primaria: `id`.
- Identidade publica: `uuid`.
- Colunas principais: `name`, `description`, `type`, `owner_user_id`, `created_by`, `position`, `is_deleted`.
- Relacoes:
  - N:1 com `tb_users` em `owner_user_id`
  - N:1 com `tb_users` em `created_by`
  - 1:N com `tb_decks`

### `tb_decks`

- Finalidade: unidade de estudo configuravel.
- Chave primaria: `id`.
- Identidade publica: `uuid`.
- Colunas principais: `package_id`, `name`, `description`, `type`, `owner_user_id`, `new_cards_per_day`, `review_cards_per_day`, `desired_retention`, `position`, `created_by`, `is_deleted`.
- Relacoes:
  - N:1 com `tb_packages`
  - N:1 com `tb_users` em `owner_user_id`
  - N:1 com `tb_users` em `created_by`
  - 1:N com `tb_deck_cards`

### `tb_cards`

- Finalidade: conteudo reutilizavel dos cards.
- Chave primaria: `id`.
- Identidade publica: `uuid`.
- Colunas principais: `type`, `owner_user_id`, `created_by`, `front`, `back`, `card_type`, `mcq_options`, `mcq_correct`, `is_deleted`.
- Relacoes:
  - N:1 com `tb_users` em `owner_user_id`
  - N:1 com `tb_users` em `created_by`
  - 1:N com `tb_deck_cards`

### `tb_deck_cards`

- Finalidade: associacao entre deck e card reutilizavel.
- Chave primaria: `id`.
- Restricao principal: `UNIQUE (deck_id, card_id)`.
- Colunas principais: `deck_id`, `card_id`, `position`, `created_by`, `is_deleted`.
- Relacoes:
  - N:1 com `tb_decks`
  - N:1 com `tb_cards`
  - N:1 com `tb_users` em `created_by`
  - 1:N com `tb_card_progress`
- Observacao: esta tabela e a fonte de verdade da disponibilidade do card no deck.

### `tb_card_progress`

- Finalidade: estado de estudo FSRS do usuario para um `deck_card`.
- Chave primaria: `id`.
- Restricao principal: `UNIQUE (deck_card_id, user_id)`.
- Colunas principais: `state`, `difficulty`, `stability`, `retrievability`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `due`, `last_review`, `is_suspended`, `is_buried`, `is_deleted`.
- Relacoes:
  - N:1 com `tb_deck_cards`
  - N:1 com `tb_users`
  - 1:N com `tb_review_logs`
- Observacao: pela regra atual, nao deve ser precriado em massa para cards publicos intocados.

### `tb_review_logs`

- Finalidade: trilha historica imutavel de revisoes.
- Chave primaria: `id`.
- Colunas principais: `card_progress_id`, `user_id`, `rating`, `state`, snapshots FSRS pos-review, snapshots pre-review para undo, `duration_ms`, `reviewed_at`, `created_at`.
- Relacoes:
  - N:1 com `tb_card_progress`
  - N:1 com `tb_users`
- Observacao: suporta estatisticas, sync incremental e undo.

## Tabelas auxiliares

### `tb_refresh_tokens`

- Persistencia de refresh token por usuario.
- Relacao N:1 com `tb_users`.

### `tb_password_reset_tokens`

- Persistencia de codigos de reset de senha.
- Relacao N:1 com `tb_users`.

### `tb_access_logs`

- Registro de tentativas de login.
- Relacao opcional N:1 com `tb_users`.

### `tb_sync_log`

- Marca o ultimo checkpoint de sync por usuario.
- Relacao N:1 com `tb_users`.

### `tb_activity_logs`

- Auditoria de CRUD por tabela/registro.
- Relacao N:1 com `tb_users`.

### `tb_notifications`

- Notificacoes unicast por `user_id` ou broadcast por `audience_role`.
- Relacao opcional N:1 com `tb_users` como destinatario.
- Relacao opcional N:1 com `tb_users` como ator.

### `tb_notification_receipts`

- Marca leitura de notificacoes broadcast.
- Chave primaria composta: `(notification_id, user_id)`.
- Relacoes N:1 com `tb_notifications` e `tb_users`.

## Regras estruturais importantes

### Identidade publica

- `tb_packages.uuid`, `tb_decks.uuid` e `tb_cards.uuid` existem para navegacao e leitura publica.
- `id` numerico continua sendo usado internamente para joins e mutacoes.

### Separacao entre catalogo e estudo

- Catalogo:
  - `tb_packages`
  - `tb_decks`
  - `tb_cards`
  - `tb_deck_cards`
- Estudo do usuario:
  - `tb_card_progress`
  - `tb_review_logs`

### Lazy progress

- A associacao `deck -> card` pode existir sem progresso do usuario.
- O primeiro review ou a primeira operacao que exigir progresso e que deve criar a linha em `tb_card_progress`.
- A importacao Brainscape foi corrigida para respeitar esse comportamento.

## Fluxos de dados principais

### Criacao de catalogo

1. Cria-se um `tb_package`.
2. Cria-se um ou mais `tb_decks` dentro dele.
3. Cria-se conteudo reutilizavel em `tb_cards`.
4. O vinculo com o deck entra em `tb_deck_cards`.

### Inicio de estudo

1. O usuario enxerga cards disponiveis pelo `tb_deck_cards`.
2. Quando o card entra de fato em estudo, nasce a linha em `tb_card_progress`.
3. Revisoes posteriores passam a gerar `tb_review_logs`.

### Revisao e undo

1. `tb_card_progress` guarda o estado atual FSRS.
2. `tb_review_logs` registra o evento e os snapshots pre e pos-review.
3. O undo restaura o snapshot anterior a partir do ultimo log.