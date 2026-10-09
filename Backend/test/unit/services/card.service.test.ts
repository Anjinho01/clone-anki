jest.mock('../../../src/repositories/card.repository', () => ({
  __esModule: true,
  default: {
    findByDeck: jest.fn(),
    findById: jest.fn(),
    createInstancesForAllUsers: jest.fn(),
    createInstance: jest.fn(),
    deleteByDeckAndFlashcard: jest.fn(),
    suspend: jest.fn(),
    unsuspend: jest.fn(),
    bury: jest.fn(),
    unburyExpired: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/libraryCard.repository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/deck.repository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/activityLog.repository', () => ({
  __esModule: true,
  default: {
    insert: jest.fn(),
  },
}));

import cardService from '../../../src/services/card.service';
import cardRepository from '../../../src/repositories/card.repository';
import deckRepository from '../../../src/repositories/deck.repository';
import libraryCardRepository from '../../../src/repositories/libraryCard.repository';
import type { CardRow } from '../../../src/models/card.model';
import type { DeckRow } from '../../../src/models/deck.model';

const mockedCardRepository = cardRepository as jest.Mocked<typeof cardRepository>;
const mockedDeckRepository = deckRepository as jest.Mocked<typeof deckRepository>;
const mockedLibraryCardRepository = libraryCardRepository as jest.Mocked<typeof libraryCardRepository>;

function createDeckRow(overrides: Record<string, unknown> = {}): DeckRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 20,
    uuid: 'deck-uuid',
    package_id: 1,
    name: 'Deck de teste',
    description: null,
    type: 'general',
    owner_user_id: null,
    new_cards_per_day: 20,
    review_cards_per_day: 100,
    desired_retention: 0.9,
    position: 0,
    created_by: 1,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as DeckRow;
}

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
    due: new Date('2024-01-01T00:00:00Z'),
    last_review: null,
    is_suspended: false,
    is_buried: false,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    f_front: 'Frente',
    f_back: 'Verso',
    f_front_img_url: null,
    f_back_img_url: null,
    f_card_type: 'basic',
    f_mcq_options: null,
    f_mcq_correct: null,
    ...overrides,
  } as CardRow;
}

describe('cardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDeckRepository.findById.mockResolvedValue(createDeckRow());
    mockedLibraryCardRepository.findById.mockResolvedValue({
      id: 77,
      type: 'general',
      owner_user_id: null,
    } as never);
  });

  describe('getByDeck', () => {
    it('deve listar card intocado preservando deckCardId estavel e progressId nulo', async () => {
      mockedCardRepository.findByDeck.mockResolvedValue([
        createCardRow({
          id: 55,
          progress_id: null,
          user_id: null,
          due: null,
          last_review: null,
          state: 0,
        }),
      ]);

      const result = await cardService.getByDeck(20, 3);

      expect(mockedDeckRepository.findById).toHaveBeenCalledWith(20);
      expect(mockedCardRepository.findByDeck).toHaveBeenCalledWith(20, 3);
      expect(result).toEqual([
        expect.objectContaining({
          id: 55,
          progressId: null,
          deckId: 20,
          flashcardId: 77,
          userId: null,
          due: null,
          state: 0,
        }),
      ]);
    });

    it('deve listar card com progresso ja iniciado preservando progressId', async () => {
      mockedCardRepository.findByDeck.mockResolvedValue([createCardRow()]);

      const result = await cardService.getByDeck(20, 3);

      expect(result).toEqual([
        expect.objectContaining({
          id: 55,
          progressId: 900,
          userId: 3,
        }),
      ]);
    });
  });

  describe('progress mutations', () => {
    it('deve retornar progressId e deckCardId ao suspender card', async () => {
      mockedCardRepository.findById.mockResolvedValue(createCardRow({ id: 55, progress_id: 900 }));

      const result = await cardService.suspend(900, 3);

      expect(mockedCardRepository.findById).toHaveBeenCalledWith(900, 3);
      expect(mockedCardRepository.suspend).toHaveBeenCalledWith(900, 3);
      expect(result).toEqual({ progressId: 900, deckCardId: 55 });
    });

    it('deve retornar progressId e deckCardId ao remover suspensao', async () => {
      mockedCardRepository.findById.mockResolvedValue(createCardRow({ id: 56, progress_id: 901 }));

      const result = await cardService.unsuspend(901, 3);

      expect(mockedCardRepository.findById).toHaveBeenCalledWith(901, 3);
      expect(mockedCardRepository.unsuspend).toHaveBeenCalledWith(901, 3);
      expect(result).toEqual({ progressId: 901, deckCardId: 56 });
    });

    it('deve retornar progressId e deckCardId ao enterrar card', async () => {
      mockedCardRepository.findById.mockResolvedValue(createCardRow({ id: 57, progress_id: 902 }));

      const result = await cardService.bury(902, 3);

      expect(mockedCardRepository.findById).toHaveBeenCalledWith(902, 3);
      expect(mockedCardRepository.bury).toHaveBeenCalledWith(902, 3);
      expect(result).toEqual({ progressId: 902, deckCardId: 57 });
    });
  });

  describe('deck content mutations', () => {
    it('deve permitir monitor adicionar card a deck geral', async () => {
      mockedDeckRepository.findById.mockResolvedValue(createDeckRow({ type: 'general' }));

      await cardService.addCardToDeck(20, 77, 5, 'monitor');

      expect(mockedCardRepository.createInstancesForAllUsers).toHaveBeenCalledWith(20, 77);
    });

    it('deve permitir monitor remover card de deck geral', async () => {
      mockedDeckRepository.findById.mockResolvedValue(createDeckRow({ type: 'general' }));

      await cardService.removeCardFromDeck(20, 77, 5, 'monitor');

      expect(mockedCardRepository.deleteByDeckAndFlashcard).toHaveBeenCalledWith(20, 77);
    });
  });
});