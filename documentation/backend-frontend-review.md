# Auditoria Backend e Frontend

## Escopo pedido

1. Revisar Backend e Frontend novamente com foco em consistencia real de runtime.
2. Procurar scripts, textos e configuracoes que ainda usam `flashcard` no lugar de `package` quando o dominio correto ja mudou. (menos o nome do projeto, que é Flashcard)
3. Procurar vulnerabilidades introduzidas ou expostas por inconsistencias recentes.

## Item 1 — Documentacao de rotas do Backend

### Hipotese validada

- A documentacao OpenAPI do backend esta estruturalmente desatualizada.
- O Swagger carrega apenas os YAMLs em `Backend/docs`, mas o app monta mais grupos de rota do que os arquivos documentados cobrem.

### Evidencias

- Runtime real monta: `auth`, `decks`, `cards`, `packages`, `library-cards`, `reviews`, `sync`, `logs`, `users`, `roles`, `notifications`, alem de `health`, `healthz` e `metrics`.
- A pasta `Backend/docs` tinha apenas: `auth.yaml`, `base.yaml`, `cards.yaml`, `decks.yaml`, `reviews.yaml`, `sync.yaml`.
- Endpoints documentados ainda usam contratos antigos e omitem rotas atuais como `packageId`, `reviews/preview`, `reviews/undo`, `cards/:id/suspend`, `library-cards`, `logs`, `users`, `roles` e `notifications`.

### Acao imediata

- Atualizar os YAMLs existentes para refletir as rotas reais.
- Adicionar YAMLs faltantes para os grupos de rota ausentes.
- Revisar textos que ainda usam `flashcard` como agrupador de decks na documentacao backend.

### Rechecagem apos a reescrita

- A cobertura estrutural passou a refletir todos os grupos de rota montados em runtime.
- Restaram apenas divergencias finas de contrato, corrigidas em seguida:
	- `GET /decks/{key}` aceita chave numerica ou UUID, nao apenas inteiro simples no contrato.
	- `auth/signin` e `auth/forgot-password` tambem aceitam campos opcionais de reCAPTCHA e podem responder `449` quando exigem challenge adicional.
	- Rotas de `users` estavam documentadas de forma generica demais e foram alinhadas com query params e payloads realmente validados pelo backend.

## Item 2 — Residuos `flashcard` versus `package`

### Regra de triagem

- `package` deve ser usado para o agrupador de decks.
- `flashcard` pode continuar existindo quando significar o card reutilizavel em si, card de biblioteca, branding historico do produto ou compatibilidade controlada.

### Hotspots iniciais identificados

- Backend Swagger/base e textos auxiliares.
- Scripts e configs com nomes historicos do produto.
- Textos de UI e branding residual no frontend.
- Arquivos de migration/compatibilidade ainda expostos com nomenclatura antiga.

### Residuos ja confirmados como incorretos

- Descricao da role `monitor` ainda mencionando `grupos de flashcards` em migration de usuarios.
- Fixtures de testes de `package` ainda usando UUID textual `flashcard-uuid`.
- Algumas referencias auxiliares de documentacao e tela ainda misturando produto `Flashcards` com o dominio `package`.

## Item 3 — Revisao de vulnerabilidades

### Primeiros focos

- Endpoints sem documentacao tendem a esconder gaps de autorizacao, validacao ou cache.
- Contratos desatualizados aumentam risco de clientes enviarem payloads errados ou contornarem validacoes esperadas.
- Configuracoes, exemplos de ambiente e scripts merecem revisao por segredo hardcoded, CORS, cache, auth e limites.

### Proximo passo depois do item 1

- Rodar uma varredura focada de seguranca em Backend e Frontend e registrar achados por severidade.

## Achados iniciais de seguranca

### Alto

- `Backend/src/config/env.ts`: o backend ainda sobe com segredos JWT inseguros por padrao em ambiente nao produtivo. Isso facilita bootstrap local, mas tambem reduz a margem de seguranca em ambientes mal configurados e merece endurecimento.
- `Backend/src/database/users.migration.ts`: a migration ainda criava usuarios privilegiados com emails fixos e senha hardcoded conhecida. Isso era exploravel em qualquer ambiente onde a migration fosse executada sem revisao.

### Medio

- `Frontend/src/app/services/api.ts`: o fallback de `API_URL` aponta para um host externo padrao. Em ambiente mal configurado, isso pode fazer o frontend falar com um backend diferente do esperado.
- `Backend/src/swagger.ts`: a UI de docs exposta em `/docs` lista toda a superficie HTTP sem qualquer gate adicional. Em ambiente publico isso amplia enumeracao de endpoints.
- `Frontend/src/app/services/tokenStorage.ts` + `Frontend/src/app/main/login/LoginApp.tsx`: o frontend ainda persiste `refreshToken` em `localStorage`, embora o fluxo atual declare refresh token em cookie `httpOnly`. Isso amplia impacto de XSS.
- `Frontend/src/app/services/tokenStorage.ts`: o `accessToken` ainda permanece em `localStorage`. Isso continua deixando a sessao exposta caso exista XSS no frontend; nao foi alterado nesta rodada porque exige ajuste maior no fluxo de autenticacao.

### Baixo

- Nomes/textos inconsistentes aumentam risco operacional e de uso incorreto de payloads, especialmente em contratos de sync e docs antigas.
- `Backend/src/database/brainscapeImport.migration.ts`: a importacao Brainscape depende de arquivo externo e precisa manter compatibilidade com bootstrap sem seed privilegiado. O erro anterior tambem deixava o log opaco.

## Correcoes aplicadas nesta rodada

- OpenAPI do backend reescrita para refletir a superficie HTTP atual.
- Residuos incorretos de `flashcard` corrigidos em migration e fixtures de package.
- Persistencia de `refreshToken` em `localStorage` removida do frontend.
- Swagger do backend limitado por padrao fora de producao, com override explicito por ambiente.
- Fallback implicito para host externo em `API_URL` removido do frontend.
- Seed privilegiado da migration trocado para modo opt-in via ambiente, sem credenciais hardcoded no codigo.
- Validacao de producao endurecida para impedir uso dos secrets JWT padrao.
- Importacao Brainscape mantida na migration base, agora sem dependencia de `admin` hardcoded e com criacao/resolucao automatica do ator tecnico quando necessario.