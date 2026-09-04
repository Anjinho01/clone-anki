import packageRepository from '../repositories/package.repository';
import activityLogRepository from '../repositories/activityLog.repository';
import { toPackage, Package } from '../models/package.model';
import { CreatePackageDTO, UpdatePackageDTO } from '../dtos/package.dto';
import { NotFoundError, ForbiddenError } from '../errors/httpError';
import type { RoleName } from '../models/user.model';

function isAdmin(role: RoleName): boolean {
  return role === 'develop' || role === 'admin';
}

function canCreatePackages(role: RoleName): boolean {
  return role === 'develop' || role === 'admin' || role === 'monitor';
}

function canManagePackage(role: RoleName, userId: number, createdBy: number | null): boolean {
  if (isAdmin(role)) {
    return true;
  }

  return role === 'monitor' && createdBy === userId;
}

function isNumericKey(value: string): boolean {
  return /^\d+$/.test(value);
}

const packageService = {
  async getAll(_userId: number, _role: RoleName): Promise<Package[]> {
    const rows = await packageRepository.findAll();
    return rows.map(toPackage);
  },

  async getByKey(key: string, _userId: number, _role: RoleName): Promise<Package> {
    const row = isNumericKey(key)
      ? await packageRepository.findById(parseInt(key, 10))
      : await packageRepository.findByUuid(key);
    if (!row) throw new NotFoundError('Package não encontrado');

    return toPackage(row);
  },

  async create(userId: number, role: RoleName, data: CreatePackageDTO): Promise<Package> {
    if (!canCreatePackages(role)) {
      throw new ForbiddenError('Apenas admin ou monitor podem criar packages');
    }

    const id = await packageRepository.create(
      data.name,
      data.description ?? null,
      'general',
      null,
      userId,
      data.position ?? 0
    );

    await activityLogRepository.insert({
      tableName: 'tb_packages',
      recordId: id,
      action: 'CREATE',
      userId,
      summary: 'Package criado',
      details: { type: 'general', visibility: 'public' },
    });

    const row = await packageRepository.findById(id);
    return toPackage(row!);
  },

  async update(id: number, userId: number, role: RoleName, data: UpdatePackageDTO): Promise<Package> {
    const existing = await packageRepository.findById(id);
    if (!existing) throw new NotFoundError('Package não encontrado');

    if (!canManagePackage(role, userId, existing.created_by)) {
      throw new ForbiddenError('Sem permissão para editar este package');
    }

    const fields: Record<string, unknown> = {};

    if (data.name !== undefined) fields.name = data.name;
    if (data.description !== undefined) fields.description = data.description;
    if (data.position !== undefined) fields.position = data.position;

    await packageRepository.update(id, fields);

    await activityLogRepository.insert({
      tableName: 'tb_packages',
      recordId: id,
      action: 'UPDATE',
      userId,
      summary: 'Package atualizado',
      details: fields,
    });

    const updated = await packageRepository.findById(id);
    return toPackage(updated!);
  },

  async delete(id: number, userId: number, role: RoleName): Promise<void> {
    const existing = await packageRepository.findById(id);
    if (!existing) throw new NotFoundError('Package não encontrado');

    if (!canManagePackage(role, userId, existing.created_by)) {
      throw new ForbiddenError('Sem permissão para excluir este package');
    }

    await packageRepository.softDelete(id);

    await activityLogRepository.insert({
      tableName: 'tb_packages',
      recordId: id,
      action: 'DELETE',
      userId,
      summary: 'Package excluído',
    });
  },
};

export default packageService;
