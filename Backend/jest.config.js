/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Transformação de arquivos TypeScript
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  // Extensões de arquivos suportadas
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Padrões de arquivos de teste
  testMatch: ['**/test/**/*.test.ts', '**/test/**/*.spec.ts'],

  // Configuração de coverage
  collectCoverage: false, // Ativar com --coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/database/**',
    '!src/jobs/**',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Limites de coverage
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },

  // Timeout para testes (30 segundos)
  testTimeout: 30000,

  // Setup global antes de todos os testes
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Limpar mocks automaticamente entre testes
  clearMocks: true,

  // Restaurar mocks automaticamente entre testes
  restoreMocks: true,

  // Verbose para output detalhado
  verbose: true,

  // Máximo de workers paralelos
  maxWorkers: '50%',
};
