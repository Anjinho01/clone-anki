import libraryCardRepository from '../repositories/libraryCard.repository';
import activityLogRepository from '../repositories/activityLog.repository';
import { toLibraryCard, LibraryCard } from '../models/libraryCard.model';
import { CreateLibraryCardDTO, UpdateLibraryCardDTO } from '../dtos/libraryCard.dto';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/httpError';
import type { RoleName } from '../models/user.model';
import type { PaginatedResult } from '../interfaces/pagination.interface';

const MAX_PRIVATE_LIBRARY_CARDS_PER_USER = 2000;

type LibraryCardListResult = PaginatedResult<LibraryCard> & {
  limits: {
    privateOwnedCards: {
      current: number;
      max: number;
    };
  };
};

function isAdmin(role: RoleName): boolean {
  return role === 'develop' || role === 'admin';
}

function canManagePublicLibraryCards(role: RoleName): boolean {
  return role === 'develop' || role === 'admin' || role === 'monitor';
}

function canManageLibraryCard(
  role: RoleName,
  userId: number,
  card: { type: 'general' | 'private'; owner_user_id: number | null }
): boolean {
  if (card.type === 'general') {
    return canManagePublicLibraryCards(role);
  }

  return card.owner_user_id === userId;
}

function isNumericKey(value: string): boolean {
  return /^\d+$/.test(value);
}

function normalizeCardType(
  cardType: CreateLibraryCardDTO['cardType'] | UpdateLibraryCardDTO['cardType']
): 'basic' | 'reverse' | 'cloze' | 'mcq' {
  if (!cardType) {
    return 'basic';
  }

  if (cardType === 'reversed' || cardType === 'reverse') {
    return 'reverse';
  }

  return cardType;
}

async function ensurePrivateCardLimit(ownerUserId: number, ignoreCardId?: number): Promise<void> {
  const privateCardsCount = await libraryCardRepository.countPrivateCardsForOwner(ownerUserId);
  const effectiveCount = ignoreCardId ? privateCardsCount - 1 : privateCardsCount;

  if (effectiveCount >= MAX_PRIVATE_LIBRARY_CARDS_PER_USER) {
    throw new ConflictError(
      `Cada usuário pode ter no máximo ${MAX_PRIVATE_LIBRARY_CARDS_PER_USER} cards privados`
    );
  }
}

const libraryCardService = {
  async getAll(
    userId: number,
    role: RoleName,
    params: { page: number; limit: number; offset: number; search?: string }
  ): Promise<LibraryCardListResult> {
    const [rows, total, privateOwnedCards] = await Promise.all(
      isAdmin(role)
        ? [
            libraryCardRepository.findAllPaginated(params),
            libraryCardRepository.countAllPaginated(params.search),
            libraryCardRepository.countPrivateCardsForOwner(userId),
          ]
        : [
            libraryCardRepository.findVisibleForUserPaginated(userId, params),
            libraryCardRepository.countVisibleForUserPaginated(userId, params.search),
            libraryCardRepository.countPrivateCardsForOwner(userId),
          ]
    );

    return {
      data: rows.map(toLibraryCard),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
      limits: {
        privateOwnedCards: {
          current: privateOwnedCards,
          max: MAX_PRIVATE_LIBRARY_CARDS_PER_USER,
        },
      },
    };
  },

  async getByKey(key: string, userId: number, role: RoleName): Promise<LibraryCard> {
    const row = isNumericKey(key)
      ? await libraryCardRepository.findById(parseInt(key, 10))
      : await libraryCardRepository.findByUuid(key);
    if (!row) throw new NotFoundError('Card não encontrado');

    if (!isAdmin(role) && row.type === 'private' && row.owner_user_id !== userId) {
      throw new NotFoundError('Card não encontrado');
    }

    return toLibraryCard(row);
  },

  async create(userId: number, role: RoleName, data: CreateLibraryCardDTO): Promise<LibraryCard> {
    const type: 'general' | 'private' = canManagePublicLibraryCards(role)
      ? (data.type ?? 'general')
      : 'private';

    if (type === 'general' && !canManagePublicLibraryCards(role)) {
      throw new ForbiddenError('Apenas monitor, admin ou develop podem criar cards públicos');
    }

    const ownerUserId = type === 'private'
      ? canManagePublicLibraryCards(role)
        ? (data.ownerUserId ?? userId)
        : userId
      : null;

    if (type === 'private' && ownerUserId !== null) {
      await ensurePrivateCardLimit(ownerUserId);
    }

    const id = await libraryCardRepository.create(
      type,
      ownerUserId,
      userId,
      data.front,
      data.back,
      normalizeCardType(data.cardType),
      data.mcqOptions ? JSON.stringify(data.mcqOptions) : null,
      data.mcqCorrect ?? null
    );

    await activityLogRepository.insert({
      tableName: 'tb_cards',
      recordId: id,
      action: 'CREATE',
      userId,
      summary: 'Card reutilizável criado',
      details: { type, ownerUserId },
    });

    const row = await libraryCardRepository.findById(id);
    return toLibraryCard(row!);
  },

  async update(
    id: number,
    userId: number,
    role: RoleName,
    data: UpdateLibraryCardDTO
  ): Promise<LibraryCard> {
    const existing = await libraryCardRepository.findById(id);
    if (!existing) throw new NotFoundError('Card não encontrado');

    if (!canManageLibraryCard(role, userId, existing)) {
      throw new ForbiddenError('Sem permissão para editar este card reutilizável');
    }

    const nextType = data.type ?? existing.type;
    if (nextType === 'general' && !canManagePublicLibraryCards(role)) {
      throw new ForbiddenError('Apenas monitor, admin ou develop podem manter cards públicos');
    }

    const nextOwnerUserId =
      data.ownerUserId !== undefined
        ? nextType === 'private'
          ? canManagePublicLibraryCards(role)
            ? data.ownerUserId
            : userId
          : null
        : data.type !== undefined
          ? nextType === 'private'
            ? (existing.owner_user_id ?? userId)
            : null
          : existing.owner_user_id;

    if (
      nextType === 'private' &&
      nextOwnerUserId !== null &&
      (existing.type !== 'private' || existing.owner_user_id !== nextOwnerUserId)
    ) {
      await ensurePrivateCardLimit(nextOwnerUserId);
    }

    const fields: Record<string, unknown> = {};

    if (data.type !== undefined) fields.type = data.type;
    if (data.ownerUserId !== undefined) {
      fields.owner_user_id = nextType === 'private' ? data.ownerUserId : null;
    } else if (data.type !== undefined) {
      fields.owner_user_id = nextType === 'private' ? (existing.owner_user_id ?? userId) : null;
    }
    if (data.front !== undefined) fields.front = data.front;
    if (data.back !== undefined) fields.back = data.back;
    if (data.cardType !== undefined) fields.card_type = normalizeCardType(data.cardType);
    if (data.mcqOptions !== undefined) fields.mcq_options = JSON.stringify(data.mcqOptions);
    if (data.mcqCorrect !== undefined) fields.mcq_correct = data.mcqCorrect;

    await libraryCardRepository.update(id, fields);

    await activityLogRepository.insert({
      tableName: 'tb_cards',
      recordId: id,
      action: 'UPDATE',
      userId,
      summary: 'Card reutilizável atualizado',
      details: fields,
    });

    const updated = await libraryCardRepository.findById(id);
    return toLibraryCard(updated!);
  },

  async delete(id: number, userId: number, role: RoleName): Promise<void> {
    const existing = await libraryCardRepository.findById(id);
    if (!existing) throw new NotFoundError('Card não encontrado');

    if (!canManageLibraryCard(role, userId, existing)) {
      throw new ForbiddenError('Sem permissão para excluir este card reutilizável');
    }

    await libraryCardRepository.softDelete(id);

    await activityLogRepository.insert({
      tableName: 'tb_cards',
      recordId: id,
      action: 'DELETE',
      userId,
      summary: 'Card reutilizável excluído',
    });
  },
};

export default libraryCardService;