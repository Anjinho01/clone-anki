# Testes — Flashcards Backend

Suite de testes automatizados seguindo padrões dos projetos **Quoti** (integração) e **Argyx** (unitários).

## Estrutura

```
test/
├── setup.ts                          # Setup global (env vars, console mocking)
└── unit/
    ├── config/
    │   ├── env.test.ts               # Variáveis de ambiente e helpers
    │   └── logger.test.ts            # Logger Winston
    ├── errors/
    │   └── httpError.test.ts         # Hierarquia HttpError (400-500)
    ├── middlewares/
    │   ├── authMiddleware.test.ts     # verifyToken, optionalAuth, requireRole
    │   ├── dateConverterMiddleware.test.ts  # Date → ISO-8601
    │   ├── errorHandler.test.ts      # Handler centralizado + notFoundHandler
    │   ├── rateLimiter.test.ts       # Rate limiters (global, auth, password, sync)
    │   ├── securityMiddleware.test.ts # Headers, noCacheAuth, abortDetection
    │   └── validationMiddleware.test.ts    # express-validator wrapper
    ├── routes/
    │   ├── auth.test.ts              # Rotas de autenticação (supertest + mocks)
    │   └── health.test.ts            # /health e /healthz
    └── utils/
        ├── index.test.ts             # sleep, randomInt, cleanObject
        ├── password.test.ts          # hashPassword, comparePassword (bcrypt)
        ├── recaptcha.test.ts         # verifyRecaptcha v3/v2, bypass em test
        └── validates.test.ts         # isDisposableEmail, stripHtml, sanitize, toISO
```

## Scripts

| Comando             | Descrição                                        |
|---------------------|--------------------------------------------------|
| `npm test`          | Roda todos os testes (runInBand + detectOpenHandles) |
| `npm run test:unit` | Roda apenas testes unitários (`test/unit/`)       |
| `npm run test:coverage` | Testes com relatório de cobertura             |
| `npm run test:watch` | Modo watch (re-roda em mudanças)                 |
| `npm run test:ci`   | Usado em CI/CD (coverage + ci + forceExit)        |

## Padrões Utilizados

### Unitários (padrão Argyx)

- **`jest.mock()`** para isolar dependências (services, repositories, DB)
- **Express app isolado** com `supertest` para testar rotas sem levantar servidor
- **Sem banco de dados** — todas as dependências externas são mockadas
- **`test/setup.ts`** define variáveis de ambiente e silencia console

### Cobertura Mínima

Configurada em `jest.config.js`:

```
coverageThreshold: {
  global: {
    branches: 30,
    functions: 30,
    lines: 30,
    statements: 30,
  }
}
```

## Futuro

- [ ] **Testes de integração** (padrão Quoti): supertest + banco real, em `test/integration/`
- [ ] Testes de rotas protegidas (deck, card, review, sync) com JWT mockado
- [ ] Testes de services com repository mockado
- [ ] Aumentar threshold de cobertura progressivamente
