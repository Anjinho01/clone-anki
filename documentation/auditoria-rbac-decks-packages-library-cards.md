# Matriz RBAC Geral

## Escopo

Esta matriz consolida as regras de acesso atualmente implementadas para os modulos auditados do backend e o alinhamento visivel do frontend.

Data da revisao: 2026-04-26.

Fonte de verdade: backend. O frontend e tratado como camada de exposicao das regras ja implementadas no servidor.

## Hierarquia

Hierarquia reconhecida pelo middleware:

`develop > admin > monitor > user`

Interpretacao funcional atual:

- `develop`: acesso total por role no middleware, mas continua sujeito a ownership estrito onde o service faz essa escolha.
- `admin`: gestao ampla de usuarios e conteudo publico, mas nao herda automaticamente ownership sobre conteudo privado de terceiros.
- `monitor`: gestao de conteudo publico de estudo e criacao de packages, sem permissao geral sobre conteudo privado de terceiros.
- `user`: estudo e autogestao do proprio conteudo privado e do proprio perfil.

## Matriz unica por modulo

| Modulo | Acao | develop | admin | monitor | user | Observacoes |
|---|---|---|---|---|---|---|
| Auth | `POST /auth/signin` | sim | sim | sim | sim | publico |
| Auth | `POST /auth/refresh` | sim | sim | sim | sim | publico |
| Auth | `POST /auth/logout` | sim | sim | sim | sim | publico |
| Auth | `POST /auth/forgot-password` | sim | sim | sim | sim | publico |
| Auth | `POST /auth/reset-password` | sim | sim | sim | sim | publico |
| Auth | `GET /auth/me` | sim | sim | sim | sim | proprio contexto autenticado |
| Auth | `PUT /auth/change-password` | sim | sim | sim | sim | propria conta autenticada |
| Roles | `GET /roles` e `GET /roles/:id` | sim | sim | nao | nao | route usa `requireRole('admin')` |
| Users | `GET /users/profile`, `GET /users/me`, `PUT /users/me`, `PUT /users/me/reset-password` | sim | sim | sim | sim | sempre no proprio contexto |
| Users | Listar e buscar usuarios | sim | sim | nao | nao | route usa `requireRole('admin')` |
| Users | Criar usuario | sim | sim | nao | nao | `admin` nao cria `develop`; validacao atual aceita apenas `develop/admin/user` como role alvo |
| Users | Editar usuario | sim | sim | nao | nao | `admin` nao altera `develop` nem promove para `develop`; validacao atual aceita apenas `develop/admin/user` |
| Users | Resetar senha de outro usuario | sim | sim | nao | nao | route usa `requireRole('admin')` |
| Users | Ativar/desativar usuario | sim | sim | nao | nao | `admin` nao desativa `develop`; ninguem desativa a propria conta |
| Decks | Listar decks | todos | todos | gerais + privados proprios | gerais + privados proprios | backend decide visibilidade no service |
| Decks | Buscar deck | qualquer deck | qualquer deck | geral + privado proprio | geral + privado proprio | deck privado de terceiro retorna como nao encontrado |
| Decks | Criar deck geral | sim | sim | sim | nao | se `user` enviar `general`, backend forca `private` |
| Decks | Criar deck privado | sim | sim | sim | sim | limite de 150 por usuario |
| Decks | Vincular `packageId` na criacao/edicao | sim | sim | sim | nao | tipo do deck deve combinar com o package |
| Decks | Editar/excluir deck geral | sim | sim | sim | nao | conteudo publico governado por role |
| Decks | Editar/excluir deck privado proprio | sim | sim | sim | sim | ownership estrito |
| Decks | Editar/excluir deck privado de terceiro | nao | nao | nao | nao | mesmo `develop/admin` nao herdam ownership |
| Cards | Listar cards do deck visivel ao usuario | sim | sim | sim | sim | leitura e sempre user-scoped |
| Cards | Buscar card por `progressId` | sim | sim | sim | sim | somente estado do proprio usuario |
| Cards | Suspender, reativar e enterrar card | sim | sim | sim | sim | somente progresso do proprio usuario |
| Cards | Desenterrar expirados | sim | sim | sim | sim | somente no proprio contexto de estudo |
| Deck composition | Adicionar/remover card em deck geral | sim | sim | sim | nao | deck geral so aceita card geral |
| Deck composition | Adicionar/remover card em deck privado proprio | sim | sim | sim | sim | ownership do deck privado |
| Deck composition | Adicionar/remover card em deck privado de terceiro | nao | nao | nao | nao | card privado tambem precisa combinar ownership |
| Reviews | Sessao de estudo, preview, submit, undo, stats, history | sim | sim | sim | sim | todas as operacoes sao sempre user-scoped sobre o proprio progresso/cards visiveis |
| Packages | Listar e buscar | sim | sim | sim | sim | packages atuais sao publicos |
| Packages | Criar | sim | sim | sim | nao | backend cria como `general` |
| Packages | Editar/excluir qualquer package | sim | sim | nao | nao | governado por role + autoria |
| Packages | Editar/excluir package criado por si | sim | sim | sim | nao | `monitor` so gerencia o que criou |
| Library cards | Listar cards reutilizaveis | todos | todos | gerais + privados proprios | gerais + privados proprios | backend decide visibilidade no service |
| Library cards | Buscar card reutilizavel | qualquer card | qualquer card | geral + privado proprio | geral + privado proprio | card privado de terceiro retorna como nao encontrado |
| Library cards | Criar card geral | sim | sim | sim | nao | se `user` enviar `general`, backend forca `private` |
| Library cards | Criar card privado | sim | sim | sim | sim | limite de 2000 por usuario |
| Library cards | Editar/excluir card geral | sim | sim | sim | nao | conteudo publico governado por role |
| Library cards | Editar/excluir card privado proprio | sim | sim | sim | sim | ownership estrito |
| Library cards | Editar/excluir card privado de terceiro | nao | nao | nao | nao | mesmo `develop/admin` nao herdam ownership |
| Logs | Listar activity logs | sim | sim | sim | proprio | service restringe `user` ao proprio `userId`; `monitor/admin/develop` veem tudo |
| Logs | Listar access logs | sim | sim | sim | proprio | service restringe `user` ao proprio `userId`; `monitor/admin/develop` veem tudo |
| Notifications | Listar inbox, unread count, marcar lida, marcar todas | sim | sim | sim | sim | sempre no proprio contexto autenticado |
| Sync | `POST /sync` | sim | sim | sim | sim | sincroniza apenas entidades do proprio usuario autenticado |

## Regras estruturais do dominio

- Conteudo `general` e governado por role: `monitor/admin/develop`.
- Conteudo `private` e governado por ownership, mesmo para `admin` e `develop`, em decks privados e library cards privados.
- `user` pode criar conteudo privado, mas nao pode promover esse conteudo para `general`.
- `monitor` possui um perfil misto: pode gerir conteudo publico de estudo, mas em packages continua preso a autoria para update/delete.

## Estado atual do frontend

### Rotas revisadas

| Rota | Auth atual | Estado |
|---|---|---|
| `/decks` | `user` | alinhada |
| `/decks/:deckKey` | `user` | alinhada |
| `/decks/:deckKey/study` | `user` | alinhada |
| `/decks/manage` | `monitor` | alinhada |
| `/packages` | `user` | alinhada |
| `/packages/:packageKey` | `user` | alinhada |
| `/library-cards` | `user` | alinhada |

### Ajustes de frontend concluidos nesta rodada

- `LibraryCardsApp` agora so exibe editar/excluir para card `general` quando a role pode gerir conteudo publico, e para card `private` apenas quando o usuario e o dono.
- `DecksManageApp` agora diferencia permissao por linha: deck `general` por role, deck `private` por ownership.
- `DeckDetailApp` agora so exibe CTA de adicionar card em deck `private` quando o usuario e o dono do deck.

### Divergencia residual conhecida

- `PackagesApp` continua mais restritivo que o backend para reordenacao: a UI deixa drag-and-drop apenas para `admin/develop`, enquanto o backend permitiria que `monitor` atualizasse `position` dos packages criados por ele.

## Inconsistencias observadas no proprio backend

- `user.routes.ts` reconhece `monitor` como role autenticada no sistema, mas a validacao de `POST /users` e `PUT /users/:id` ainda aceita apenas `develop/admin/user` como role alvo. Isso pode bloquear a administracao da role `monitor` pela API de usuarios mesmo com a role existente no dominio.