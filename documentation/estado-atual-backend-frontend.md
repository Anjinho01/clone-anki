# Estado Atual Backend e Frontend

## Escopo encerrado ate aqui

- Refatoracao lazy de `tb_card_progress` no backend.
- Alinhamento do frontend ao contrato `deckCardId` estavel + `progressId` opcional.
- Correcao da navegacao do profile para as rotas reais em `/me/...`.
- Correcao da importacao Brainscape para nao gerar progresso em massa.
- Correcao da migration de usuarios para seed privilegiado opt-in via ambiente.

## Backend

### Contrato de card

- `Card.id` representa `deckCardId` nas leituras.
- `progressId` passou a representar o progresso do usuario quando ele existe.
- `findByDeck`, `findDueCards`, `preview`, `submitReview`, `history`, `undo` e `sync` foram alinhados a esse contrato.

### Regras de materializacao

- `tb_deck_cards` representa disponibilidade de catalogo no deck.
- `tb_card_progress` so deve existir quando o estudo realmente comecar ou quando uma operacao exigir progresso.
- A importacao Brainscape agora respeita essa regra e nao cria mais progresso para todos os usuarios ativos.

### Bootstrap e seeds

- Roles continuam sendo seeded por padrao.
- Usuarios privilegiados (`develop` e `admin`) nao fazem mais parte do bootstrap implicito.
- A migration de usuarios agora usa as flags de ambiente previstas em `env.ts`.

## Frontend

### Fluxo de estudo

- O envio de review usa `progressId` quando disponivel.
- Para card ainda intocado, o frontend envia `deckCardId` como referencia, permitindo que o backend crie o progresso sob demanda.
- A fila local de estudo remove o card pelo `deckCardId` retornado pelo backend apos o review.

### Detalhe do deck

- `suspend`, `unsuspend` e `bury` continuam exigindo `progressId`.
- O estado local do detalhe do deck passou a ser atualizado por `deckCardId`, que e o `id` real usado pelo adapter do frontend.
- A API de mutacao agora devolve `deckCardId` diretamente, entao o frontend nao precisa mais fazer um `GET /cards/:progressId` extra para resolver o update local.

### Profile

- O menu do profile agora navega para `/me/profile` e `/me/security`.
- Isso ficou coerente com o `ProfileConfig` real do app.

## Revisao final do contrato Frontend x Backend

- Nao foi encontrado novo desvio critico de runtime entre frontend e backend na area de decks/reviews apos os ajustes finais.
- Nao restou, nesta rodada, um desvio critico novo no contrato principal de decks/reviews entre frontend e backend.
- Mobile continua fora desta rodada e nao foi realinhado aqui.

## Validacoes executadas

- Backend: `npm run build`
- Backend: `npm run test:unit -- --runInBand`
- Frontend: lint focado nos arquivos alterados
- Frontend: `npm run build`

## Resultado pratico

- O runtime principal do sistema passou a tratar progresso como estado de estudo real, nao como efeito colateral de catalogo.
- O frontend consegue operar corretamente com cards ainda intocados.
- O banco nao deve mais inflar `tb_card_progress` durante a importacao Brainscape.
- O bootstrap do banco ficou mais coerente com o que a documentacao ja dizia que deveria acontecer.