# MER da Base de Dados

## MER principal do dominio

```mermaid
erDiagram
    tb_roles {
        INT id PK
        VARCHAR name UK
        VARCHAR description
        TIMESTAMP created_at
    }

    tb_users {
        INT id PK
        VARCHAR name
        VARCHAR email UK
        VARCHAR password_hash
        INT role_id FK
        BOOLEAN is_active
        INT created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    tb_packages {
        INT id PK
        CHAR uuid UK
        VARCHAR name
        TEXT description
        ENUM type
        INT owner_user_id FK
        INT created_by FK
        INT position
        BOOLEAN is_deleted
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    tb_decks {
        INT id PK
        CHAR uuid UK
        INT package_id FK
        VARCHAR name
        TEXT description
        ENUM type
        INT owner_user_id FK
        INT new_cards_per_day
        INT review_cards_per_day
        DECIMAL desired_retention
        INT position
        INT created_by FK
        BOOLEAN is_deleted
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    tb_cards {
        INT id PK
        CHAR uuid UK
        ENUM type
        INT owner_user_id FK
        INT created_by FK
        TEXT front
        TEXT back
        ENUM card_type
        JSON mcq_options
        INT mcq_correct
        BOOLEAN is_deleted
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    tb_deck_cards {
        INT id PK
        INT deck_id FK
        INT card_id FK
        INT position
        INT created_by FK
        BOOLEAN is_deleted
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    tb_card_progress {
        INT id PK
        INT deck_card_id FK
        INT user_id FK
        TINYINT state
        DOUBLE difficulty
        DOUBLE stability
        DOUBLE retrievability
        INT elapsed_days
        INT scheduled_days
        INT reps
        INT lapses
        TIMESTAMP due
        TIMESTAMP last_review
        BOOLEAN is_suspended
        BOOLEAN is_buried
        BOOLEAN is_deleted
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    tb_review_logs {
        INT id PK
        INT card_progress_id FK
        INT user_id FK
        TINYINT rating
        TINYINT state
        DOUBLE difficulty
        DOUBLE stability
        DOUBLE retrievability
        INT elapsed_days
        INT scheduled_days
        INT duration_ms
        TIMESTAMP reviewed_at
        TIMESTAMP created_at
    }

    tb_roles ||--o{ tb_users : role_id
    tb_users o|--o{ tb_users : created_by
    tb_users o|--o{ tb_packages : owner_user_id
    tb_users o|--o{ tb_packages : created_by
    tb_packages o|--o{ tb_decks : package_id
    tb_users o|--o{ tb_decks : owner_user_id
    tb_users o|--o{ tb_decks : created_by
    tb_users o|--o{ tb_cards : owner_user_id
    tb_users ||--o{ tb_cards : created_by
    tb_decks ||--o{ tb_deck_cards : contains
    tb_cards ||--o{ tb_deck_cards : reused_in
    tb_users o|--o{ tb_deck_cards : created_by
    tb_deck_cards ||--o{ tb_card_progress : instantiates
    tb_users ||--o{ tb_card_progress : studies
    tb_card_progress ||--o{ tb_review_logs : records
    tb_users ||--o{ tb_review_logs : owns
```

## MER das tabelas de suporte

```mermaid
erDiagram
    tb_users {
        INT id PK
    }

    tb_refresh_tokens {
        INT id PK
        INT user_id FK
        VARCHAR token_hash
        VARCHAR jti UK
        TIMESTAMP expires_at
        BOOLEAN is_revoked
        VARCHAR replaced_by
        TIMESTAMP created_at
    }

    tb_password_reset_tokens {
        INT id PK
        INT user_id FK
        VARCHAR code
        TIMESTAMP expires_at
        BOOLEAN is_used
        TIMESTAMP created_at
    }

    tb_access_logs {
        INT id PK
        INT user_id FK
        VARCHAR email
        BOOLEAN success
        VARCHAR ip_address
        TEXT user_agent
        TIMESTAMP created_at
    }

    tb_sync_log {
        INT id PK
        INT user_id FK
        TIMESTAMP synced_at
        TIMESTAMP created_at
    }

    tb_activity_logs {
        INT activity_id PK
        VARCHAR table_name
        INT record_id
        ENUM action
        INT user_id FK
        VARCHAR summary
        JSON details
        TIMESTAMP created_at
    }

    tb_notifications {
        BIGINT notification_id PK
        INT user_id FK
        ENUM audience_role
        VARCHAR title
        VARCHAR message
        VARCHAR link_url
        VARCHAR link_label
        JSON link_params
        BOOLEAN is_read
        DATETIME read_at
        DATETIME created_at
        DATETIME expires_at
        INT actor_user_id FK
    }

    tb_notification_receipts {
        BIGINT notification_id PK,FK
        INT user_id PK,FK
        DATETIME read_at
    }

    tb_users ||--o{ tb_refresh_tokens : owns
    tb_users ||--o{ tb_password_reset_tokens : resets
    tb_users o|--o{ tb_access_logs : actor
    tb_users ||--o{ tb_sync_log : syncs
    tb_users ||--o{ tb_activity_logs : acts
    tb_users o|--o{ tb_notifications : recipient
    tb_users o|--o{ tb_notifications : actor
    tb_notifications ||--o{ tb_notification_receipts : receipts
    tb_users ||--o{ tb_notification_receipts : reads
```

## Leitura do MER

- O eixo principal do dominio e `package -> deck -> deck_card -> card_progress -> review_log`.
- `tb_cards` e o conteudo reutilizavel que pode aparecer em varios decks.
- `tb_deck_cards` separa disponibilidade de catalogo do progresso do usuario.
- `tb_card_progress` so representa estudo iniciado.
- As tabelas de suporte vivem ao redor de `tb_users` para autenticacao, auditoria, notificacao e sync.