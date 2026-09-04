/**
 * Password Utils Tests
 */

import { hashPassword, comparePassword } from '../../../src/utils/password';

describe('Password Utils', () => {
  const plainPassword = 'TestPassword123!';

  describe('hashPassword', () => {
    it('deve gerar hash diferente do texto original', async () => {
      const hash = await hashPassword(plainPassword);

      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('deve gerar hash bcrypt válido (começa com $2b$)', async () => {
      const hash = await hashPassword(plainPassword);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('deve gerar hashes diferentes para a mesma senha', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('deve retornar true para senha correta', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword(plainPassword, hash);

      expect(result).toBe(true);
    });

    it('deve retornar false para senha incorreta', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword('SenhaErrada', hash);

      expect(result).toBe(false);
    });

    it('deve retornar false para hash inválido', async () => {
      const result = await comparePassword(plainPassword, 'hash_invalido');

      expect(result).toBe(false);
    });
  });
});
