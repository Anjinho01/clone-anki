jest.mock('../../../src/repositories/libraryCard.repository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByUuid: jest.fn(),
    findAll: jest.fn(),
    findAllPaginated: jest.fn(),
    countAllPaginated: jest.fn(),
    findVisibleForUser: jest.fn(),
    findVisibleForUserPaginated: jest.fn(),
    countVisibleForUserPaginated: jest.fn(),
    countPrivateCardsForOwner: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/activityLog.repository', () => ({
  __esModule: true,
  default: {
    insert: jest.fn(),
  },
}));

import libraryCardService from '../../../src/services/libraryCard.service';
import libraryCardRepository from '../../../src/repositories/libraryCard.repository';
import activityLogRepository from '../../../src/repositories/activityLog.repository';
import type { LibraryCardRow } from '../../../src/models/libraryCard.model';

const mockedLibraryCardRepository = libraryCardRepository as jest.Mocked<typeof libraryCardRepository>;
const mockedActivityLogRepository = activityLogRepository as jest.Mocked<typeof activityLogRepository>;

function createLibraryCardRow(overrides: Record<string, unknown> = {}): LibraryCardRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 33,
    uuid: 'card-uuid',
    type: 'general' as const,
    owner_user_id: null,
    created_by: 5,
    front: 'Pergunta',
    back: 'Resposta',
    card_type: 'basic' as const,
    mcq_options: null,
    mcq_correct: null,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as LibraryCardRow;
}

describe('libraryCardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLibraryCardRepository.countPrivateCardsForOwner.mockResolvedValue(0);
  });

  describe('getAll', () => {
    it('deve retornar os limites de cards privados do usuario atual', async () => {
      mockedLibraryCardRepository.findAllPaginated.mockResolvedValue([createLibraryCardRow()]);
      mockedLibraryCardRepository.countAllPaginated.mockResolvedValue(1);
      mockedLibraryCardRepository.countPrivateCardsForOwner.mockResolvedValue(27);

      const result = await libraryCardService.getAll(5, 'admin', {
        page: 1,
        limit: 30,
        offset: 0,
      });

      expect(result.limits).toEqual({
        privateOwnedCards: {
          current: 27,
          max: 2000,
        },
      });
    });
  });

  describe('create', () => {
    it('deve permitir usuario comum criar card privado proprio', async () => {
      mockedLibraryCardRepository.create.mockResolvedValue(33);
      mockedLibraryCardRepository.findById.mockResolvedValue(
        createLibraryCardRow({ type: 'private', owner_user_id: 5 })
      );

      const result = await libraryCardService.create(5, 'user', {
        type: 'private',
        front: 'Pergunta',
        back: 'Resposta',
      });

      expect(mockedLibraryCardRepository.create).toHaveBeenCalledWith(
        'private',
        5,
        5,
        'Pergunta',
        'Resposta',
        'basic',
        null,
        null
      );
      expect(result).toMatchObject({ type: 'private', ownerUserId: 5, createdBy: 5 });
    });

    it('deve forcar usuario comum a criar card privado mesmo quando pedir card publico', async () => {
      mockedLibraryCardRepository.create.mockResolvedValue(33);
      mockedLibraryCardRepository.findById.mockResolvedValue(
        createLibraryCardRow({ type: 'private', owner_user_id: 5 })
      );

      const result = await libraryCardService.create(5, 'user', {
        type: 'general',
        front: 'Pergunta',
        back: 'Resposta',
      });

      expect(mockedLibraryCardRepository.create).toHaveBeenCalledWith(
        'private',
        5,
        5,
        'Pergunta',
        'Resposta',
        'basic',
        null,
        null
      );
      expect(result).toMatchObject({ type: 'private', ownerUserId: 5 });
    });

    it('deve impedir criar card privado quando o dono ja atingiu o limite', async () => {
      mockedLibraryCardRepository.countPrivateCardsForOwner.mockResolvedValue(2000);

      await expect(
        libraryCardService.create(5, 'admin', {
          type: 'private',
          front: 'Pergunta',
          back: 'Resposta',
        })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(mockedLibraryCardRepository.create).not.toHaveBeenCalled();
      expect(mockedActivityLogRepository.insert).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve permitir usuario comum editar o proprio card privado', async () => {
      mockedLibraryCardRepository.findById.mockResolvedValue(
        createLibraryCardRow({ type: 'private', owner_user_id: 5 })
      );
      mockedLibraryCardRepository.update.mockResolvedValue(true);

      const result = await libraryCardService.update(33, 5, 'user', {
        front: 'Nova frente',
      });

      expect(mockedLibraryCardRepository.update).toHaveBeenCalledWith(33, { front: 'Nova frente' });
      expect(result).toMatchObject({ type: 'private', ownerUserId: 5 });
    });

    it('deve impedir converter card publico para privado quando o limite ja foi atingido', async () => {
      mockedLibraryCardRepository.findById.mockResolvedValue(createLibraryCardRow());
      mockedLibraryCardRepository.countPrivateCardsForOwner.mockResolvedValue(2000);

      await expect(
        libraryCardService.update(33, 5, 'admin', {
          type: 'private',
        })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(mockedLibraryCardRepository.update).not.toHaveBeenCalled();
      expect(mockedActivityLogRepository.insert).not.toHaveBeenCalled();
    });

    it('deve impedir usuario comum de transformar card privado em publico', async () => {
      mockedLibraryCardRepository.findById.mockResolvedValue(
        createLibraryCardRow({ type: 'private', owner_user_id: 5 })
      );

      await expect(
        libraryCardService.update(33, 5, 'user', { type: 'general' })
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(mockedLibraryCardRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deve permitir usuario comum excluir o proprio card privado', async () => {
      mockedLibraryCardRepository.findById.mockResolvedValue(
        createLibraryCardRow({ type: 'private', owner_user_id: 5 })
      );
      mockedLibraryCardRepository.softDelete.mockResolvedValue(true);

      await libraryCardService.delete(33, 5, 'user');

      expect(mockedLibraryCardRepository.softDelete).toHaveBeenCalledWith(33);
      expect(mockedActivityLogRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', userId: 5 })
      );
    });
  });
});