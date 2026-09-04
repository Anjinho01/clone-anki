# Plano de Alteracao — Renomear o Agrupador de Decks de `flashcards` para `packages`

> Objetivo: trocar a nomenclatura da entidade que hoje representa o agrupador de decks, saindo de `flashcards` para `packages`, cobrindo Backend, Frontend, testes e documentacao.

---

## 1. Decisao de dominio

### Problema atual

Hoje o termo `flashcards` esta sendo usado em dois sentidos diferentes:

- como nome do produto
- como nome do agrupador de decks

Isso gera ambiguidade, porque no dominio de estudo a palavra `flashcard` costuma remeter ao cartao de estudo em si, nao ao agrupador.

### Decisao proposta

Renomear a entidade de agrupamento de decks para `packages`.

### Escopo desta mudanca

Esta mudanca vale para:

- nomes de arquivos
- nomes de rotas da API
- nomes de tipos, DTOs, models e services
- nomes de tabelas e colunas relacionadas ao agrupador
- nomes de paginas, stores, navegacao e textos de UI
- testes e documentacao

### Fora do escopo

Nao devem ser renomeados nesta alteracao:

- o nome do produto `Flashcards`
- o conceito de `card` / `library card`
- referencias onde `flashcardId` hoje significa o card reutilizavel da biblioteca, e nao o agrupador de decks

Observacao importante:

- o dominio atual mistura `flashcard group` e `flashcard content`
- por isso a renomeacao precisa separar claramente o que vira `package` e o que continua sendo `card` ou `library card`

---

## 2. Regra de nomenclatura alvo

### Backend

- rota: `/flashcards` -> `/packages`
- controller: `flashcard.controller.ts` -> `package.controller.ts`
- service: `flashcard.service.ts` -> `package.service.ts`
- repository: `flashcard.repository.ts` -> `package.repository.ts`
- DTO: `flashcard.dto.ts` -> `package.dto.ts`
- model: `flashcard.model.ts` -> `package.model.ts`
- tabela: `tb_flashcards` -> `tb_packages`
- FK em decks: `flashcard_id` -> `package_id`

### Frontend

- pagina: `flashcards` -> `packages`
- rota web: `/flashcards` -> `/packages`
- detalhe: `/flashcards/:flashcardKey` -> `/packages/:packageKey`
- tipo: `FlashcardGroupType` -> `PackageType` ou `PackageGroupType`
- campo em deck: `flashcardId` -> `packageId`
- slice/store: `flashcardSlice` -> `packageSlice`

### UI

- `Grupos de Flashcards` -> `Packages`
- `Novo grupo` -> `Novo package`
- `Grupo indisponivel` -> `Package indisponivel`

Observacao:

- se a UI final for 100% em portugues, ainda vale decidir depois se `Packages` vira `Pacotes`
- este plano assume literalmente `packages`, conforme a decisao atual

---

## 3. Estrategia recomendada

### Recomendacao

Fazer a renomeacao em 3 camadas, nesta ordem:

1. Backend HTTP e dominio de aplicacao
2. Frontend web e navegacao
3. Persistencia, testes e docs finais

### Motivo

O trecho mais arriscado esta no banco:

- `tb_flashcards`
- `tb_decks.flashcard_id`
- FKs, indices, migration runner e dados existentes

Por isso o mais seguro e:

- primeiro estabilizar nomes externos e codigo de aplicacao
- depois fazer a migracao estrutural do banco

### Compatibilidade temporaria recomendada

Durante a transicao, considerar manter temporariamente:

- rota antiga `/flashcards` como alias de `/packages`
- campo antigo `flashcardId` como alias de `packageId` no payload, se houver clientes dependentes

---

## 4. Analise arquivo por arquivo — Backend

### Wiring e bootstrap

- `Backend/src/app.ts`
  - trocar import de `flashcardRoutes` para `packageRoutes`
  - trocar mount `app.use('/flashcards', ...)` para `app.use('/packages', ...)`
  - opcional de compatibilidade: manter `/flashcards` como alias temporario

- `Backend/src/database/migration.ts`
  - trocar `runFlashcardsMigration` por `runPackagesMigration`
  - revisar comentarios que citam `tb_flashcards`

### Migration e persistencia

- `Backend/src/database/flashcards.migration.ts`
  - renomear arquivo para `packages.migration.ts`
  - renomear funcao `runFlashcardsMigration` para `runPackagesMigration`
  - trocar `tb_flashcards` por `tb_packages`
  - trocar indices `idx_flashcards_*` por `idx_packages_*`
  - trocar comentarios de dominio para `packages`
  - trocar variaveis como `generalFlashcardId` por `generalPackageId`
  - trocar FK `fk_decks_flashcards` por `fk_decks_packages`
  - trocar logs `Migration: tb_flashcards` por `Migration: tb_packages`

- `Backend/src/database/decks.migration.ts`
  - trocar comentario e coluna `flashcard_id` para `package_id`
  - trocar indice `idx_decks_flashcard` para `idx_decks_package`
  - revisar comentario do campo no SQL

- `Backend/src/database/publicUuid.migration.ts`
  - trocar `ensurePublicUuid('tb_flashcards', ...)` para `tb_packages`
  - renomear constraint/indice publico de UUID

- `Backend/src/database/cards.migration.ts`
  - revisar comentarios legados que citam `tb_flashcards`
  - manter inalterado tudo que se refere ao conteudo de cards reutilizaveis, nao ao agrupador

### Camada HTTP

- `Backend/src/routes/flashcard.routes.ts`
  - renomear arquivo para `package.routes.ts`
  - trocar controller importado
  - revisar mensagens de validacao: `Nome do grupo` -> `Nome do package`

- `Backend/src/controllers/flashcard.controller.ts`
  - renomear arquivo para `package.controller.ts`
  - trocar nomes locais `flashcard` / `flashcards` por `package` / `packages`
  - revisar mensagens de sucesso

### DTOs, models e repositories

- `Backend/src/dtos/flashcard.dto.ts`
  - renomear arquivo para `package.dto.ts`
  - `CreateFlashcardDTO` -> `CreatePackageDTO`
  - `UpdateFlashcardDTO` -> `UpdatePackageDTO`
  - ajustar comentarios de dominio

- `Backend/src/models/flashcard.model.ts`
  - renomear arquivo para `package.model.ts`
  - `FlashcardRow` -> `PackageRow`
  - `Flashcard` -> `Package`
  - `toFlashcard` -> `toPackage`

- `Backend/src/repositories/flashcard.repository.ts`
  - renomear arquivo para `package.repository.ts`
  - `flashcardRepository` -> `packageRepository`
  - trocar SQL `tb_flashcards` -> `tb_packages`
  - revisar funcoes `findByUuid`, `findAll`, `create`, `update`, `softDelete`

- `Backend/src/repositories/flashcardGroup.repository.ts`
  - hoje ja e uma pista de rename parcial
  - decidir se este arquivo sera removido, consolidado ou renomeado para `package.repository.ts`
  - evitar coexistencia confusa entre `flashcard.repository.ts` e `flashcardGroup.repository.ts`

### Services e regras de negocio

- `Backend/src/services/flashcard.service.ts`
  - renomear arquivo para `package.service.ts`
  - `flashcardService` -> `packageService`
  - `canCreateFlashcards` -> `canCreatePackages`
  - `canManageFlashcard` -> `canManagePackage`
  - trocar mensagens de erro e activity log

- `Backend/src/services/deck.service.ts`
  - trocar `flashcardRepository` por `packageRepository`
  - trocar `resolveFlashcardGroupId` por `resolvePackageId`
  - trocar `requestedFlashcardId` por `requestedPackageId`
  - trocar mensagens `grupo de flashcards` por `package`
  - trocar uso de `fields.flashcard_id` por `fields.package_id`

- `Backend/src/dtos/deck.dto.ts`
  - trocar `flashcardId` por `packageId`
  - ajustar payloads de create/update de deck

- `Backend/src/models/deck.model.ts`
  - trocar `flashcard_id` por `package_id`
  - trocar `flashcardId` por `packageId`

- `Backend/src/repositories/deck.repository.ts`
  - trocar assinatura de `create` para `packageId`
  - trocar SQL `flashcard_id` por `package_id`

- `Backend/src/services/sync.service.ts`
  - hoje existe comentario de compatibilidade com `flashcardId`
  - revisar se `flashcardId` ali representa pacote ou card reutilizavel
  - manter inalterado o que se referir ao card real
  - renomear somente o que representar agrupador

### Swagger e docs de API

- `Backend/docs/base.yaml`
  - revisar descricoes que falem em `flashcards` como agrupador

- `Backend/docs/decks.yaml`
  - revisar schemas ou descricoes se houver referencia ao agrupador

- `Backend/docs/cards.yaml`
  - cuidado para nao renomear `flashcardId` se ali ele representar card reutilizavel

---

## 5. Analise arquivo por arquivo — Frontend Web

### Configuracao global de rotas e navegacao

- `Frontend/src/app/configs/routesConfig.tsx`
  - trocar import `FlashcardsConfig` por `PackagesConfig`

- `Frontend/src/app/configs/navigationConfig.ts`
  - trocar item `applications.flashcards`
  - trocar rota `/flashcards` para `/packages`
  - trocar titulo `Grupos de Flashcards` para `Packages`
  - possivelmente trocar `id` para `applications.packages`

- `Frontend/src/app/configs/navigation-icon.config.tsx`
  - renomear chaves como `applicationsFlashcards`, `flashcardsGeneral`, `flashcardsDecks`
  - manter icones, mas alinhar as chaves ao novo dominio

- `Frontend/src/app/main/RootRedirect.tsx`
  - trocar redirect do `monitor` de `/flashcards` para `/packages`

### Modulo principal da pagina

- `Frontend/src/app/main/flashcards/FlashcardsConfig.tsx`
  - renomear arquivo para `PackagesConfig.tsx`
  - trocar rota `/flashcards` para `/packages`
  - trocar detalhe `/flashcards/:flashcardKey` para `/packages/:packageKey`
  - trocar nomes de componentes lazy

- `Frontend/src/app/main/flashcards/FlashcardsApp.tsx`
  - renomear arquivo para `PackagesApp.tsx`
  - trocar variaveis `flashcards` por `packages`
  - trocar copy de UI: `Grupos de Flashcards`, `Novo grupo`, `Criar primeiro grupo`, etc.
  - trocar `navigate('/flashcards/...')` por `navigate('/packages/...')`

- `Frontend/src/app/main/flashcards/FlashcardDetailApp.tsx`
  - renomear arquivo para `PackageDetailApp.tsx`
  - trocar `flashcardKey` por `packageKey`
  - trocar mensagens e titulos de tela
  - trocar navegacao do detalhe para rota nova

- `Frontend/src/app/main/flashcards/components/FlashcardItem.tsx`
  - renomear para `PackageItem.tsx`
  - trocar prop `flashcard` por `package`
  - ajustar copy e badges

- `Frontend/src/app/main/flashcards/dialogs/FlashcardFormDialog.tsx`
  - renomear para `PackageFormDialog.tsx`
  - trocar `FlashcardGroupType` por `PackageType` ou `PackageGroupType`
  - trocar labels e placeholders
  - trocar vinculacao `flashcardId` por `packageId`

- `Frontend/src/app/main/flashcards/dialogs/DeleteFlashcardDialog.tsx`
  - renomear para `DeletePackageDialog.tsx`
  - trocar mensagens de confirmacao e props

- `Frontend/src/app/main/flashcards/types/FlashcardTypes.ts`
  - renomear arquivo para `PackageTypes.ts`
  - trocar re-export `FlashcardGroupType`
  - revisar constantes de label publico

- `Frontend/src/app/main/flashcards/models/FlashcardFormModel.ts`
  - renomear para `PackageFormModel.ts`
  - trocar tipos e schema associados

- `Frontend/src/app/main/flashcards/store/flashcardSlice.ts`
  - hoje e re-export do slice do modulo de decks
  - renomear para `packageSlice.ts`
  - trocar re-export correspondente

### Tipos e store compartilhados com decks

- `Frontend/src/app/main/decks/types/DeckTypes.ts`
  - manter `FlashcardType` se isso continuar representando o card da biblioteca
  - renomear `FlashcardGroupType` para `PackageType` ou `PackageGroupType`
  - trocar `DeckType.flashcardId` para `DeckType.packageId`
  - trocar comentarios que falam em `tb_flashcards` quando se referirem ao agrupador

- `Frontend/src/app/main/decks/store/flashcardSlice.ts`
  - renomear arquivo para `packageSlice.ts`
  - trocar actions `getFlashcards`, `createFlashcard`, `updateFlashcard`, `deleteFlashcard`
  - trocar endpoint `/flashcards` por `/packages`
  - trocar slice name `decksApp/flashcards` para `decksApp/packages`
  - trocar selectors e nomes de estado

- `Frontend/src/app/main/decks/store/index.ts`
  - trocar reducer key `flashcards` por `packages`

- `Frontend/src/app/main/decks/store/deckSlice.ts`
  - trocar `flashcardId` por `packageId`

- `Frontend/src/app/main/decks/dialogs/NewDeckDialog.tsx`
  - trocar payload e select de grupos para `packages`
  - trocar copy de vinculacao

- `Frontend/src/app/main/decks/dialogs/EditDeckDialog.tsx`
  - trocar `getFlashcards` por `getPackages`
  - trocar `FlashcardGroupOption` por `PackageOption`
  - trocar estado local e props de select

- `Frontend/src/app/store/listeners/deckNavListener.ts`
  - trocar imports do slice
  - trocar listeners `createFlashcard`, `updateFlashcard`, `deleteFlashcard`

- `Frontend/src/app/store/fuse/addDecksToNav.ts`
  - trocar comentarios de `flashcard groups` para `packages`
  - trocar tipo `ApiFlashcardGroup` para `ApiPackage`
  - trocar fetch `/flashcards` para `/packages`
  - trocar `flashcard-group.${uuid}` para `package.${uuid}`
  - trocar path dinamico `/flashcards/${uuid}` para `/packages/${uuid}`
  - trocar chave de icone, se necessario

### Ajustes de UI e redirecionamento indireto

- `Frontend/src/app/configs/navigationConfig.ts`
  - revisar ordem do item `Packages` no menu

- `Frontend/src/app/main/decks/FlashcardGroupsApp.tsx`
  - renomear alias para `PackagesApp`

- `Frontend/src/app/main/decks/FlashcardsLibraryApp.tsx`
  - revisar se este alias ainda faz sentido ou deve ser removido

---

## 6. Arquivos que exigem cuidado para NAO renomear no mesmo pacote

Estas referencias usam `flashcard` com outro significado e precisam de analise isolada:

- `Backend/src/services/card.service.ts`
  - aqui `flashcardId` parece representar o card reutilizavel da biblioteca

- `Backend/src/dtos/card.dto.ts`
  - revisar com cuidado antes de trocar `flashcardId`

- `Backend/src/repositories/card.repository.ts`
  - varias funcoes tratam `flashcardId` como card vinculado ao deck, nao como agrupador

- `Backend/src/repositories/sync.repository.ts`
  - `flashcard_id` parece ligado ao card do deck, nao ao agrupador

- `Frontend/src/app/main/decks/types/DeckTypes.ts`
  - `FlashcardType` deve provavelmente continuar como tipo do card reutilizavel

- `Frontend/src/app/main/libraryCards/**`
  - aqui `FlashcardType` representa conteudo de card da biblioteca
  - nao deve virar `PackageType`

### Regra pratica

Se o identificador aponta para:

- agrupador de decks -> vira `package`
- card reutilizavel ou card de biblioteca -> nao vira `package`

---

## 7. Testes impactados

### Backend

- `Backend/test/unit/services/flashcard.service.test.ts`
  - renomear para `package.service.test.ts`
  - trocar mocks/imports/model names

- `Backend/test/unit/services/deck.service.test.ts`
  - trocar mocks de repository/model
  - trocar `flashcardId` por `packageId` onde representar agrupador

- `Backend/test/setup.ts`
  - nao precisa mudar por causa do agrupador, a menos que o nome do banco de teste tambem mude

### Frontend

- hoje nao ha indicio claro de suite especifica para este modulo
  - se testes forem adicionados depois, usar nomenclatura `packages`

---

## 8. Documentacao impactada

- `_docs/checklist-novas-implementacoes.md`
  - revisar itens que falam em `flashcards` como agrupador

- `_docs/discovery-pagina-estatisticas.md`
  - trocar `grupos de flashcards` por `packages` nas metricas de conteudo

- `_docs/estatisticas-graficos-referencia-ecme.md`
  - trocar `grupos de flashcards` e `total de flashcards` quando o contexto for agrupador

- `_docs/resumo-backend.md`
  - revisar arquitetura, tabelas e proximos passos

- `_docs/pesquisa-flashcards-e-algoritmos.md`
  - nao mudar o que falar de flashcards como conceito de estudo

---

## 9. Ordem de execucao recomendada

### Fase 1 — Renomeacao externa e de aplicacao

- rotas HTTP
- controllers/services/repositories/models/DTOs do agrupador
- paginas, stores e navegacao do frontend
- textos de UI

### Fase 2 — Compatibilidade e transicao

- manter alias temporario `/flashcards` -> `/packages`
- manter alias de payload se houver necessidade de compatibilidade externa

### Fase 3 — Banco de dados

- migration para `tb_packages`
- migration para `tb_decks.package_id`
- migracao de indices, FKs e UUID publico

### Fase 4 — Testes e docs

- atualizar testes unitarios
- revisar docs tecnicos e funcionais

---

## 10. Riscos principais

- confundir agrupador de decks com card reutilizavel da biblioteca
- quebrar sync/offline se `flashcardId` for renomeado no lugar errado
- quebrar detalhes de deck se `flashcardId` em `DeckType` nao for migrado com cuidado
- quebrar links e redirects se `/flashcards` for removido sem alias temporario
- quebrar migrations existentes se a troca de tabela/coluna for feita sem estrategia de dados

---

## 11. Recomendacao final

Se a decisao for realmente seguir com `packages`, a mudanca deve ser tratada como renomeacao de dominio e nao apenas troca de label.

Ou seja:

- nao basta trocar textos de UI
- precisa separar explicitamente `package` de `card`
- e preciso fazer isso com compatibilidade temporaria para nao quebrar backend, frontend e dados existentes

O caminho mais seguro e:

1. renomear primeiro a camada de aplicacao e rotas
2. depois migrar tabela e coluna
3. por fim limpar aliases antigos de `flashcards`
