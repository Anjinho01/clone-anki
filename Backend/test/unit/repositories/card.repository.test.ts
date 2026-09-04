jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  getPool: jest.fn(),
}));

import { getPool } from '../../../src/config/database';
import cardRepository from '../../../src/repositories/card.repository';
import type { CardRow } from '../../../src/models/card.model';

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

function createCardRow(overrides: Record<string, unknown> = {}): CardRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 55,
    progress_id: 900,
    deck_id: 20,
    card_id: 77,
    flashcard_id: 77,
    user_id: 3,
    deck_card_id: 55,
    state: 0,
    difficulty: 0,
    stability: 0,
    retrievability: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    due: null,
    last_review: null,
    is_suspended: false,
    is_buried: false,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    f_front: 'Frente',
    f_back: 'Verso',
    f_card_type: 'basic',
    f_mcq_options: null,
    f_mcq_correct: null,
    ...overrides,
  } as CardRow;
}

describe('cardRepository', () => {
  const query = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPool>);
  });

  describe('findByDeckCardId', () => {
    it('deve retornar card visivel por deckCardId preservando progressId opcional', async () => {
      const untouchedCard = createCardRow({
        id: 77,
        progress_id: null,
        deck_card_id: 77,
        user_id: null,
      });

      query.mockResolvedValueOnce([[untouchedCard]]);

      const result = await cardRepository.findByDeckCardId(77, 9);

      expect(result).toEqual(untouchedCard);
      expect(query).toHaveBeenCalledTimes(1);

      const [sql, params] = query.mock.calls[0];
      expect(sql).toContain('FROM tb_deck_cards deck_card');
      expect(sql).toContain('JOIN tb_decks deck ON deck.id = deck_card.deck_id AND deck.is_deleted = FALSE');
      expect(sql).toContain('LEFT JOIN tb_card_progress progress');
      expect(sql).toContain("(deck.type = 'general' OR deck.owner_user_id = ?)");
      expect(sql).toContain('LIMIT 1');
      expect(params).toEqual([9, 77, 9]);
    });

    it('deve retornar null quando o deckCardId nao estiver acessivel ao usuario', async () => {
      query.mockResolvedValueOnce([[]]);

      const result = await cardRepository.findByDeckCardId(999, 9);

      expect(result).toBeNull();
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('ensureProgressForDeckCardId', () => {
    it('deve criar progresso quando o deckCardId for valido e acessivel ao usuario', async () => {
      query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await cardRepository.ensureProgressForDeckCardId(77, 9);

      expect(result).toBe(true);
      expect(query).toHaveBeenCalledTimes(1);

      const [sql, params] = query.mock.calls[0];
      expect(sql).toContain('INSERT IGNORE INTO tb_card_progress (deck_card_id, user_id)');
      expect(sql).toContain('SELECT deck_card.id, ?');
      expect(sql).toContain('JOIN tb_decks deck ON deck.id = deck_card.deck_id AND deck.is_deleted = FALSE');
      expect(sql).toContain('JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE');
      expect(sql).toContain("(deck.type = 'general' OR deck.owner_user_id = ?)");
      expect(params).toEqual([9, 77, 9]);
    });

    it('deve retornar false quando nada for materializado', async () => {
      query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await cardRepository.ensureProgressForDeckCardId(77, 9);

      expect(result).toBe(false);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findDueCards', () => {
    it('deve materializar progresso sob demanda para deck cards intocados quando ainda faltam novos', async () => {
      const lazyCard = createCardRow({ id: 101, progress_id: 1001, deck_card_id: 101, user_id: 9, state: 0 });
      const dueCard = createCardRow({ id: 202, progress_id: 2002, deck_card_id: 202, user_id: 9, state: 2 });

      query
        .mockResolvedValueOnce([[{ cnt: 1 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 101 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[lazyCard]])
        .mockResolvedValueOnce([[dueCard]]);

      const result = await cardRepository.findDueCards(44, 9, 3, 5);

      expect(result).toEqual([lazyCard, dueCard]);
      expect(query).toHaveBeenCalledTimes(6);

      const [untouchedSql, untouchedParams] = query.mock.calls[2];
      expect(untouchedSql).toContain('LEFT JOIN tb_card_progress progress');
      expect(untouchedSql).toContain('progress.id IS NULL');
      expect(untouchedParams).toEqual([9, 44, 2]);

      const [insertSql, insertParams] = query.mock.calls[3];
      expect(insertSql).toContain('INSERT IGNORE INTO tb_card_progress (deck_card_id, user_id)');
      expect(insertSql).toContain('VALUES (?, ?)');
      expect(insertParams).toEqual([101, 9]);

      const [dueSql, dueParams] = query.mock.calls[5];
      expect(dueSql).toContain('progress.state > 0 AND progress.due <= NOW()');
      expect(dueParams).toEqual([44, 9, 5]);
    });

    it('nao deve materializar progresso quando o limite diario de novos ja foi atingido', async () => {
      const dueCard = createCardRow({ id: 202, progress_id: 2002, deck_card_id: 202, user_id: 9, state: 2 });

      query
        .mockResolvedValueOnce([[{ cnt: 3 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[dueCard]]);

      const result = await cardRepository.findDueCards(44, 9, 3, 5);

      expect(result).toEqual([dueCard]);
      expect(query).toHaveBeenCalledTimes(3);

      const executedSql = query.mock.calls.map(([sql]) => String(sql));
      expect(executedSql.some((sql) => sql.includes('INSERT IGNORE INTO tb_card_progress'))).toBe(false);
      expect(executedSql.some((sql) => sql.includes('progress.id IS NULL'))).toBe(false);
    });
  });

  describe('createInstancesForAllUsers', () => {
    it('deve apenas garantir tb_deck_cards sem materializar tb_card_progress para usuarios', async () => {
      query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await cardRepository.createInstancesForAllUsers(44, 77);

      expect(result).toBe(1);
      expect(query).toHaveBeenCalledTimes(1);

      const [sql, params] = query.mock.calls[0];
      expect(sql).toContain('INSERT IGNORE INTO tb_deck_cards (deck_id, card_id)');
      expect(sql).not.toContain('tb_card_progress');
      expect(params).toEqual([44, 77]);
    });
  });
});