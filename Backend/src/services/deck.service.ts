import deckRepository from '../repositories/deck.repository';
import cardRepository from '../repositories/card.repository';
import packageRepository from '../repositories/package.repository';
import activityLogRepository from '../repositories/activityLog.repository';
import { toDeck, Deck } from '../models/deck.model';
import { CreateDeckDTO, UpdateDeckDTO } from '../dtos/deck.dto';
import { ConflictError, NotFoundError, ForbiddenError } from '../errors/httpError';
import type { RoleName } from '../models/user.model';

const MAX_PRIVATE_DECKS_PER_USER = 150;
const MAX_GENERAL_DECKS = 100;

function isAdmin(role: RoleName): boolean {
  return role === 'develop' || role === 'admin';
}

function canManagePublicDecks(role: RoleName): boolean {
  return role === 'develop' || role === 'admin' || role === 'monitor';
}

function isNumericKey(value: string): boolean {
  return /^\d+$/.test(value);
}

async function resolvePackageId(
  role: RoleName,
  type: 'general' | 'private',
  ownerUserId: number | null,
  requestedPackageId?: number | null
): Promise<number | null> {
  if (requestedPackageId === undefined || requestedPackageId === null) {
    return null;
  }

  if (!canManagePublicDecks(role)) {
    throw new ForbiddenError('Usuário comum não pode vincular decks a packages');
  }

  const pkg = await packageRepository.findById(requestedPackageId);
  if (!pkg) {
    throw new NotFoundError('Package não encontrado');
  }

  if (pkg.type !== type) {
    throw new ForbiddenError('Tipo do deck deve combinar com o tipo do package');
  }

  if (
    type === 'private' &&
    pkg.owner_user_id !== null &&
    pkg.owner_user_id !== ownerUserId
  ) {
    throw new ForbiddenError('Package privado só pode receber decks privados do mesmo dono');
  }

  return pkg.id;
}

const deckService = {
  /**
   * Retorna decks visíveis para o usuário:
   * - Todos os decks 'general' (admin-created, pinned for everyone)
   * - Decks 'private' do próprio usuário
   *
   * Para admin/develop: também retorna todos os decks (para gerenciamento).
   */
  async getAll(
    userId: number,
    role: RoleName
  ): Promise<(Deck & { cardCount: { total: number; new: number; due: number } })[]> {
    let decks: Deck[];

    if (isAdmin(role)) {
      // Admin vê tudo
      const rows = await deckRepository.findAll();
      decks = rows.map(toDeck);
    } else {
      // Usuário vê: decks gerais + seus privados
      const [generalRows, privateRows] = await Promise.all([
        deckRepository.findGeneralDecks(),
        deckRepository.findPrivateDecksForUser(userId),
      ]);
      decks = [...generalRows.map(toDeck), ...privateRows.map(toDeck)];
    }

    const deckIds = decks.map((d) => d.id);
    const countsMap = await cardRepository.countCardsForDecks(deckIds, userId);

    return decks.map((deck) => ({
      ...deck,
      cardCount: countsMap.get(deck.id) ?? { total: 0, new: 0, due: 0 },
    }));
  },

  async getByKey(
    key: string,
    userId: number,
    role: RoleName
  ): Promise<Deck & { cardCount: { total: number; new: number; due: number } }> {
    const row = isNumericKey(key)
      ? await deckRepository.findById(parseInt(key, 10))
      : await deckRepository.findByUuid(key);
    if (!row) throw new NotFoundError('Deck não encontrado');

    // Verificar acesso para usuários comuns
    if (!isAdmin(role)) {
      const isGeneral = row.type === 'general';
      const isOwner   = row.type === 'private' && row.owner_user_id === userId;
      if (!isGeneral && !isOwner) throw new NotFoundError('Deck não encontrado');
    }

    const deck = toDeck(row);
    const cardCount = await deckRepository.countCards(deck.id, userId);
    return { ...deck, cardCount };
  },

  /**
   * Criar deck:
   * - Admin/develop → cria deck 'general' (visível para todos)
   * - User → cria deck 'private' (visível apenas para ele)
   */
  async create(userId: number, role: RoleName, data: CreateDeckDTO): Promise<Deck> {
    const type: 'general' | 'private' = canManagePublicDecks(role)
      ? (data.type ?? 'general')
      : 'private';

    // Apenas perfis de conteúdo podem criar deck 'general'
    if (type === 'general' && !canManagePublicDecks(role)) {
      throw new ForbiddenError('Apenas admin ou monitor podem criar decks gerais');
    }

    if (type === 'private') {
      const privateDeckCount = await deckRepository.countPrivateDecksForUser(userId);
      if (privateDeckCount >= MAX_PRIVATE_DECKS_PER_USER) {
        throw new ConflictError(
          `Cada usuário pode ter no máximo ${MAX_PRIVATE_DECKS_PER_USER} decks privados`
        );
      }
    }

    if (type === 'general') {
      const generalDeckCount = await deckRepository.countGeneralDecks();
      if (generalDeckCount >= MAX_GENERAL_DECKS) {
        throw new ConflictError(`O sistema pode ter no máximo ${MAX_GENERAL_DECKS} decks públicos`);
      }
    }

    const ownerUserId = type === 'private' ? userId : null;
    const packageId = await resolvePackageId(
      role,
      type,
      ownerUserId,
      data.packageId
    );

    const id = await deckRepository.create(
      packageId,
      data.name,
      data.description || null,
      type,
      ownerUserId,
      userId,
      data.newCardsPerDay ?? 20,
      data.reviewCardsPerDay ?? 100,
      data.desiredRetention ?? 0.9,
      data.position ?? 0
    );

    const row = await deckRepository.findById(id);
    const deck = toDeck(row!);

    await activityLogRepository.insert({
      tableName: 'tb_decks',
      recordId: id,
      action: 'CREATE',
      userId,
      summary: `Deck criado: ${deck.name}`,
      details: { name: data.name, type, ownerUserId },
    });

    return deck;
  },

  async update(id: number, userId: number, role: RoleName, data: UpdateDeckDTO): Promise<Deck> {
    const existing = await deckRepository.findById(id);
    if (!existing) throw new NotFoundError('Deck não encontrado');

    const canManageExistingDeck =
      existing.type === 'general'
        ? canManagePublicDecks(role)
        : existing.owner_user_id === userId;

    if (!canManageExistingDeck) {
      throw new ForbiddenError('Sem permissão para editar este deck');
    }

    if (!canManagePublicDecks(role) && data.packageId !== undefined) {
      throw new ForbiddenError('Usuário comum não pode vincular deck a package');
    }

    const fields: Record<string, unknown> = {};
    if (data.packageId !== undefined) {
      fields.package_id = await resolvePackageId(
        role,
        existing.type,
        existing.owner_user_id,
        data.packageId
      );
    }
    if (data.name             !== undefined) fields.name               = data.name;
    if (data.description      !== undefined) fields.description        = data.description;
    if (data.newCardsPerDay   !== undefined) fields.new_cards_per_day  = data.newCardsPerDay;
    if (data.reviewCardsPerDay !== undefined) fields.review_cards_per_day = data.reviewCardsPerDay;
    if (data.desiredRetention !== undefined) fields.desired_retention  = data.desiredRetention;
    if (data.position         !== undefined) fields.position           = data.position;

    await deckRepository.update(id, fields);

    await activityLogRepository.insert({
      tableName: 'tb_decks',
      recordId: id,
      action: 'UPDATE',
      userId,
      summary: `Deck atualizado`,
      details: fields,
    });

    const updated = await deckRepository.findById(id);
    return toDeck(updated!);
  },

  async delete(id: number, userId: number, role: RoleName): Promise<void> {
    const existing = await deckRepository.findById(id);
    if (!existing) throw new NotFoundError('Deck não encontrado');

    const canDeleteDeck =
      existing.type === 'general'
        ? canManagePublicDecks(role)
        : existing.owner_user_id === userId;

    if (!canDeleteDeck) {
      throw new ForbiddenError('Sem permissão para excluir este deck');
    }

    await deckRepository.softDelete(id);

    await activityLogRepository.insert({
      tableName: 'tb_decks',
      recordId: id,
      action: 'DELETE',
      userId,
      summary: `Deck excluído: ${existing.name}`,
    });
  },
};

export default deckService;
