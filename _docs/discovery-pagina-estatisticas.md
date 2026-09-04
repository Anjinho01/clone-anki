# Discovery — Pagina de Estatisticas

> Objetivo: transformar a Etapa 6 em uma especificacao executavel, com MVP, fontes de dados reais e decisoes ainda pendentes.

---

## 1. O que o projeto ja tem hoje

### Backend disponivel

- Ja existe `GET /reviews/stats` para o usuario autenticado.
- O endpoint retorna hoje:
  - `totalReviews`
  - `averageDurationMs`
  - `retentionRate`
  - `reviewsByDay`
- A implementacao atual esta em:
  - `Backend/src/routes/review.routes.ts`
  - `Backend/src/controllers/review.controller.ts`
  - `Backend/src/services/review.service.ts`
  - `Backend/src/repositories/review.repository.ts`

### Frontend disponivel

- Existe um dashboard legado em `Frontend/src/app/main/_dashboard/overview`, mas ele nao pertence ao dominio atual de flashcards.
- Esse codigo referencia widgets e imports de outro contexto (`@spark`, cirurgias, centro cirurgico etc.).
- A rota tambem nao esta ativa em `Frontend/src/app/configs/routesConfig.tsx`.

### Conclusao tecnica

- O backend ja oferece um ponto de partida real para estatisticas pessoais de estudo.
- O frontend nao possui uma pagina de estatisticas reutilizavel no dominio correto.
- O dashboard legado nao deve ser reaproveitado funcionalmente; no maximo serve como referencia estrutural de pagina com widgets.

---

## 2. Recomendacao de escopo

### MVP recomendado

Comecar com uma pagina de estatisticas pessoais de estudo, porque isso ja possui suporte parcial no backend e exige menos decisoes de negocio do que metricas administrativas.

#### Proposta de MVP

- Exibir estatisticas do usuario autenticado.
- Permitir filtro simples por periodo: `7`, `30`, `90` dias.
- Exibir 4 cards-resumo:
  - total de revisoes
  - taxa de retencao
  - duracao media por revisao
  - dias com atividade no periodo
- Exibir um grafico de revisoes por dia.

### Fase 2 recomendada

Depois do MVP pessoal, incluir indicadores de conteudo:

- decks disponiveis
- grupos de flashcards
- cards totais
- decks com estudo pendente

### Fase 3 recomendada

So depois disso abrir o escopo administrativo para `admin` e `develop`:

- usuarios mais ativos
- producao de conteudo por role
- grupos criados por periodo
- distribuicao de decks publicos x privados

---

## 3. Proposta de perfis de acesso

### Usuario

- Ve apenas estatisticas pessoais de estudo.

### Monitor

- Ve estatisticas pessoais de estudo.
- Futuramente pode ganhar bloco adicional de conteudo criado por ele.

### Admin

- Ve estatisticas pessoais.
- Futuramente pode alternar para visao agregada do sistema.

### Develop

- Mesmo escopo de `admin` no MVP.

### Recomendacao pratica

No primeiro corte, liberar a pagina para `authRoles.user` e mostrar apenas dados pessoais. Isso reduz risco de escopo e evita inventar metricas administrativas sem regra de negocio fechada.

---

## 4. Fontes de dados reais hoje

### Ja disponivel

- `tb_review_logs`
  - total de reviews
  - duracao media
  - taxa de retencao aproximada por `rating >= 3`
  - serie temporal por dia

### Disponivel com baixo custo adicional

- `tb_decks`
  - total de decks visiveis
  - decks publicos x privados
- `tb_cards` / `tb_card_progress`
  - cards novos
  - cards devidos
  - cards totais por deck ou por usuario
- `tb_flashcards`
  - total de grupos de flashcards

### Nao definido ainda

- tempo total de estudo por sessao consolidada
- streak diario confiavel
- comparativos entre usuarios
- crescimento de conteudo por periodo com criterio fechado

---

## 5. Contratos recomendados

### Manter

- Manter `GET /reviews/stats?days=30` como base do bloco de estudo.

### Adicionar depois

Se a pagina precisar de mais de um bloco, o melhor caminho e separar contratos por responsabilidade.

#### Opcao recomendada

- `GET /reviews/stats?days=30`
  - estudo pessoal
- `GET /decks/summary`
  - total de decks, decks publicos, decks privados, decks com pendencias
- `GET /flashcards/summary`
  - total de grupos de flashcards

#### Evitar no inicio

- Um endpoint gigante de dashboard com tudo misturado.

Motivo:

- mais dificil de evoluir
- mistura metricas de estudo e metricas administrativas
- cria acoplamento desnecessario entre dominios

---

## 6. Estrutura sugerida da pagina

### Rota sugerida

- `/statistics` ou `/stats`

### Modulo sugerido

- `Frontend/src/app/main/statistics/`

### Estrutura sugerida

- `StatisticsConfig.tsx`
- `StatisticsApp.tsx`
- `components/`
- `store/`
- `types/`
- `models/`

### Layout sugerido

- hero curto com titulo e seletor de periodo
- grade de 4 cards-resumo
- grafico principal de reviews por dia
- bloco secundario com resumo de decks

Referencia visual complementar:

- ver `_docs/estatisticas-graficos-referencia-ecme.md`

---

## 7. Perguntas que ainda precisam de resposta

- A pagina de estatisticas sera visivel para todos os usuarios autenticados ou apenas alguns perfis?
- O nome final da rota deve ser `statistics`, `stats` ou `dashboard`?
- A taxa de retencao atual (`rating >= 3`) e suficiente como definicao de negocio?
- O sistema precisa mostrar `streak`? Se sim, qual a regra oficial?
- O tempo medio deve ser por review ou por sessao?
- `monitor` deve ver apenas estatisticas pessoais ou tambem estatisticas do conteudo criado por ele?
- `admin` e `develop` terao visao global do sistema nesta primeira versao ou isso fica para depois?

---

## 8. Recomendacao de execucao

### Proximo passo recomendado

Implementar primeiro a versao 1 com dados pessoais de estudo e filtro por periodo.

### Ordem sugerida

1. Criar a rota e o modulo `statistics` no frontend.
2. Consumir `GET /reviews/stats` com filtro por periodo.
3. Entregar cards-resumo + grafico de reviews por dia.
4. Validar com usuarios se as metricas fazem sentido.
5. So depois expandir para metricas de decks, flashcards e visoes administrativas.

---

## 9. Decisao tecnica atual

- Etapa 6 comecou como discovery e ja possui um primeiro MVP implementado no frontend.
- O primeiro corte mais seguro continua sendo uma pagina de estatisticas pessoais de estudo.
- O MVP atual usa a rota `/statistics`, filtro por `7`, `30` e `90` dias e o endpoint `GET /reviews/stats`.
- O dashboard legado nao entra como base funcional da nova pagina.
