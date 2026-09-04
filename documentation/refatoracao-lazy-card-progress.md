# Refatoracao Lazy Card Progress

## Objetivo

- Reduzir o crescimento artificial de `tb_card_progress` em decks publicos.
- Separar o conceito de card disponivel no deck do conceito de progresso do usuario.
- Manter o backend transacional em MySQL, sem introduzir MongoDB ou Redis nesta etapa.
- Preservar compatibilidade suficiente para review, sync e telas de deck durante a transicao.

## Decisoes de negocio e arquitetura

- `tb_deck_cards` continua sendo a fonte de verdade da disponibilidade do card dentro do deck.
- `tb_card_progress` deixa de ser precriado para todo card publico e passa a existir apenas quando o usuario realmente inicia o estudo.
- `tb_review_logs` passa a ser tratado explicitamente como historico imutavel de revisoes vinculado a `card_progress_id`.
- O core da arquitetura continua em MySQL.
- MongoDB foi descartado nesta fase porque o problema principal identificado era cardinalidade e materializacao, nao modelagem documental.
- Redis foi adiado porque ainda nao existe necessidade operacional clara de cache, fila ou desacoplamento de carga.
- Limites ativos registrados nesta rodada:
  - `150` decks privados por usuario
  - `2000` library cards privados por usuario
  - `200` decks publicos no total

## Modelo de dominio consolidado

- `tb_cards`: conteudo reutilizavel.
- `tb_deck_cards`: associacao entre deck e card reutilizavel.
- `tb_card_progress`: estado FSRS por usuario para um `deck_card`.
- `tb_review_logs`: eventos historicos de review associados a `card_progress_id`.

## Contrato de identidade de card

- `Card.id` deixou de representar implicitamente `tb_card_progress.id`.
- O identificador estavel do card no contexto do deck passa a ser `deckCardId`, retornado no campo `id` das leituras.
- O progresso do usuario passa a ser exposto separadamente em `progressId`.
- Cards ainda intocados podem ser retornados normalmente com `progressId = null`.

## Backend: repositorios

### `Backend/src/repositories/card.repository.ts`

- `CARD_SELECT` foi refeito para expor:
  - `deck_card.id AS id`
  - `progress.id AS progress_id`
  - campos FSRS com `COALESCE` quando o progresso ainda nao existe
- `findByDeck(deckId, userId)` passou a usar `LEFT JOIN` com `tb_card_progress`.
- `findByDeckCardId(deckCardId, userId)` foi introduzido para resolver cards acessiveis por associacao de deck, mesmo sem progresso materializado.
- `ensureProgressForDeckCardId(deckCardId, userId)` foi introduzido para criar progresso de forma controlada e idempotente.
- `findDueCards(deckId, userId, newLimit, reviewLimit)` foi alterado para:
  - descontar cards novos ja revisados hoje via `tb_review_logs`
  - selecionar cards `New` ja materializados
  - localizar `deck_cards` ainda intocados quando ainda houver limite de novos
  - materializar progresso apenas para os cards que realmente entrarao na sessao
  - manter due cards a partir do progresso existente
- `createInstancesForAllUsers(deckId, flashcardId)` deixou de gerar `tb_card_progress` em massa e passou a garantir apenas `tb_deck_cards`.

### `Backend/src/repositories/deck.repository.ts`

- `countCards(deckId, userId)` passou a contar disponibilidade via `tb_deck_cards` com `LEFT JOIN` em `tb_card_progress`.
- `countCardsForDecks(deckIds, userId)` recebeu a mesma regra.
- Cards sem progresso contam como `new`.
- Cards com `state > 0` e `due <= NOW()` continuam contando como `due`.

## Backend: servicos

### `Backend/src/services/user.service.ts`

- A criacao de usuario deixou de disparar precriacao de progresso para decks publicos.

### `Backend/src/database/brainscapeImport.migration.ts`

- A importacao Brainscape deixou de materializar `tb_card_progress` para todos os usuarios ativos.
- A migration agora importa apenas package, deck, card reutilizavel e associacao em `tb_deck_cards`.

### `Backend/src/database/users.migration.ts`

- O seed de usuarios privilegiados voltou a ficar alinhado com `env.ts`.
- A criacao de `develop` e `admin` pela migration agora e opt-in via ambiente.
- Credenciais hardcoded deixaram de ser parte do bootstrap padrao.

### `Backend/src/services/review.service.ts`

- `resolveCardReference(cardId, userId)` passou a aceitar tanto `progressId` legado quanto `deckCardId` estavel.
- `resolveCardForReview(cardId, userId, { ensureProgress })` foi introduzido para centralizar a resolucao e a materializacao controlada.
- `previewCard` agora aceita card ainda intocado via `deckCardId`.
- `submitReview` cria progresso sob demanda quando necessario antes de aplicar FSRS.
- `getCardHistory` retorna lista vazia para card sem progresso.
- `undoLastReview` retorna erro de regra de negocio quando o card ainda nao possui review/progresso para desfazer.

### `Backend/src/services/sync.service.ts`

- O sync passou a emitir cards usando `deckCardId` estavel como `id`.
- O payload de card passou a incluir `progressId` quando existir.
- A aplicacao de mudancas vindas do cliente aceita `data.progressId` explicitamente.
- Operacoes legadas que ainda enviam `id` como `progressId` continuam aceitas para compatibilidade.

### `Backend/src/services/card.service.ts`

- A listagem de cards por deck passou a refletir o novo contrato com `id` estavel e `progressId` opcional.
- As mutacoes de `suspend`, `unsuspend` e `bury` passaram a devolver `progressId` e `deckCardId`, eliminando a necessidade de um `GET` extra no frontend para reconciliar o estado local.

## Backend: modelos e DTOs

### `Backend/src/models/card.model.ts`

- `CardRow.id` passou a representar `deck_card.id`.
- `progress_id` passou a ser opcional/nulo.
- `user_id` e `due` passaram a aceitar `null` para cards ainda intocados.
- `Card.progressId` foi adicionado ao modelo exposto.
- `toCard` foi ajustado para mapear `progress_id` em `progressId`.

### `Backend/src/dtos/review.dto.ts`

- A documentacao do DTO passou a esclarecer que `cardId` pode ser `progressId` legado ou `deckCardId` estavel.

## Backend: documentacao OpenAPI

### `Backend/docs/reviews.yaml`

- A documentacao de `preview`, `submit review`, `history` e `undo` foi atualizada para refletir:
  - suporte a `deckCardId`
  - presenca opcional de `progressId`
  - criacao lazy de progresso quando exigido pela operacao

## Frontend

### `Frontend/src/app/main/decks/types/DeckTypes.ts`

- `CardType` passou a expor `progressId?: number | null`.
- `userId?: number | null` e `due?: string | null` passaram a refletir cards intocados.

### `Frontend/src/app/main/decks/store/studySlice.ts`

- A remocao/atualizacao local apos review passou a usar o `id` retornado pelo servidor como identificador estavel do `deckCard`.

### `Frontend/src/app/main/decks/DeckStudyApp.tsx`

- O envio de review passou a usar `progressId` quando presente e `deckCardId` como fallback quando o card ainda esta intocado.
- Isso permite que o backend materialize o progresso sob demanda no primeiro review, sem esconder cards novos da sessao.

### `Frontend/src/app/main/decks/DeckDetailApp.tsx`

- Operacoes de `suspend`, `unsuspend` e `bury` passaram a depender de `progressId`.
- Cards intocados aparecem como estudaveis, mas sem mutacoes que exigem progresso.
- Quando `due` esta nulo, a tela exibe o equivalente a "Ainda nao iniciado".

### `Frontend/src/app/main/decks/store/cardSlice.ts`

- `suspend`, `unsuspend` e `bury` continuam operando por `progressId`, mas agora recebem `deckCardId` diretamente da API para manter o estado local coerente.
- O `GET /cards/:id` adicional deixou de ser necessario nesse fluxo.

### `Frontend/src/app/main/profile/components/ProfileMenu.tsx`

- A navegacao do profile foi alinhada com as rotas reais do app em `/me/...`.
- O acesso a `security` deixou de depender de um path antigo em `/configs/me/...`.

## Testes adicionados

### Servicos

- `Backend/test/unit/services/review.service.test.ts`
  - preview via `deckCardId` intocado
  - submit review com criacao lazy de progresso
  - history vazio sem progresso
  - undo bloqueado sem progresso
  - undo aceitando `deckCardId`
- `Backend/test/unit/services/sync.service.test.ts`
  - primeiro sync com `deckCardId` estavel e `progressId` opcional
  - update aceitando `progressId` explicito
  - delete mantendo compatibilidade com `id` legado como `progressId`
- `Backend/test/unit/services/card.service.test.ts`
  - listagem com card intocado usando `id` estavel e `progressId = null`
  - listagem com card iniciado preservando `progressId`

### Repositorios

- `Backend/test/unit/repositories/deck.repository.test.ts`
  - `countCards` tratando cards intocados como `new`
  - `countCardsForDecks` agregando corretamente por deck
  - retorno vazio sem consulta quando nao ha decks
- `Backend/test/unit/repositories/card.repository.test.ts`
  - `findByDeckCardId`
  - `ensureProgressForDeckCardId`
  - `findDueCards` com e sem materializacao lazy
  - `createInstancesForAllUsers` sem precriacao de progresso

## Validacao executada

- `npm run build` no backend passou apos os ajustes de contrato.
- Suites focadas de servico e repositorio foram executadas durante a implementacao.
- Validacao final registrada nesta rodada: `npm run test:unit -- --runInBand` no backend com todas as suites passando.
- O frontend foi revisado novamente contra o backend e buildado com sucesso apos os ajustes finais de rota e contrato.

## Itens deliberadamente adiados

- Nenhuma alteracao foi aplicada ao mobile nesta rodada.
- Redis continua adiado.
- MongoDB continua fora do escopo.
- Ainda nao foram adicionados testes de integracao com banco real para as queries SQL.

## Estado final da refatoracao

- O catalogo de decks/cards publicos continua visivel sem precisar precriar progresso para todos os usuarios.
- O progresso do usuario agora cresce por uso real, nao pela mera existencia de decks publicos.
- Review, sync, listagem de cards e contagens de deck foram alinhados ao modelo `deckCardId` estavel + `progressId` opcional.
- A importacao Brainscape tambem passou a respeitar essa regra e nao cria mais `tb_card_progress` em massa.
- O bootstrap de usuarios privilegiados voltou a ser controlado por ambiente, sem credenciais hardcoded no fluxo padrao.
- A refatoracao ficou coberta por testes unitarios em servicos e repositorios.