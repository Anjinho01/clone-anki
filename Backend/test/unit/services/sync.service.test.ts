jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  getPool: jest.fn(() => ({
    query: jest.fn(),
  })),
}));

jest.mock('../../../src/repositories/sync.repository', () => ({
  __esModule: true,
  default: {
    getDecksChangedSince: jest.fn(),
    getCardsChangedSince: jest.fn(),
    getReviewLogsCreatedSince: jest.fn(),
    getAllDecks: jest.fn(),
    getAllCards: jest.fn(),
    getAllReviewLogs: jest.fn(),
    saveSyncTimestamp: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/deck.repository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/card.repository', () => ({
  __esModule: true,
  default: {
    createInstance: jest.fn(),
    findByDeck: jest.fn(),
    findById: jest.fn(),
    updateFSRSState: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/review.repository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
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

import syncService from '../../../src/services/sync.service';
import syncRepository from '../../../src/repositories/sync.repository';
import cardRepository from '../../../src/repositories/card.repository';
import type { CardRow } from '../../../src/models/card.model';
import type { DeckRow } from '../../../src/models/deck.model';
import type { ReviewLogRow } from '../../../src/models/reviewLog.model';

const mockedSyncRepository = syncRepository as jest.Mocked<typeof syncRepository>;
const mockedCardRepository = cardRepository as jest.Mocked<typeof cardRepository>;

function createDeckRow(overrides: Record<string, unknown> = {}): DeckRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 20,
    uuid: 'deck-uuid',
    package_id: 1,
    name: 'Deck geral',
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
    updated_at: new Date('2024-01-02T00:00:00Z'),
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
    state: 2,
    difficulty: 2.4,
    stability: 3.1,
    retrievability: 0,
    elapsed_days: 1,
    scheduled_days: 3,
    reps: 1,
    lapses: 0,
    due: new Date('2024-01-03T00:00:00Z'),
    last_review: new Date('2024-01-02T00:00:00Z'),
    is_suspended: false,
    is_buried: false,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-03T00:00:00Z'),
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
    id: 301,
    card_progress_id: 900,
    user_id: 3,
    rating: 3,
    state: 2,
    difficulty: 2.4,
    stability: 3.1,
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
    duration_ms: 1500,
    reviewed_at: new Date('2024-01-03T00:00:00Z'),
    created_at: new Date('2024-01-03T00:00:00Z'),
    ...overrides,
  } as ReviewLogRow;
}

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSyncRepository.getDecksChangedSince.mockResolvedValue([]);
    mockedSyncRepository.getCardsChangedSince.mockResolvedValue([]);
    mockedSyncRepository.getReviewLogsCreatedSince.mockResolvedValue([]);
    mockedSyncRepository.getAllDecks.mockResolvedValue([]);
    mockedSyncRepository.getAllCards.mockResolvedValue([]);
    mockedSyncRepository.getAllReviewLogs.mockResolvedValue([]);
    mockedSyncRepository.saveSyncTimestamp.mockResolvedValue();
  });

  it('deve retornar cards do primeiro sync com deckCardId estavel e progressId opcional', async () => {
    mockedSyncRepository.getAllDecks.mockResolvedValue([createDeckRow()]);
    mockedSyncRepository.getAllCards.mockResolvedValue([
      createCardRow({ id: 55, progress_id: null, user_id: null, due: null, last_review: null, state: 0 }),
    ]);
    mockedSyncRepository.getAllReviewLogs.mockResolvedValue([createReviewLogRow()]);

    const result = await syncService.sync(3, {
      lastSyncAt: null,
      changes: [],
    });

    const cardChange = result.serverChanges.find((change) => change.entity === 'card');
    expect(cardChange).toMatchObject({
      action: 'create',
      id: 55,
      data: expect.objectContaining({
        progressId: null,
        deckId: 20,
        flashcardId: 77,
        state: 0,
      }),
    });
  });

  it('deve aceitar progressId explicito em update de card vindo do cliente', async () => {
    mockedCardRepository.findById.mockResolvedValue(createCardRow());

    const result = await syncService.sync(3, {
      lastSyncAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      changes: [
        {
          entity: 'card',
          action: 'update',
          data: {
            progressId: 900,
            state: 2,
            difficulty: 2.4,
            stability: 3.1,
            retrievability: 0,
            elapsedDays: 1,
            scheduledDays: 3,
            reps: 1,
            lapses: 0,
            due: new Date('2024-01-03T00:00:00Z'),
            lastReview: new Date('2024-01-02T00:00:00Z'),
          },
          updatedAt: new Date('2024-01-04T00:00:00Z').toISOString(),
        },
      ],
    });

    expect(mockedCardRepository.findById).toHaveBeenCalledWith(900, 3);
    expect(mockedCardRepository.updateFSRSState).toHaveBeenCalledWith(
      900,
      3,
      2,
      2.4,
      3.1,
      0,
      1,
      3,
      1,
      0,
      expect.any(Date),
      expect.any(Date)
    );
    expect(result.applied[0]).toMatchObject({
      entity: 'card',
      action: 'update',
      serverId: 900,
      status: 'applied',
    });
  });

  it('deve manter compatibilidade com id legado como progressId em delete de card', async () => {
    const result = await syncService.sync(3, {
      lastSyncAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      changes: [
        {
          entity: 'card',
          action: 'delete',
          id: 900,
          data: {},
          updatedAt: new Date('2024-01-04T00:00:00Z').toISOString(),
        },
      ],
    });

    expect(mockedCardRepository.softDelete).toHaveBeenCalledWith(900, 3);
    expect(result.applied[0]).toMatchObject({
      entity: 'card',
      action: 'delete',
      serverId: 900,
      status: 'applied',
    });
  });
});