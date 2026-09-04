/**
 * Validates Utils Tests
 */

import {
  isDisposableEmail,
  stripHtml,
  sanitizeString,
  toISOBrasilia,
} from '../../../src/utils/validates';

describe('Validates Utils', () => {
  describe('isDisposableEmail', () => {
    it('deve detectar emails descartáveis conhecidos', () => {
      expect(isDisposableEmail('user@mailinator.com')).toBe(true);
      expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
      expect(isDisposableEmail('a@yopmail.com')).toBe(true);
    });

    it('deve permitir emails legítimos', () => {
      expect(isDisposableEmail('user@gmail.com')).toBe(false);
      expect(isDisposableEmail('test@outlook.com')).toBe(false);
      expect(isDisposableEmail('dev@empresa.com.br')).toBe(false);
    });

    it('deve tratar email sem @', () => {
      expect(isDisposableEmail('invalido')).toBe(false);
    });
  });

  describe('stripHtml', () => {
    it('deve remover tags HTML', () => {
      expect(stripHtml('<p>Texto</p>')).toBe('Texto');
      expect(stripHtml('<b>Bold</b> e <i>italic</i>')).toBe('Bold e italic');
    });

    it('deve remover tags aninhadas', () => {
      expect(stripHtml('<div><p><b>Aninhado</b></p></div>')).toBe('Aninhado');
    });

    it('deve preservar texto sem tags', () => {
      expect(stripHtml('Sem tags aqui')).toBe('Sem tags aqui');
    });

    it('deve remover tags com atributos', () => {
      expect(stripHtml('<a href="http://x.com">Link</a>')).toBe('Link');
    });

    it('deve remover script tags', () => {
      expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
    });
  });

  describe('sanitizeString', () => {
    it('deve remover < e >', () => {
      expect(sanitizeString('Hello <World>')).toBe('Hello World');
    });

    it('deve fazer trim', () => {
      expect(sanitizeString('  espaços  ')).toBe('espaços');
    });

    it('deve preservar strings normais', () => {
      expect(sanitizeString('Texto normal 123')).toBe('Texto normal 123');
    });

    it('deve retornar não-strings como recebidas', () => {
      expect(sanitizeString(123 as any)).toBe(123);
    });
  });

  describe('toISOBrasilia', () => {
    it('deve converter Date para string ISO com fuso de Brasília', () => {
      const date = new Date('2025-01-15T15:00:00Z');
      const result = toISOBrasilia(date);

      expect(result).toContain('-03:00');
      expect(typeof result).toBe('string');
    });

    it('deve ter formato ISO-8601', () => {
      const date = new Date('2025-06-20T10:30:00Z');
      const result = toISOBrasilia(date);

      // Formato esperado: YYYY-MM-DDTHH:MM:SS-03:00
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
    });
  });
});
