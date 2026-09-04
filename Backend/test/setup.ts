// test/setup.ts — Configuração global para Jest (padrão Argyx)

// Variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '9999';
process.env.HOST = '127.0.0.1';
process.env.LOG_LEVEL = 'error';

// JWT (valores fake para testes unitários)
process.env.JWT_SECRET = 'test-jwt-secret-32chars-minimum!!';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-32chars!!';
process.env.JWT_EXPIRES_IN = '15m';

// DB (não usado em testes unitários, mas necessário para imports)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'flashcards_test';

// CORS
process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:3000';

// reCAPTCHA (vazio = bypass em test)
process.env.RECAPTCHA_V3_SECRET_KEY = '';
process.env.RECAPTCHA_V2_SECRET_KEY = '';

// Mock de console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Timeout padrão
jest.setTimeout(10000);
