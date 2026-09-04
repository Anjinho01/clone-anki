# Flashcards Backend

API REST do sistema de flashcards, desenvolvida com Node.js, TypeScript e Express. O backend gerencia autenticacao, usuarios, decks, cards, pacotes, revisoes, sincronizacao, notificacoes e permissoes. O algoritmo de repeticao espacada usa FSRS por meio do pacote `ts-fsrs`.

## Requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- MySQL 8 ou compativel

## Instalacao

Na pasta `Backend`:

```bash
npm install
```

Configure o arquivo `Backend/.env` antes de iniciar a API. As variaveis mais importantes sao:

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=flashcards_db
CORS_ORIGINS=http://localhost:8377
ENABLE_SWAGGER=true
```

Nao versionar senhas, tokens JWT, chaves de reCAPTCHA ou credenciais SMTP.

## Banco de dados

Crie o banco `flashcards_db` no MySQL e execute a migration:

```bash
npm run migration
```

A migration usa as configuracoes `DB_*` do arquivo `.env`.

## Desenvolvimento

```bash
npm run dev
```

Por padrao, a API fica disponivel em `http://localhost:3000`. O projeto atualmente pode usar outra porta no `.env`; nesse caso, ajuste tambem `API_URL`, `PROXY_TARGET` e `CORS_ORIGINS` do frontend.

Endpoints de verificacao:

- `GET /health`: verifica API e conexao com o banco
- `GET /healthz`: verifica somente se o processo HTTP esta respondendo
- `GET /docs`: Swagger UI, habilitado por padrao fora de producao

## Producao

Compile e inicie a versao compilada:

```bash
npm run build
npm start
```

Para usar PM2:

```bash
npm run start:pm2
npm run stop:pm2
```

Em producao, defina `NODE_ENV=production`, segredos JWT fortes com pelo menos 32 caracteres e todas as credenciais necessarias. A validacao de ambiente impede o uso dos segredos padrao.

## Testes e qualidade

```bash
npm test
npm run test:unit
npm run test:coverage
npm run lint
npm run format
```

Os testes unitarios ficam em `test/unit/` e nao dependem de um banco real. A documentacao detalhada da suite esta em [test/README.md](test/README.md).

## Documentacao da API

Os contratos OpenAPI estao em [`docs/`](docs/), separados por modulo. A documentacao funcional e tecnica do projeto esta em [../documentation/README.md](../documentation/README.md).
