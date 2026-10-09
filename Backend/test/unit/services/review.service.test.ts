jest.mock('../../../src/repositories/card.repository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByDeckCardId: jest.fn(),
    ensureProgressForDeckCardId: jest.fn(),
    updateFSRSState: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/review.repository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findByCard: jest.fn(),
    findLastByCard: jest.fn(),
    deleteById: jest.fn(),
    getStudyStats: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/deck.repository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('../../../src/config/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import reviewService from '../../../src/services/review.service';
import cardRepository from '../../../src/repositories/card.repository';
import reviewRepository from '../../../src/repositories/review.repository';
import deckRepository from '../../../src/repositories/deck.repository';
import type { CardRow } from '../../../src/models/card.model';
import type { DeckRow } from '../../../src/models/deck.model';
import type { ReviewLogRow } from '../../../src/models/reviewLog.model';

const mockedCardRepository = cardRepository as jest.Mocked<typeof cardRepository>;
const mockedReviewRepository = reviewRepository as jest.Mocked<typeof reviewRepository>;
const mockedDeckRepository = deckRepository as jest.Mocked<typeof deckRepository>;

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

function createReviewLogRow(overrides: Record<string, unknown> = {}): ReviewLogRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 99,
    card_progress_id: 900,
    user_id: 3,
    rating: 3,
    state: 2,
    difficulty: 2.5,
    stability: 3.5,
    retrievability: 0,
    elapsed_days: 1,
    scheduled_days: 3,
    pre_state: 0,
    pre_difficulty: 0,
    pre_stability: 0,
    pre_retrievability: 0,
    pre_elapsed_days: 0,
    pre_scheduled_days: 0,
    pre_reps: 0,
    pre_lapses: 0,
    pre_due: new Date('2024-01-01T00:00:00Z'),
    pre_last_review: null,
    duration_ms: 1200,
    reviewed_at: new Date('2024-01-02T00:00:00Z'),
    created_at: new Date('2024-01-02T00:00:00Z'),
    ...overrides,
  } as ReviewLogRow;
}

describe('reviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDeckRepository.findById.mockResolvedValue(createDeckRow());
  });

  describe('previewCard', () => {
    it('deve aceitar deckCardId de card ainda intocado', async () => {
      mockedCardRepository.findById.mockResolvedValue(null);
      mockedCardRepository.findByDeckCardId.mockResolvedValue(
        createCardRow({ progress_id: null, user_id: null, due: null })
      );

      const result = await reviewService.previewCard(55, 3, 20);

      expect(mockedCardRepository.findById).toHaveBeenCalledWith(55, 3);
      expect(mockedCardRepository.findByDeckCardId).toHaveBeenCalledWith(55, 3);
      expect(result).toEqual(
        expect.objectContaining({
          again: expect.objectContaining({ scheduledDays: expect.any(Number) }),
          hard: expect.objectContaining({ scheduledDays: expect.any(Number) }),
          good: expect.objectContaining({ scheduledDays: expect.any(Number) }),
          easy: expect.objectContaining({ scheduledDays: expect.any(Number) }),
        })
      );
      expect(mockedCardRepository.ensureProgressForDeckCardId).not.toHaveBeenCalled();
    });
  });

  describe('submitReview', () => {
    it('deve materializar progresso sob demanda quando recebe deckCardId', async () => {
      mockedCardRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createCardRow());
      mockedCardRepository.findByDeckCardId
        .mockResolvedValueOnce(createCardRow({ progress_id: null, user_id: null, due: null }))
        .mockResolvedValueOnce(createCardRow());
      mockedCardRepository.ensureProgressForDeckCardId.mockResolvedValue(true);
      mockedReviewRepository.create.mockResolvedValue(99);

      const result = await reviewService.submitReview(3, {
        cardId: 55,
        deckId: 20,
        rating: 3,
        durationMs: 500,
      });

      expect(mockedCardRepository.ensureProgressForDeckCardId).toHaveBeenCalledWith(55, 3);
      expect(mockedCardRepository.updateFSRSState).toHaveBeenCalled();
      expect(mockedCardRepository.updateFSRSState.mock.calls[0]?.[0]).toBe(900);
      expect(mockedReviewRepository.create).toHaveBeenCalled();
      expect(mockedReviewRepository.create.mock.calls[0]?.[0]).toBe(900);
      expect(result.card.id).toBe(55);
      expect(result.card.progressId).toBe(900);
      expect(result.scheduledDays).toEqual(expect.any(Number));
    });
  });

  describe('getCardHistory', () => {
    it('deve retornar historico vazio quando o card ainda nao tem progresso', async () => {
      mockedCardRepository.findById.mockResolvedValue(null);
      mockedCardRepository.findByDeckCardId.mockResolvedValue(
        createCardRow({ progress_id: null, user_id: null, due: null })
      );

      const result = await reviewService.getCardHistory(55, 3);

      expect(result).toEqual([]);
      expect(mockedReviewRepository.findByCard).not.toHaveBeenCalled();
    });
  });

  describe('undoLastReview', () => {
    it('deve impedir undo para card sem progresso iniciado', async () => {
      mockedCardRepository.findById.mockResolvedValue(null);
      mockedCardRepository.findByDeckCardId.mockResolvedValue(
        createCardRow({ progress_id: null, user_id: null, due: null })
      );

      await expect(reviewService.undoLastReview(55, 3)).rejects.toMatchObject({
        statusCode: 400,
      });

      expect(mockedReviewRepository.findLastByCard).not.toHaveBeenCalled();
    });

    it('deve aceitar deckCardId e desfazer review usando progressId resolvido', async () => {
      mockedCardRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createCardRow({ state: 0 }));
      mockedCardRepository.findByDeckCardId.mockResolvedValue(createCardRow({ state: 2 }));
      mockedReviewRepository.findLastByCard.mockResolvedValue(createReviewLogRow());
      mockedReviewRepository.deleteById.mockResolvedValue(true);

      const result = await reviewService.undoLastReview(55, 3);

      expect(mockedReviewRepository.findLastByCard).toHaveBeenCalledWith(900, 3);
      expect(mockedCardRepository.updateFSRSState).toHaveBeenCalled();
      expect(mockedCardRepository.updateFSRSState.mock.calls[0]?.[0]).toBe(900);
      expect(result.card.id).toBe(55);
      expect(result.card.progressId).toBe(900);
    });
  });
});