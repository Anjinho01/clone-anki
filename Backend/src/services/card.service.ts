import cardRepository from '../repositories/card.repository';
import libraryCardRepository from '../repositories/libraryCard.repository';
import deckRepository from '../repositories/deck.repository';
import activityLogRepository from '../repositories/activityLog.repository';
import { toCard, Card } from '../models/card.model';
import { CreateCardDTO } from '../dtos/card.dto';
import { NotFoundError, ForbiddenError } from '../errors/httpError';
import type { RoleName } from '../models/user.model';

function canManagePublicDecks(role: RoleName): boolean {
  return role === 'develop' || role === 'admin' || role === 'monitor';
}

type CardMutationResult = {
  progressId: number;
  deckCardId: number;
};

const cardService = {
  async getByDeck(deckId: number, userId: number): Promise<Card[]> {
    const deck = await deckRepository.findById(deckId);
    if (!deck) throw new NotFoundError('Deck não encontrado');
    const rows = await cardRepository.findByDeck(deckId, userId);
    return rows.map(toCard);
  },

  async getById(cardId: number, userId: number): Promise<Card> {
    const row = await cardRepository.findById(cardId, userId);
    if (!row) throw new NotFoundError('Card não encontrado');
    return toCard(row);
  },

  async addCardToDeck(
    deckId: number,
    cardId: number,
    requesterId: number,
    role: RoleName
  ): Promise<void> {
    const deck = await deckRepository.findById(deckId);
    if (!deck) throw new NotFoundError('Deck não encontrado');

    const card = await libraryCardRepository.findById(cardId);
    if (!card) throw new NotFoundError('Card não encontrado');

    if (deck.type === 'general' && card.type !== 'general') {
      throw new ForbiddenError('Deck geral só pode receber cards públicos');
    }

    if (
      card.type === 'private' &&
      deck.type === 'private' &&
      deck.owner_user_id !== null &&
      card.owner_user_id !== null &&
      deck.owner_user_id !== card.owner_user_id
    ) {
      throw new ForbiddenError('Card privado só pode ser usado em deck privado do mesmo dono');
    }

    if (deck.type === 'general') {
      if (!canManagePublicDecks(role)) {
        throw new ForbiddenError('Apenas monitor, admin ou develop podem adicionar cards a decks gerais');
      }
      await cardRepository.createInstancesForAllUsers(deckId, cardId);
    } else {
      if (deck.owner_user_id !== requesterId) {
        throw new ForbiddenError('Apenas o dono do deck pode adicionar cards');
      }
      await cardRepository.createInstance(deckId, cardId, requesterId);
    }

    await activityLogRepository.insert({
      tableName: 'tb_cards',
      recordId: deckId,
      action: 'CREATE',
      userId: requesterId,
      summary: `Card ${cardId} adicionado ao deck ${deckId}`,
    });
  },

  async createForUser(userId: number, data: CreateCardDTO): Promise<Card> {
    const deck = await deckRepository.findById(data.deckId);
    if (!deck) throw new NotFoundError('Deck não encontrado');

    if (deck.type === 'private' && deck.owner_user_id !== userId) {
      throw new ForbiddenError('Acesso negado a este deck');
    }

    const card = await libraryCardRepository.findById(data.flashcardId);
    if (!card) throw new NotFoundError('Card não encontrado');

    if (card.type === 'private') {
      throw new ForbiddenError('Cards privados não podem ser clonados por usuários comuns');
    }

    await cardRepository.createInstance(data.deckId, data.flashcardId, userId);

    const row = await cardRepository.findByDeck(data.deckId, userId);
    const created = row.find((r) => r.flashcard_id === data.flashcardId);
    if (!created) throw new NotFoundError('Card criado mas não encontrado');
    return toCard(created);
  },

  async removeCardFromDeck(
    deckId: number,
    cardId: number,
    requesterId: number,
    role: RoleName
  ): Promise<void> {
    const deck = await deckRepository.findById(deckId);
    if (!deck) throw new NotFoundError('Deck não encontrado');

    if (deck.type === 'general' && !canManagePublicDecks(role)) {
      throw new ForbiddenError('Apenas monitor, admin ou develop podem remover cards de decks gerais');
    }
    if (deck.type === 'private' && deck.owner_user_id !== requesterId) {
      throw new ForbiddenError('Apenas o dono do deck pode remover cards');
    }

    await cardRepository.deleteByDeckAndFlashcard(deckId, cardId);

    await activityLogRepository.insert({
      tableName: 'tb_cards',
      recordId: deckId,
      action: 'DELETE',
      userId: requesterId,
      summary: `Card ${cardId} removido do deck ${deckId}`,
    });
  },

  // ─── Suspend / Bury ─────────────────────────────────────────────────────────

  async suspend(cardId: number, userId: number): Promise<CardMutationResult> {
    const row = await cardRepository.findById(cardId, userId);
    if (!row) throw new NotFoundError('Card não encontrado');
    await cardRepository.suspend(cardId, userId);
    return { progressId: cardId, deckCardId: row.id };
  },

  async unsuspend(cardId: number, userId: number): Promise<CardMutationResult> {
    const row = await cardRepository.findById(cardId, userId);
    if (!row) throw new NotFoundError('Card não encontrado');
    await cardRepository.unsuspend(cardId, userId);
    return { progressId: cardId, deckCardId: row.id };
  },

  async bury(cardId: number, userId: number): Promise<CardMutationResult> {
    const row = await cardRepository.findById(cardId, userId);
    if (!row) throw new NotFoundError('Card não encontrado');
    await cardRepository.bury(cardId, userId);
    return { progressId: cardId, deckCardId: row.id };
  },

  async unburyExpired(deckId: number, userId: number): Promise<{ count: number }> {
    const deck = await deckRepository.findById(deckId);
    if (!deck) throw new NotFoundError('Deck não encontrado');
    const count = await cardRepository.unburyExpired(deckId, userId);
    return { count };
  },
};

export default cardService;
