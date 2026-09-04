import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { LibraryCardRow } from '../models/libraryCard.model';

type LibraryCardListParams = {
  search?: string;
  limit: number;
  offset: number;
};

type CountRow = RowDataPacket & { total: number | string };

function buildSearchClause(search?: string) {
  if (!search?.trim()) {
    return { clause: '', values: [] as unknown[] };
  }

  const normalizedSearch = `%${search.trim()}%`;

  return {
    clause:
      ' AND (uuid LIKE ? OR front LIKE ? OR back LIKE ? OR card_type LIKE ? OR type LIKE ?)',
    values: [
      normalizedSearch,
      normalizedSearch,
      normalizedSearch,
      normalizedSearch,
      normalizedSearch,
    ] as unknown[],
  };
}

const libraryCardRepository = {
  async findById(id: number): Promise<LibraryCardRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<LibraryCardRow[]>(
      'SELECT * FROM tb_cards WHERE id = ? AND is_deleted = FALSE LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async findByUuid(uuid: string): Promise<LibraryCardRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<LibraryCardRow[]>(
      'SELECT * FROM tb_cards WHERE uuid = ? AND is_deleted = FALSE LIMIT 1',
      [uuid]
    );
    return rows[0] || null;
  },

  async findAll(includeDeleted = false): Promise<LibraryCardRow[]> {
    const pool = getPool();
    const whereClause = includeDeleted ? '' : 'WHERE is_deleted = FALSE';
    const [rows] = await pool.query<LibraryCardRow[]>(
      `SELECT * FROM tb_cards ${whereClause} ORDER BY created_at DESC`
    );
    return rows;
  },

  async findAllPaginated(params: LibraryCardListParams): Promise<LibraryCardRow[]> {
    const pool = getPool();
    const search = buildSearchClause(params.search);
    const [rows] = await pool.query<LibraryCardRow[]>(
      `SELECT *
       FROM tb_cards
       WHERE is_deleted = FALSE${search.clause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...search.values, params.limit, params.offset]
    );
    return rows;
  },

  async countAllPaginated(search?: string): Promise<number> {
    const pool = getPool();
    const searchParams = buildSearchClause(search);
    const [rows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM tb_cards
       WHERE is_deleted = FALSE${searchParams.clause}`,
      searchParams.values
    );
    return Number(rows[0]?.total ?? 0);
  },

  async findVisibleForUser(userId: number): Promise<LibraryCardRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<LibraryCardRow[]>(
      `SELECT *
       FROM tb_cards
       WHERE is_deleted = FALSE
         AND (type = 'general' OR owner_user_id = ?)
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findVisibleForUserPaginated(
    userId: number,
    params: LibraryCardListParams
  ): Promise<LibraryCardRow[]> {
    const pool = getPool();
    const search = buildSearchClause(params.search);
    const [rows] = await pool.query<LibraryCardRow[]>(
      `SELECT *
       FROM tb_cards
       WHERE is_deleted = FALSE
         AND (type = 'general' OR owner_user_id = ?)
         ${search.clause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, ...search.values, params.limit, params.offset]
    );
    return rows;
  },

  async countVisibleForUserPaginated(userId: number, search?: string): Promise<number> {
    const pool = getPool();
    const searchParams = buildSearchClause(search);
    const [rows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM tb_cards
       WHERE is_deleted = FALSE
         AND (type = 'general' OR owner_user_id = ?)
         ${searchParams.clause}`,
      [userId, ...searchParams.values]
    );
    return Number(rows[0]?.total ?? 0);
  },

  async countPrivateCardsForOwner(ownerUserId: number): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM tb_cards
       WHERE is_deleted = FALSE
         AND type = 'private'
         AND owner_user_id = ?`,
      [ownerUserId]
    );
    return Number(rows[0]?.total ?? 0);
  },

  async create(
    type: 'general' | 'private',
    ownerUserId: number | null,
    createdBy: number,
    front: string,
    back: string,
    cardType: 'basic' | 'reverse' | 'cloze' | 'mcq',
    mcqOptions: string | null,
    mcqCorrect: number | null
  ): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tb_cards
         (uuid, type, owner_user_id, created_by, front, back, card_type, mcq_options, mcq_correct)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, ownerUserId, createdBy, front, back, cardType, mcqOptions, mcqCorrect]
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
      `UPDATE tb_cards SET ${setClauses.join(', ')} WHERE id = ? AND is_deleted = FALSE`,
      values
    );
    return result.affectedRows > 0;
  },

  async softDelete(id: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tb_cards
       SET is_deleted = TRUE, updated_at = NOW()
       WHERE id = ? AND is_deleted = FALSE`,
      [id]
    );
    return result.affectedRows > 0;
  },
};

export default libraryCardRepository;