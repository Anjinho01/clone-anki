import { getPool } from '../config/database';
import { RoleRow } from '../models/role.model';

export const roleRepository = {
  async findAll(): Promise<RoleRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<RoleRow[]>(
      'SELECT id, name, description, created_at AS createdAt FROM tb_roles ORDER BY id ASC'
    );
    return rows;
  },

  async findById(id: number): Promise<RoleRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<RoleRow[]>(
      'SELECT id, name, description, created_at AS createdAt FROM tb_roles WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  },
};
