# Limites de Conteudo

## Baseline proposto

- Cada usuario pode ter no maximo 100 decks privados.
- Cada deck pode ter no maximo 200 cards associados como limite de precaucao.
- Portanto, cada usuario pode acumular no maximo 20.000 associacoes privadas entre deck e card.
- O sistema pode ter no maximo 200 decks publicos no total.
- Cada deck publico pode ter no maximo 200 cards associados.
- Portanto, o sistema pode acumular no maximo 20.000 associacoes publicas entre deck e card.
- O sistema pode ter no maximo 100 packages gerais.

## Leitura correta desses numeros

- O calculo `100 decks x 200 cards = 20.000` esta correto como teto de associacoes entre deck e card.
- Esse numero nao significa necessariamente 20.000 cards reutilizaveis unicos, porque o mesmo card pode aparecer em mais de um deck.
- Para decks privados, o teto e por usuario.
- Para decks publicos, o teto e global do sistema, nao por usuario com privilegios.
- Um usuario final pode enxergar ate 20.000 cards publicos distribuidos nos decks publicos, mas esse catalogo continua sendo compartilhado.

## Impacto tecnico por tipo

| Recurso | Limite proposto | Escopo real | Impacto principal |
| --- | --- | --- | --- |
| Deck privado | 100 por usuario | Por dono | Cresce `tb_decks`, `tb_deck_cards` e `tb_card_progress` do proprio usuario |
| Cards por deck privado | 200 por deck | Por deck | Define teto de associacoes privadas |
| Deck publico | 200 no total | Global | Cresce catalogo comum para todos |
| Cards por deck publico | 200 por deck | Global por deck | Multiplica custo em `tb_card_progress` para cada usuario com acesso |
| Package geral | 100 no total | Global | Organiza navegacao e descoberta, com baixo custo comparado a decks/cards |

## Papéis e governanca

- `user` pode criar e gerenciar apenas conteudo privado proprio.
- `monitor`, `admin` e `develop` podem criar conteudo publico.
- `monitor`, `admin` e `develop` podem criar packages gerais.
- A regra de governanca para editar conteudo publico precisa ser formalizada separando o desejado do que ja esta implementado.

## Analise dos possiveis enganos

### 1. Cards publicos nao sao "por usuario com privilegios"

- A frase "20.000 cards publicos por usuario com privilegios" mistura cota individual com catalogo compartilhado.
- Se o sistema so pode ter 200 decks publicos com 200 cards cada, entao o limite correto e 40.000 associacoes publicas globais.
- Admin, monitor e develop compartilham esse mesmo orcamento de decks e cards publicos.

### 2. Cards unicos e associacoes nao sao a mesma coisa

- O calculo proposto mede quantas ligacoes deck-card podem existir.
- Ele nao mede quantos registros unicos existem em `tb_cards`.
- Isso importa porque o mesmo card reutilizavel pode ser usado em mais de um deck.

### 3. O maior custo dos decks publicos e multiplicativo

- O custo mais sensivel de conteudo publico nao esta apenas em `tb_cards`.
- Quando um card publico entra em deck publico, o crescimento mais perigoso aparece em `tb_card_progress`, porque a distribuicao e compartilhada com todos os usuarios.
- Na pratica, 20.000 associacoes publicas podem se transformar em `20.000 x quantidade de usuarios com acesso` em estados de progresso.

## Divergencias entre proposta e implementacao atual

- Hoje o backend ainda usa 150 decks privados por usuario, nao 100.
- Hoje o backend ainda aplica limite explicito para cards reutilizaveis privados, nao para cards por deck.
- Hoje o backend permite que `monitor` crie deck publico, mas a edicao e exclusao de decks publicos continuam mais restritas.
- Hoje `monitor` pode criar package geral, mas so consegue editar ou excluir os packages que ele mesmo criou.
- Hoje nao existe limite implementado para quantidade total de packages gerais.

## Recomendacao de regra de negocio

- Tratar "cards por deck" como limite operacional.
- Tratar "decks publicos" e "packages gerais" como limites globais de catalogo.
- Tratar conteudo publico como recurso compartilhado, nunca como cota individual de quem tem privilegio.
- Se a equipe quiser medir custo de armazenamento real, acompanhar separadamente:
	- quantidade de cards reutilizaveis unicos em `tb_cards`
	- quantidade de associacoes em `tb_deck_cards`
	- quantidade de estados de estudo em `tb_card_progress`

## Decisoes arquiteturais atuais

- O core transacional continua em MySQL: `tb_users`, `tb_packages`, `tb_decks`, `tb_cards`, `tb_deck_cards`, `tb_card_progress` e `tb_review_logs`.
- Nao vamos introduzir MongoDB neste momento. O problema principal identificado e de modelagem e cardinalidade, nao de JSON.
- Nao vamos introduzir Redis por enquanto. Esse item fica adiado ate existir necessidade operacional clara de cache, fila ou desacoplamento de carga.

## Decisao sobre `tb_card_progress`

- O sistema deve parar de gerar `card_progress` para cards que o usuario ainda nao tocou.
- Deck publico continua sendo visivel e compartilhado no catalogo, mas o progresso passa a existir apenas quando o usuario realmente iniciar o estudo daquele card.
- Essa mudanca reduz drasticamente o crescimento artificial de `tb_card_progress`, principalmente em decks publicos.
- Em termos de modelagem, `tb_deck_cards` continua representando a disponibilidade do card no deck, enquanto `tb_card_progress` passa a representar apenas estudo iniciado de fato.

## O que e `review_logs`

- `tb_review_logs` e o historico imutavel de revisoes realizadas pelo usuario em cards ja estudados.
- Cada registro representa um evento de review, nao um card, nao um deck e nao um estado permanente.
- O log referencia um `card_progress_id`, porque o review acontece sobre o estado de estudo do usuario naquele card dentro de um deck especifico.
- O log guarda o rating enviado pelo usuario (`Again`, `Hard`, `Good`, `Easy`), o snapshot FSRS apos o review e tambem o snapshot anterior necessario para operacoes como undo.
- O log tambem guarda `duration_ms`, `reviewed_at` e `created_at`, o que permite analise de ritmo, retencao e volume de estudo ao longo do tempo.

## Papel de `review_logs` no dominio

- `tb_card_progress` representa o estado atual de estudo.
- `tb_review_logs` representa a trilha historica que explica como o estado atual foi alcancado.
- `tb_review_logs` nao deve ser tratado como cache descartavel, porque ele sustenta estatisticas, sync incremental e recuperacao do estado anterior de revisoes.

## Consequencias praticas dessa definicao

- Se um card ainda nao foi estudado, ele nao precisa ter linha em `tb_card_progress` nem em `tb_review_logs`.
- O primeiro contato com o card deve criar o `card_progress` inicial; os reviews seguintes passam a gerar eventos em `tb_review_logs`.
- O crescimento de `tb_review_logs` depende do habito de estudo ao longo do tempo.
- O crescimento de `tb_card_progress` deixa de depender da simples existencia de decks publicos e passa a depender do uso real.

## Plano de implementacao incremental

### Fase 1. Remover a criacao massiva de progresso publico

- Parar de criar `tb_card_progress` para todos os usuarios ao adicionar card em deck publico.
- Parar de criar `tb_card_progress` para todos os decks publicos no momento de criacao de usuario.
- Manter `tb_deck_cards` como fonte de verdade da disponibilidade do card no deck.

### Fase 2. Ajustar contagens e sessao de estudo

- `cardCount.total` deve passar a contar disponibilidade em `tb_deck_cards`, nao apenas linhas existentes em `tb_card_progress`.
- `cardCount.new` deve considerar tanto progresso em estado `New` quanto cards disponiveis sem progresso ainda criado.
- A sessao de estudo deve selecionar cards disponiveis no deck e criar `tb_card_progress` sob demanda apenas para os cards que entrarem de fato na sessao.

### Fase 3. Corrigir o contrato de leitura de cards por deck

- Hoje o contrato de `CardType.id` assume que o valor e sempre `tb_card_progress.id`.
- Isso impede retornar cards intocados sem materializar progresso antes da hora.
- Para suportar lazy progress corretamente, o contrato precisa separar:
	- identificador da associacao disponivel no deck
	- identificador do progresso do usuario, quando ele existir
- Enquanto essa separacao nao acontecer, qualquer leitura de cards por deck continuara pressionando a materializacao antecipada ou escondendo cards intocados.

### Fase 4. Ajustar operacoes que hoje dependem de `card_progress.id`

- `suspend`, `unsuspend`, `bury`, `preview`, `history`, `undo` e `submitReview` hoje assumem que o card ja possui `tb_card_progress.id`.
- O frontend tambem usa esse mesmo `id` para mutacoes locais e remotas.
- Depois da mudanca de contrato, essas operacoes devem trabalhar com `progressId` quando existir, ou disparar criacao controlada de progresso apenas quando a operacao realmente exigir isso.

### Fase 5. Ajustar sync

- O sync atual busca apenas cards que ja existem em `tb_card_progress`.
- Com lazy progress, isso deixa de representar todo o catalogo disponivel ao usuario.
- O sync precisa distinguir:
	- cards disponiveis por deck
	- progresso efetivamente iniciado
	- historico de reviews

## Risco principal de implementacao

- O maior risco nao esta na query de banco em si.
- O maior risco esta no contrato atual, que mistura "card disponivel no deck" com "estado de progresso do usuario" sob o mesmo identificador.
- Portanto, a migracao correta precisa separar disponibilidade e progresso antes de remover completamente a materializacao antecipada em todas as leituras.