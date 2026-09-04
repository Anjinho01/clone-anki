import {
  fsrs,
  generatorParameters,
  Grade,
  Rating as FSRSRating,
  State,
  Card as FSRSCard,
} from 'ts-fsrs';
import cardRepository from '../repositories/card.repository';
import reviewRepository from '../repositories/review.repository';
import deckRepository from '../repositories/deck.repository';
import { toCard, Card, CardRow } from '../models/card.model';
import { toReviewLog } from '../models/reviewLog.model';
import { SubmitReviewDTO } from '../dtos/review.dto';
import { NotFoundError, BadRequestError } from '../errors/httpError';
import logger from '../config/logger';

function createFSRS(desiredRetention?: number) {
  return fsrs(
    generatorParameters({ request_retention: desiredRetention ?? 0.9 })
  );
}

/**
 * Mapeia CardRow (estado de progresso do usuario) para o formato FSRSCard esperado por ts-fsrs.
 */
function cardRowToFSRS(row: CardRow, now: Date): FSRSCard {
  return {
    due:            row.due || now,
    stability:      row.stability,
    difficulty:     row.difficulty,
    elapsed_days:   row.elapsed_days,
    scheduled_days: row.scheduled_days,
    reps:           row.reps,
    lapses:         row.lapses,
    state:          row.state as State,
    last_review:    row.last_review || undefined,
  };
}

const GRADE_MAP: Record<number, Grade> = {
  1: FSRSRating.Again,
  2: FSRSRating.Hard,
  3: FSRSRating.Good,
  4: FSRSRating.Easy,
};

async function resolveCardReference(cardId: number, userId: number): Promise<CardRow | null> {
  const progressRow = await cardRepository.findById(cardId, userId);
  if (progressRow) {
    return progressRow;
  }

  return cardRepository.findByDeckCardId(cardId, userId);
}

async function resolveCardForReview(
  cardId: number,
  userId: number,
  options?: { ensureProgress?: boolean }
): Promise<CardRow> {
  let row = await resolveCardReference(cardId, userId);
  if (!row) {
    throw new NotFoundError('Card não encontrado');
  }

  if ((options?.ensureProgress ?? false) && !row.progress_id) {
    await cardRepository.ensureProgressForDeckCardId(row.id, userId);
    row = await cardRepository.findByDeckCardId(row.id, userId);
    if (!row || !row.progress_id) {
      throw new NotFoundError('Card não encontrado');
    }
  }

  return row;
}

const reviewService = {
  /**
   * Buscar cards para uma sessão de estudo.
   * Respeita limites diários do deck.
   */
  async getStudySession(deckId: number, userId: number, limit?: number): Promise<Card[]> {
    const deck = await deckRepository.findById(deckId);
    if (!deck) throw new NotFoundError('Deck não encontrado');

    await cardRepository.unburyExpired(deckId, userId);

    const newLimit    = limit ? Math.min(limit, deck.new_cards_per_day)    : deck.new_cards_per_day;
    const reviewLimit = limit ? Math.min(limit, deck.review_cards_per_day) : deck.review_cards_per_day;

    const rows = await cardRepository.findDueCards(deckId, userId, newLimit, reviewLimit);
    return rows.map(toCard);
  },

  /**
   * Preview dos intervalos sem alterar nada no banco.
   */
  async previewCard(
    cardId: number,
    userId: number,
    deckId?: number
  ): Promise<{
    again: { due: Date; scheduledDays: number; state: number };
    hard:  { due: Date; scheduledDays: number; state: number };
    good:  { due: Date; scheduledDays: number; state: number };
    easy:  { due: Date; scheduledDays: number; state: number };
  }> {
    const cardRow = await resolveCardForReview(cardId, userId);

    let desiredRetention: number | undefined;
    if (deckId) {
      const deck = await deckRepository.findById(deckId);
      desiredRetention = deck?.desired_retention;
    }
    const f = createFSRS(desiredRetention);

    const now = new Date();
    const fsrsCard = cardRowToFSRS(cardRow, now);
    const scheduling = f.repeat(fsrsCard, now);

    return {
      again: { due: scheduling[FSRSRating.Again].card.due, scheduledDays: scheduling[FSRSRating.Again].card.scheduled_days, state: scheduling[FSRSRating.Again].card.state },
      hard:  { due: scheduling[FSRSRating.Hard].card.due,  scheduledDays: scheduling[FSRSRating.Hard].card.scheduled_days,  state: scheduling[FSRSRating.Hard].card.state  },
      good:  { due: scheduling[FSRSRating.Good].card.due,  scheduledDays: scheduling[FSRSRating.Good].card.scheduled_days,  state: scheduling[FSRSRating.Good].card.state  },
      easy:  { due: scheduling[FSRSRating.Easy].card.due,  scheduledDays: scheduling[FSRSRating.Easy].card.scheduled_days,  state: scheduling[FSRSRating.Easy].card.state  },
    };
  },

  /**
   * Submete um review — aplica FSRS e atualiza tb_card_progress.
   * cardId pode ser progressId legado ou deckCardId estavel.
   * deckId (opcional) determina desired_retention usado.
   */
  async submitReview(userId: number, data: SubmitReviewDTO): Promise<{
    card: Card;
    nextReview: Date;
    scheduledDays: number;
  }> {
    const cardRow = await resolveCardForReview(data.cardId, userId, { ensureProgress: true });
    const progressId = cardRow.progress_id;

    if (!progressId) {
      throw new NotFoundError('Card não encontrado');
    }

    if (cardRow.is_suspended) throw new BadRequestError('Card está suspenso e não pode ser revisado');
    if (cardRow.is_buried)    throw new BadRequestError('Card está enterrado e não pode ser revisado hoje');

    let desiredRetention: number | undefined;
    if (data.deckId) {
      const deck = await deckRepository.findById(data.deckId);
      desiredRetention = deck?.desired_retention;
    }
    const f = createFSRS(desiredRetention);

    const now = new Date();
    const fsrsCard = cardRowToFSRS(cardRow, now);

    const grade = GRADE_MAP[data.rating];
    if (!grade) throw new BadRequestError('Rating deve ser 1 (Again), 2 (Hard), 3 (Good) ou 4 (Easy)');

    const schedulingResult = f.repeat(fsrsCard, now);
    const result      = schedulingResult[grade];
    const updatedCard = result.card;

    // Atualiza estado FSRS no tb_card_progress
    await cardRepository.updateFSRSState(
      progressId,
      userId,
      updatedCard.state,
      updatedCard.difficulty,
      updatedCard.stability,
      0, // retrievability recalculado quando consultado
      updatedCard.elapsed_days,
      updatedCard.scheduled_days,
      updatedCard.reps,
      updatedCard.lapses,
      updatedCard.due,
      now
    );

    // Log do review
    await reviewRepository.create(
      progressId,
      userId,
      data.rating,
      updatedCard.state,
      updatedCard.difficulty,
      updatedCard.stability,
      0,
      updatedCard.elapsed_days,
      updatedCard.scheduled_days,
      data.durationMs || 0,
      now,
      {
        state:          cardRow.state,
        difficulty:     cardRow.difficulty,
        stability:      cardRow.stability,
        retrievability: cardRow.retrievability,
        elapsed_days:   cardRow.elapsed_days,
        scheduled_days: cardRow.scheduled_days,
        reps:           cardRow.reps,
        lapses:         cardRow.lapses,
        due:            cardRow.due ?? now,
        last_review:    cardRow.last_review,
      }
    );

    logger.debug('Review processado', {
      cardId:     progressId,
      deckCardId: cardRow.id,
      rating:     data.rating,
      newState:   updatedCard.state,
      nextDue:    updatedCard.due,
      stability:  updatedCard.stability,
      difficulty: updatedCard.difficulty,
    });

    const updated = await cardRepository.findById(progressId, userId);
    return {
      card:          toCard(updated!),
      nextReview:    updatedCard.due,
      scheduledDays: updatedCard.scheduled_days,
    };
  },

  async getStats(userId: number, days = 30) {
    return reviewRepository.getStudyStats(userId, days);
  },

  async getCardHistory(cardId: number, userId: number) {
    const row = await resolveCardForReview(cardId, userId);

    if (!row.progress_id) {
      return [];
    }

    const logs = await reviewRepository.findByCard(row.progress_id, userId);
    return logs.map(toReviewLog);
  },

  /**
   * Desfaz o último review de um card.
   * Restaura o estado FSRS anterior via snapshot pré-review.
   */
  async undoLastReview(
    cardId: number,
    userId: number
  ): Promise<{ card: Card; message: string }> {
    const cardRow = await resolveCardForReview(cardId, userId);
    const progressId = cardRow.progress_id;

    if (!progressId) {
      throw new BadRequestError('Card ainda não possui review para desfazer');
    }

    const lastReview = await reviewRepository.findLastByCard(progressId, userId);
    if (!lastReview) throw new NotFoundError('Nenhum review encontrado para desfazer');

    if (lastReview.pre_state === null || lastReview.pre_state === undefined) {
      throw new BadRequestError('Este review não possui snapshot para undo (review antigo)');
    }

    await cardRepository.updateFSRSState(
      progressId,
      userId,
      lastReview.pre_state!,
      lastReview.pre_difficulty!,
      lastReview.pre_stability!,
      lastReview.pre_retrievability!,
      lastReview.pre_elapsed_days!,
      lastReview.pre_scheduled_days!,
      lastReview.pre_reps!,
      lastReview.pre_lapses!,
      lastReview.pre_due!,
      lastReview.pre_last_review
    );

    await reviewRepository.deleteById(lastReview.id, userId);

    logger.info('Review desfeito', {
      progressId,
      deckCardId: cardRow.id,
      reviewId: lastReview.id,
      userId,
    });

    const updated = await cardRepository.findById(progressId, userId);
    return {
      card:    toCard(updated!),
      message: 'Último review desfeito com sucesso',
    };
  },
};

export default reviewService;
