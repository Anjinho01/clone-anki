import { getPool } from '../config/database';
import logger from '../config/logger';
import { hashPassword } from '../utils/password';
import env from '../config/env';

type SeedUser = {
  name: string;
  email: string;
  password: string;
  roleName: 'develop' | 'admin';
  fallbackRoleId: number;
};

function getSeedUsers(): SeedUser[] {
  if (!env.SEED_DEFAULT_USERS) {
    return [];
  }

  const seeds: SeedUser[] = [];

  if (env.SEED_DEVELOP_EMAIL && env.SEED_DEVELOP_PASSWORD) {
    seeds.push({
      name: 'Develop',
      email: env.SEED_DEVELOP_EMAIL,
      password: env.SEED_DEVELOP_PASSWORD,
      roleName: 'develop',
      fallbackRoleId: 1,
    });
  }

  if (env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_PASSWORD) {
    seeds.push({
      name: 'Admin',
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      roleName: 'admin',
      fallbackRoleId: 2,
    });
  }

  return seeds;
}

export async function runUsersMigration(): Promise<void> {
  const pool = getPool();

  // ─── Tabela de Roles (RBAC normalizado) ─────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE COMMENT 'develop | admin | monitor | user',
      description VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed de roles padrão (idempotente)
  await pool.query(`
    INSERT IGNORE INTO tb_roles (name, description) VALUES
      ('develop', 'Super administrador do sistema — acesso total'),
      ('admin',   'Administrador — gerencia usuários, decks e cards'),
      ('monitor', 'Monitor — gerencia decks públicos e packages'),
      ('user',    'Aluno — acessa decks atribuídos e estuda cards')
  `);

  // ─── Tabela de Usuários ─────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role_id INT NOT NULL DEFAULT 3 COMMENT 'FK para tb_roles (3=user)',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by INT DEFAULT NULL COMMENT 'Admin que criou este usuário',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES tb_roles(id),
      FOREIGN KEY (created_by) REFERENCES tb_users(id) ON DELETE SET NULL,
      INDEX idx_users_email (email),
      INDEX idx_users_role (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const seedUsers = getSeedUsers();

  if (env.SEED_DEFAULT_USERS && seedUsers.length === 0) {
    logger.warn('Seed de usuários privilegiados habilitado, mas nenhum par email/senha foi informado');
  }

  for (const seed of seedUsers) {
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM tb_users WHERE email = ? LIMIT 1',
      [seed.email]
    );

    if (existing.length > 0) {
      continue;
    }

    const passwordHash = await hashPassword(seed.password);
    const [roleRows] = await pool.query<any[]>(
      'SELECT id FROM tb_roles WHERE name = ? LIMIT 1',
      [seed.roleName]
    );
    const roleId = roleRows[0]?.id || seed.fallbackRoleId;

    await pool.query(
      `INSERT INTO tb_users (name, email, password_hash, role_id, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [seed.name, seed.email, passwordHash, roleId]
    );
    logger.info(`Seed: usuário privilegiado \"${seed.roleName}\" criado ✓`);
  }

  // ─── Refresh Tokens ────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(64) NOT NULL,
      jti VARCHAR(36) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
      replaced_by VARCHAR(36) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES tb_users(id) ON DELETE CASCADE,
      INDEX idx_refresh_jti (jti),
      INDEX idx_refresh_user (user_id),
      INDEX idx_refresh_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ─── Password Reset Tokens ────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      is_used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES tb_users(id) ON DELETE CASCADE,
      INDEX idx_reset_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ─── Access Logs ──────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_access_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      email VARCHAR(255) NOT NULL,
      success BOOLEAN NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES tb_users(id) ON DELETE SET NULL,
      INDEX idx_access_user (user_id),
      INDEX idx_access_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  logger.info('Migration: tb_roles, tb_users, tb_refresh_tokens, tb_password_reset_tokens, tb_access_logs ✓');
}
