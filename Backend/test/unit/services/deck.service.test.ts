jest.mock('../../../src/repositories/deck.repository', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findGeneralDecks: jest.fn(),
    findPrivateDecksForUser: jest.fn(),
    countPrivateDecksForUser: jest.fn(),
    countGeneralDecks: jest.fn(),
    findById: jest.fn(),
    findByUuid: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    countCards: jest.fn(),
    countCardsForDecks: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/card.repository', () => ({
  __esModule: true,
  default: {
    countCardsForDecks: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/package.repository', () => ({
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

import deckService from '../../../src/services/deck.service';
import deckRepository from '../../../src/repositories/deck.repository';
import packageRepository from '../../../src/repositories/package.repository';
import activityLogRepository from '../../../src/repositories/activityLog.repository';
import type { PackageRow } from '../../../src/models/package.model';
import type { DeckRow } from '../../../src/models/deck.model';

const mockedDeckRepository = deckRepository as jest.Mocked<typeof deckRepository>;
const mockedPackageRepository = packageRepository as jest.Mocked<typeof packageRepository>;
const mockedActivityLogRepository = activityLogRepository as jest.Mocked<typeof activityLogRepository>;

function createPackageRow(overrides: Partial<PackageRow> = {}): PackageRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 10,
    uuid: 'package-uuid',
    name: 'Grupo geral',
    description: null,
    type: 'general' as const,
    owner_user_id: null,
    created_by: 5,
    position: 0,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as PackageRow;
}

function createDeckRow(overrides: Record<string, unknown> = {}): DeckRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 20,
    uuid: 'deck-uuid',
    package_id: 10,
    name: 'Algebra',
    description: null,
    type: 'general' as const,
    owner_user_id: null,
    new_cards_per_day: 20,
    review_cards_per_day: 100,
    desired_retention: 0.9,
    position: 0,
    created_by: 5,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as DeckRow;
}

describe('deckService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDeckRepository.countPrivateDecksForUser.mockResolvedValue(0);
    mockedDeckRepository.countGeneralDecks.mockResolvedValue(0);
  });

  describe('create', () => {
    it('deve permitir monitor criar deck publico vinculado a package geral', async () => {
      mockedPackageRepository.findById.mockResolvedValue(createPackageRow());
      mockedDeckRepository.create.mockResolvedValue(20);
      mockedDeckRepository.findById.mockResolvedValue(createDeckRow());

      const result = await deckService.create(5, 'monitor', {
        name: 'Algebra',
        packageId: 10,
      });

      expect(mockedDeckRepository.create).toHaveBeenCalledWith(
        10,
        'Algebra',
        null,
        'general',
        null,
        5,
        20,
        100,
        0.9,
        0
      );
      expect(mockedActivityLogRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'tb_decks',
          action: 'CREATE',
          userId: 5,
          details: { name: 'Algebra', type: 'general', ownerUserId: null },
        })
      );
      expect(result).toMatchObject({
        id: 20,
        packageId: 10,
        type: 'general',
        ownerUserId: null,
      });
    });

    it('deve impedir usuario comum de vincular deck a package', async () => {
      await expect(
        deckService.create(3, 'user', { name: 'Pessoal', packageId: 10 })
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(mockedPackageRepository.findById).not.toHaveBeenCalled();
      expect(mockedDeckRepository.create).not.toHaveBeenCalled();
    });

    it('deve impedir criar deck privado quando o usuario ja atingiu o limite', async () => {
      mockedDeckRepository.countPrivateDecksForUser.mockResolvedValue(150);

      await expect(deckService.create(3, 'user', { name: 'Pessoal' })).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(mockedDeckRepository.create).not.toHaveBeenCalled();
      expect(mockedDeckRepository.countGeneralDecks).not.toHaveBeenCalled();
    });

    it('deve impedir criar deck publico quando o sistema ja atingiu o limite', async () => {
      mockedDeckRepository.countGeneralDecks.mockResolvedValue(100);

      await expect(
        deckService.create(5, 'monitor', {
          name: 'Algebra',
          type: 'general',
        })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(mockedDeckRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve permitir monitor editar deck publico', async () => {
      mockedDeckRepository.findById.mockResolvedValue(createDeckRow({ type: 'general' }));
      mockedDeckRepository.update.mockResolvedValue(true);

      const result = await deckService.update(20, 5, 'monitor', { name: 'Novo nome' });

      expect(mockedDeckRepository.update).toHaveBeenCalledWith(20, { name: 'Novo nome' });
      expect(result).toMatchObject({ id: 20, type: 'general' });
    });
  });

  describe('delete', () => {
    it('deve permitir monitor excluir deck publico', async () => {
      mockedDeckRepository.findById.mockResolvedValue(createDeckRow({ type: 'general' }));
      mockedDeckRepository.softDelete.mockResolvedValue(true);

      await deckService.delete(20, 5, 'monitor');

      expect(mockedDeckRepository.softDelete).toHaveBeenCalledWith(20);
      expect(mockedActivityLogRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', userId: 5, recordId: 20 })
      );
    });
  });
});