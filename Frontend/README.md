# Flashcards Frontend

Aplicacao web do sistema de flashcards, desenvolvida com React, TypeScript e Webpack. A interface consome a API do backend e oferece os fluxos de autenticacao, organizacao de decks e pacotes, estudo, revisoes, sincronizacao e estatisticas.

## Requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- Flashcards Backend configurado e em execucao

## Instalacao

Na pasta `Frontend`:

```bash
npm install
```

A configuracao e carregada conforme o ambiente:

- Desenvolvimento: `.env.development`
- Producao: `.env.production`

Os campos principais sao:

```env
PUBLIC_URL=
PORT=8377
API_URL=http://localhost:3000
PROXY_ROUTES=/api
PROXY_TARGET=http://localhost:3000
RECAPTCHA_SITE_KEY=
```

`API_URL` e `PROXY_TARGET` devem apontar para a porta usada pelo backend. O arquivo de desenvolvimento deste projeto pode estar configurado com valores locais diferentes; mantenha os dois projetos alinhados.

## Desenvolvimento

Inicie o backend e, em outro terminal, execute:

```bash
npm run dev
```

O Webpack Dev Server abre a aplicacao em `http://localhost:8377` por padrao. A porta real e a definida em `PORT`.

## Build de producao

Configure `.env.production` e gere os arquivos estaticos:

```bash
npm run build
```

O resultado fica em `build/` e pode ser servido por Nginx, Apache ou outro servidor de arquivos estaticos.

Para inspecionar o tamanho do bundle:

```bash
npm run build:analyze
npm run analyze
```

## Testes e qualidade

```bash
npm test
npm run test:watch
npm run test:coverage
npm run lint
npm run format
```

## Estrutura principal

- `src/app/`: paginas, componentes, servicos, estado e rotas da aplicacao
- `src/app/services/api.ts`: cliente HTTP e URL base da API
- `webpack/`: configuracoes de desenvolvimento e producao
- `public/`: HTML, manifesto e assets publicos
- `build/`: artefatos gerados pelo build, nao usados como fonte

## Documentacao relacionada

A documentacao funcional e tecnica compartilhada esta em [../documentation/README.md](../documentation/README.md). A especificacao da API consumida pelo frontend esta em [../Backend/docs/](../Backend/docs/).
