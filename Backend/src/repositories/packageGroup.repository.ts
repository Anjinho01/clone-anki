import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';

export interface PackageGroupRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  type: 'general' | 'private';
  owner_user_id: number | null;
  created_by: number | null;
  position: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const packageGroupRepository = {
  async findDefaultGeneral(): Promise<PackageGroupRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<PackageGroupRow[]>(
      `SELECT *
       FROM tb_packages
       WHERE type = 'general' AND owner_user_id IS NULL AND is_deleted = FALSE
       ORDER BY position, id
       LIMIT 1`
    );
    return rows[0] || null;
  },

  async findDefaultPrivateForOwner(ownerUserId: number): Promise<PackageGroupRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<PackageGroupRow[]>(
      `SELECT *
       FROM tb_packages
       WHERE type = 'private' AND owner_user_id = ? AND is_deleted = FALSE
       ORDER BY position, id
       LIMIT 1`,
      [ownerUserId]
    );
    return rows[0] || null;
  },

  async createDefaultGroup(params: {
    name: string;
    description: string | null;
    type: 'general' | 'private';
    ownerUserId: number | null;
    createdBy: number;
  }): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tb_packages
         (name, description, type, owner_user_id, created_by, position)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [params.name, params.description, params.type, params.ownerUserId, params.createdBy]
    );
    return result.insertId;
  },
};

export default packageGroupRepository;