/**
 * Utils Index Tests (sleep, randomInt, cleanObject)
 */

import { sleep, randomInt, cleanObject } from '../../../src/utils/index';

describe('Utils Index', () => {
  describe('sleep', () => {
    it('deve retornar uma Promise', () => {
      const result = sleep(0);
      expect(result).toBeInstanceOf(Promise);
    });

    it('deve resolver após o tempo especificado', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(40); // margem de tolerância
    });
  });

  describe('randomInt', () => {
    it('deve retornar número dentro do intervalo', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
      }
    });

    it('deve retornar inteiro', () => {
      const result = randomInt(1, 100);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('deve funcionar quando min === max', () => {
      const result = randomInt(5, 5);
      expect(result).toBe(5);
    });

    it('deve incluir os limites min e max', () => {
      const results = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        results.add(randomInt(1, 3));
      }

      expect(results.has(1)).toBe(true);
      expect(results.has(3)).toBe(true);
    });
  });

  describe('cleanObject', () => {
    it('deve remover campos undefined', () => {
      const obj = { a: 1, b: undefined, c: 'hello' };
      const result = cleanObject(obj);

      expect(result).toEqual({ a: 1, c: 'hello' });
      expect('b' in result).toBe(false);
    });

    it('deve manter campos null', () => {
      const obj = { a: 1, b: null as unknown as undefined };
      const result = cleanObject(obj as Record<string, unknown>);

      expect(result).toEqual({ a: 1, b: null });
    });

    it('deve manter campos com valor 0', () => {
      const obj = { a: 0, b: '', c: false };
      const result = cleanObject(obj as Record<string, unknown>);

      expect(result).toEqual({ a: 0, b: '', c: false });
    });

    it('deve retornar objeto vazio quando todos são undefined', () => {
      const obj = { a: undefined, b: undefined };
      const result = cleanObject(obj);

      expect(result).toEqual({});
    });

    it('deve retornar cópia, não referência', () => {
      const obj = { a: 1, b: 2 };
      const result = cleanObject(obj as Record<string, unknown>);

      expect(result).not.toBe(obj);
    });
  });
});
