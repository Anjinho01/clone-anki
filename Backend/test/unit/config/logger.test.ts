/**
 * Logger Configuration Tests
 */

import logger from '../../../src/config/logger';

describe('Logger Configuration', () => {
  it('deve ter todos os métodos necessários', () => {
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('debug');
  });

  it('deve ter métodos como funções', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('deve logar info sem lançar erros', () => {
    expect(() => logger.info('Test info message')).not.toThrow();
  });

  it('deve logar warn sem lançar erros', () => {
    expect(() => logger.warn('Test warning')).not.toThrow();
  });

  it('deve logar error sem lançar erros', () => {
    expect(() => logger.error('Test error')).not.toThrow();
  });

  it('deve logar debug sem lançar erros', () => {
    expect(() => logger.debug('Test debug')).not.toThrow();
  });

  it('deve aceitar objetos nos logs', () => {
    expect(() => {
      logger.info('Test with object', { key: 'value', number: 123 });
    }).not.toThrow();
  });

  it('deve aceitar Error nos logs', () => {
    const error = new Error('Test error object');
    expect(() => {
      logger.error('Error occurred:', error);
    }).not.toThrow();
  });
});
