import { ResultSetHeader } from 'mysql2';
import { getPool } from '../config/database';
import { PackageRow } from '../models/package.model';

const packageRepository = {
  async findById(id: number): Promise<PackageRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<PackageRow[]>(
      'SELECT * FROM tb_packages WHERE id = ? AND is_deleted = FALSE LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async findByUuid(uuid: string): Promise<PackageRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<PackageRow[]>(
      'SELECT * FROM tb_packages WHERE uuid = ? AND is_deleted = FALSE LIMIT 1',
      [uuid]
    );
    return rows[0] || null;
  },

  async findAll(includeDeleted = false): Promise<PackageRow[]> {
    const pool = getPool();
    const whereClause = includeDeleted ? '' : 'WHERE is_deleted = FALSE';
    const [rows] = await pool.query<PackageRow[]>(
      `SELECT * FROM tb_packages ${whereClause} ORDER BY position, created_at DESC`
    );
    return rows;
  },

  async findVisibleForUser(userId: number): Promise<PackageRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<PackageRow[]>(
      `SELECT *
       FROM tb_packages
       WHERE is_deleted = FALSE
         AND (type = 'general' OR owner_user_id = ?)
       ORDER BY position, created_at DESC`,
      [userId]
    );
    return rows;
  },

  async create(
    name: string,
    description: string | null,
    type: 'general' | 'private',
    ownerUserId: number | null,
    createdBy: number,
    position: number
  ): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tb_packages (uuid, name, description, type, owner_user_id, created_by, position)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [name, description, type, ownerUserId, createdBy, position]
    );
    return result.insertId;
  },

  async update(id: number, fields: Record<string, unknown>): Promise<boolean> {
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
      `UPDATE tb_packages SET ${setClauses.join(', ')} WHERE id = ? AND is_deleted = FALSE`,
      values
    );
    return result.affectedRows > 0;
  },

  async softDelete(id: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tb_packages SET is_deleted = TRUE, updated_at = NOW()
       WHERE id = ? AND is_deleted = FALSE`,
      [id]
    );
    return result.affectedRows > 0;
  },
};

export default packageRepository;
