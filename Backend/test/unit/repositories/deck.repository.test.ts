jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  getPool: jest.fn(),
}));

import { getPool } from '../../../src/config/database';
import deckRepository from '../../../src/repositories/deck.repository';

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

describe('deckRepository', () => {
  const query = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPool>);
  });

  describe('countCards', () => {
    it('deve contar cards intocados como new e preservar due separadamente', async () => {
      query.mockResolvedValueOnce([[{
        total: 12,
        new_count: 5,
        due_count: 3,
      }]]);

      const result = await deckRepository.countCards(44, 9);

      expect(result).toEqual({ total: 12, new: 5, due: 3 });
      expect(query).toHaveBeenCalledTimes(1);

      const [sql, params] = query.mock.calls[0];
      expect(sql).toContain('FROM tb_deck_cards deck_card');
      expect(sql).toContain('LEFT JOIN tb_card_progress progress');
      expect(sql).toContain('progress.user_id = ?');
      expect(sql).toContain('SUM(CASE WHEN progress.id IS NULL OR progress.state = 0 THEN 1 ELSE 0 END) AS new_count');
      expect(sql).toContain('SUM(CASE WHEN progress.state > 0 AND progress.due <= NOW() THEN 1 ELSE 0 END) AS due_count');
      expect(params).toEqual([9, 44]);
    });
  });

  describe('countCardsForDecks', () => {
    it('deve retornar mapa agregado por deck incluindo cards intocados como new', async () => {
      query.mockResolvedValueOnce([[
        { deck_id: 10, total: '7', new_count: '4', due_count: '2' },
        { deck_id: 11, total: 3, new_count: 3, due_count: 0 },
      ]]);

      const result = await deckRepository.countCardsForDecks([10, 11], 9);

      expect(Array.from(result.entries())).toEqual([
        [10, { total: 7, new: 4, due: 2 }],
        [11, { total: 3, new: 3, due: 0 }],
      ]);
      expect(query).toHaveBeenCalledTimes(1);

      const [sql, params] = query.mock.calls[0];
      expect(sql).toContain('WHERE deck_card.deck_id IN (?, ?)');
      expect(sql).toContain('LEFT JOIN tb_card_progress progress');
      expect(sql).toContain('GROUP BY deck_card.deck_id');
      expect(params).toEqual([9, 10, 11]);
    });

    it('deve retornar mapa vazio sem consultar o banco quando nao ha decks', async () => {
      const result = await deckRepository.countCardsForDecks([], 9);

      expect(result).toEqual(new Map());
      expect(query).not.toHaveBeenCalled();
    });
  });
});