import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { UserRow } from '../models/user.model';
import { RefreshTokenRow } from '../models/refreshToken.model';
import type { RoleName } from '../models/user.model';

/**
 * SELECT base com JOIN em tb_roles — garante que user.role
 * sempre é a string do role (develop/admin/user)
 */
const USER_SELECT = `
  SELECT u.*, r.name AS role
  FROM tb_users u
  JOIN tb_roles r ON r.id = u.role_id
`;

const userRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      `${USER_SELECT} WHERE u.email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  async findById(id: number): Promise<UserRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      `${USER_SELECT} WHERE u.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // ─── User Management (admin CRUD) ──────────────────────────

  async create(
    name: string,
    email: string,
    passwordHash: string,
    roleName: RoleName = 'user',
    createdBy?: number
  ): Promise<number> {
    const pool = getPool();
    const [roleRows] = await pool.query<(RowDataPacket & { id: number })[]>(
      'SELECT id FROM tb_roles WHERE name = ? LIMIT 1',
      [roleName]
    );
    const roleId = roleRows[0]?.id || 3; // fallback = user

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tb_users (name, email, password_hash, role_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, roleId, createdBy || null]
    );
    return result.insertId;
  },

  async findAll(filters?: {
    role?: RoleName;
    roles?: string[];      // multiple role names (new param)
    isActive?: boolean;
    status?: string;       // 'actived' | 'deactivated' | 'all'
    search?: string;
    limit?: number;
    offset?: number;
    page?: number;
  }): Promise<{ users: UserRow[]; total: number }> {
    const pool = getPool();

    const wheres: string[] = [];
    const params: unknown[] = [];

    // Support both legacy `role` and new `roles` array
    const roleNames: string[] = [];
    if (filters?.role) roleNames.push(filters.role);
    if (filters?.roles?.length) roleNames.push(...filters.roles);
    if (roleNames.length > 0) {
      wheres.push(`r.name IN (${roleNames.map(() => '?').join(',')})`);
      params.push(...roleNames);
    }

    // Support both legacy `isActive` and new `status`
    let isActiveFilter: boolean | undefined = filters?.isActive;
    if (filters?.status && filters.status !== 'all') {
      isActiveFilter = filters.status === 'actived';
    }
    if (isActiveFilter !== undefined) {
      wheres.push('u.is_active = ?');
      params.push(isActiveFilter);
    }

    if (filters?.search) {
      wheres.push('(u.name LIKE ? OR u.email LIKE ?)');
      const like = `%${filters.search}%`;
      params.push(like, like);
    }

    const where = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';
    const limit = filters?.limit || 50;
    const offset = filters?.page ? (filters.page - 1) * limit : (filters?.offset || 0);

    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) as total FROM tb_users u JOIN tb_roles r ON r.id = u.role_id ${where}`,
      params
    );

    const [rows] = await pool.query<UserRow[]>(
      `${USER_SELECT} ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { users: rows, total: countRows[0]?.total || 0 };
  },

  async updateUser(
    id: number,
    fields: Record<string, unknown>
  ): Promise<boolean> {
    const pool = getPool();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) return false;

    setClauses.push('updated_at = NOW()');
    values.push(id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tb_users SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  },

  async toggleActive(id: number, isActive: boolean): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE tb_users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [isActive, id]
    );
    return result.affectedRows > 0;
  },

  async getRoleId(roleName: RoleName): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
      'SELECT id FROM tb_roles WHERE name = ? LIMIT 1',
      [roleName]
    );
    return rows[0]?.id || 3;
  },

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE tb_users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );
  },

  // -- Refresh Tokens (padrão Kaizen com replaced_by) ---

  async saveRefreshToken(
    userId: number,
    tokenHash: string,
    jti: string,
    expiresAt: Date
  ): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO tb_refresh_tokens (user_id, token_hash, jti, expires_at)
       VALUES (?, ?, ?, ?)`,
      [userId, tokenHash, jti, expiresAt]
    );
  },

  async findRefreshTokenByJti(jti: string): Promise<RefreshTokenRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<RefreshTokenRow[]>(
      'SELECT * FROM tb_refresh_tokens WHERE jti = ? AND is_revoked = FALSE LIMIT 1',
      [jti]
    );
    return rows[0] || null;
  },

  async revokeRefreshToken(jti: string, replacedBy?: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE tb_refresh_tokens
       SET is_revoked = TRUE, replaced_by = ?
       WHERE jti = ?`,
      [replacedBy || null, jti]
    );
  },

  async revokeAllUserTokens(userId: number): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE tb_refresh_tokens SET is_revoked = TRUE WHERE user_id = ?',
      [userId]
    );
  },

  async purgeExpiredTokens(): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM tb_refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE'
    );
    return result.affectedRows;
  },

  // -- Password Reset Tokens ---

  async savePasswordResetToken(
    userId: number,
    code: string,
    expiresAt: Date
  ): Promise<void> {
    const pool = getPool();
    // Invalidar tokens anteriores
    await pool.query(
      'UPDATE tb_password_reset_tokens SET is_used = TRUE WHERE user_id = ?',
      [userId]
    );
    await pool.query(
      `INSERT INTO tb_password_reset_tokens (user_id, code, expires_at)
       VALUES (?, ?, ?)`,
      [userId, code, expiresAt]
    );
  },

  async findValidResetToken(
    email: string,
    code: string
  ): Promise<{ userId: number } | null> {
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & { user_id: number })[]>(
      `SELECT prt.user_id
       FROM tb_password_reset_tokens prt
       JOIN tb_users u ON u.id = prt.user_id
       WHERE u.email = ?
         AND prt.code = ?
         AND prt.is_used = FALSE
         AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [email, code]
    );

    if (!rows[0]) return null;
    return { userId: rows[0].user_id };
  },

  async markResetTokenUsed(userId: number, code: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE tb_password_reset_tokens SET is_used = TRUE WHERE user_id = ? AND code = ?',
      [userId, code]
    );
  },

  // -- Access Logs (padrão Ade90) ---

  async logAccess(
    userId: number | null,
    email: string,
    success: boolean,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO tb_access_logs (user_id, email, success, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, success, ip, userAgent]
    );
  },

  async listAccessLogs(params: {
    limit?: number;
    offset?: number;
    userId?: number;
    email?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: RowDataPacket[]; total: number }> {
    const pool = getPool();
    const limit = Math.min(200, Math.max(1, params.limit ?? 50));
    const offset = Math.max(0, params.offset ?? 0);
    const conds: string[] = [];
    const vals: unknown[] = [];

    if (typeof params.userId === 'number') {
      conds.push('al.user_id = ?');
      vals.push(params.userId);
    }
    if (params.email) {
      conds.push('al.email LIKE ?');
      vals.push(`%${params.email}%`);
    }
    if (params.success !== undefined) {
      conds.push('al.success = ?');
      vals.push(params.success);
    }
    if (params.startDate) {
      conds.push('al.created_at >= ?');
      vals.push(params.startDate);
    }
    if (params.endDate) {
      conds.push('al.created_at <= ?');
      vals.push(params.endDate);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) as total FROM tb_access_logs al ${where}`,
      vals
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT al.id, al.user_id, al.email, al.success, al.ip_address,
              al.user_agent, al.created_at,
              u.name AS user_name
         FROM tb_access_logs al
         LEFT JOIN tb_users u ON u.id = al.user_id
         ${where}
        ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return { rows, total: countRows[0]?.total || 0 };
  },
};

export default userRepository;
