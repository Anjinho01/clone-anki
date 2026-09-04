import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';

export interface DeckAssignmentRow extends RowDataPacket {
  id: number;
  deck_id: number;
  user_id: number;
  assigned_by: number | null;
  assigned_at: Date;
  // JOINs opcionais
  user_name?: string;
  user_email?: string;
  deck_name?: string;
}

const deckAssignmentRepository = {
  /**
   * Atribuir deck a um ou mais usuários
   */
  async assign(
    deckId: number,
    userIds: number[],
    assignedBy: number
  ): Promise<number> {
    if (userIds.length === 0) return 0;

    const pool = getPool();
    const values = userIds.map((uid) => [deckId, uid, assignedBy]);
    const placeholders = values.map(() => '(?, ?, ?)').join(', ');
    const flat = values.flat();

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO tb_deck_assignments (deck_id, user_id, assigned_by)
       VALUES ${placeholders}`,
      flat
    );
    return result.affectedRows;
  },

  /**
   * Remover atribuição de deck de um ou mais usuários
   */
  async unassign(deckId: number, userIds: number[]): Promise<number> {
    if (userIds.length === 0) return 0;

    const pool = getPool();
    const placeholders = userIds.map(() => '?').join(', ');

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM tb_deck_assignments
       WHERE deck_id = ? AND user_id IN (${placeholders})`,
      [deckId, ...userIds]
    );
    return result.affectedRows;
  },

  /**
   * Listar usuários atribuídos a um deck
   */
  async findByDeck(deckId: number): Promise<DeckAssignmentRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<DeckAssignmentRow[]>(
      `SELECT da.*, u.name AS user_name, u.email AS user_email
       FROM tb_deck_assignments da
       JOIN tb_users u ON u.id = da.user_id
       WHERE da.deck_id = ?
       ORDER BY da.assigned_at DESC`,
      [deckId]
    );
    return rows;
  },

  /**
   * Listar decks atribuídos a um usuário
   */
  async findByUser(userId: number): Promise<DeckAssignmentRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<DeckAssignmentRow[]>(
      `SELECT da.*, d.name AS deck_name
       FROM tb_deck_assignments da
       JOIN tb_decks d ON d.id = da.deck_id
       WHERE da.user_id = ? AND d.is_deleted = FALSE
       ORDER BY da.assigned_at DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Verificar se um usuário tem acesso a um deck (por atribuição)
   */
  async isAssigned(deckId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM tb_deck_assignments
       WHERE deck_id = ? AND user_id = ? LIMIT 1`,
      [deckId, userId]
    );
    return rows.length > 0;
  },
};

export default deckAssignmentRepository;
