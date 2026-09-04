jest.mock('../../../src/repositories/package.repository', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUuid: jest.fn(),
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

import packageService from '../../../src/services/package.service';
import packageRepository from '../../../src/repositories/package.repository';
import activityLogRepository from '../../../src/repositories/activityLog.repository';
import type { PackageRow } from '../../../src/models/package.model';

const mockedPackageRepository = packageRepository as jest.Mocked<typeof packageRepository>;
const mockedActivityLogRepository = activityLogRepository as jest.Mocked<typeof activityLogRepository>;

function createPackageRow(overrides: Record<string, unknown> = {}): PackageRow {
  return {
    constructor: { name: 'RowDataPacket' as const },
    id: 7,
    uuid: 'package-uuid',
    name: 'Fisica',
    description: 'Grupo publico',
    type: 'general' as const,
    owner_user_id: null,
    created_by: 9,
    position: 2,
    is_deleted: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as PackageRow;
}

describe('packageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar package publico ao criar como monitor', async () => {
      mockedPackageRepository.create.mockResolvedValue(7);
      mockedPackageRepository.findById.mockResolvedValue(createPackageRow());

      const result = await packageService.create(9, 'monitor', {
        name: 'Fisica',
        description: 'Grupo publico',
        position: 2,
      });

      expect(mockedPackageRepository.create).toHaveBeenCalledWith(
        'Fisica',
        'Grupo publico',
        'general',
        null,
        9,
        2
      );
      expect(mockedActivityLogRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          userId: 9,
          details: { type: 'general', visibility: 'public' },
        })
      );
      expect(result).toMatchObject({
        id: 7,
        type: 'general',
        ownerUserId: null,
        createdBy: 9,
      });
    });
  });

  describe('update', () => {
    it('deve impedir monitor de editar package criado por outro usuario', async () => {
      mockedPackageRepository.findById.mockResolvedValue(createPackageRow({ created_by: 11 }));

      await expect(
        packageService.update(7, 9, 'monitor', { name: 'Novo nome' })
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(mockedPackageRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deve permitir monitor excluir o proprio package', async () => {
      mockedPackageRepository.findById.mockResolvedValue(createPackageRow({ created_by: 9 }));
      mockedPackageRepository.softDelete.mockResolvedValue(true);

      await packageService.delete(7, 9, 'monitor');

      expect(mockedPackageRepository.softDelete).toHaveBeenCalledWith(7);
      expect(mockedActivityLogRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'tb_packages',
          recordId: 7,
          action: 'DELETE',
          userId: 9,
        })
      );
    });
  });
});