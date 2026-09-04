# Resumo de PR - Lazy Card Progress

## Contexto

- O sistema estava materializando `tb_card_progress` cedo demais, inclusive para cards publicos que o usuario nunca estudou.
- Isso inflava a cardinalidade principalmente em decks publicos e misturava dois conceitos diferentes sob o mesmo identificador: disponibilidade do card no deck e progresso do usuario.

## O que mudou

- O backend passou a tratar `tb_deck_cards` como disponibilidade e `tb_card_progress` como estudo realmente iniciado.
- Cards por deck agora usam `deckCardId` estavel como identidade de leitura e expõem `progressId` separadamente quando o progresso existe.
- A sessao de estudo passou a criar progresso sob demanda apenas para os cards que realmente entram na sessao.
- Review, sync, listagem de deck e contagens foram ajustados para o novo contrato.
- O frontend passou a respeitar `progressId` opcional em estudo, detalhe do deck e atualizacao local de estado.
- A importacao Brainscape deixou de precriar `tb_card_progress` para todos os usuarios.
- O seed privilegiado da migration voltou a ser opt-in via ambiente.

## Impacto

- O catalogo publico continua visivel sem precriar progresso para todos os usuarios.
- O crescimento de `tb_card_progress` passa a acompanhar uso real, nao apenas existencia de conteudo publico.
- O contrato ficou mais correto para cards intocados e preserva compatibilidade controlada com `progressId` legado em fluxos de review e sync.
- O bootstrap do banco ficou mais seguro e mais coerente com a modelagem lazy.

## Testes e validacao

- Foram adicionados testes unitarios de servico para review, sync e listagem de cards.
- Foram adicionados testes unitarios de repositorio para contagens, resolucao por `deckCardId`, materializacao lazy e garantias de nao precriacao em massa.
- Validacao final executada no backend: `npm run test:unit -- --runInBand`, com todas as suites passando.

## Fora de escopo nesta rodada

- Nenhuma alteracao no mobile.
- Nenhuma introducao de MongoDB ou Redis.
- Sem testes de integracao com banco real nesta etapa.
- As mutacoes de card passaram a receber `deckCardId` diretamente da API, eliminando a chamada extra de reconciliacao no frontend.

## Ajustes finais desta rodada

- O menu de profile foi alinhado com as rotas reais em `/me/profile` e `/me/security`.
- A migration Brainscape passou a importar apenas catalogo e associacoes, sem criar progresso em massa.
- A migration de usuarios passou a respeitar as flags de seed presentes em `env.ts`.

## Revisao final Frontend x Backend

- Nao restou desvio critico novo no contrato lazy entre frontend e backend.
- O estado local do detalhe do deck passou a ser atualizado por `deckCardId`, que e o identificador real da entidade renderizada no frontend.

## Documentos relacionados

- [refatoracao-lazy-card-progress.md](refatoracao-lazy-card-progress.md)
- [business-limits.md](business-limits.md)
