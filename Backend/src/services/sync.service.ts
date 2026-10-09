import { getPool } from '../config/database';
import { ResultSetHeader } from 'mysql2';
import syncRepository from '../repositories/sync.repository';
import deckRepository from '../repositories/deck.repository';
import cardRepository from '../repositories/card.repository';
import reviewRepository from '../repositories/review.repository';
import {
  SyncRequestDTO,
  SyncResponseDTO,
  SyncChange,
  SyncAppliedResult,
  SyncServerChange,
  SyncConflict,
} from '../dtos/sync.dto';
import logger from '../config/logger';

/**
 * Serviço de sincronização — protocolo AnkiWeb-like
 *
 * Fluxo:
 * 1. Client envia lastSyncAt + changes[] (mudanças locais)
 * 2. Server aplica changes do client (com detecção de conflito)
 * 3. Server retorna mudanças do servidor desde lastSyncAt
 * 4. Client aplica serverChanges localmente
 *
 * Estratégia de conflito: last-write-wins (comparando updated_at)
 */
const syncService = {
  async sync(userId: number, request: SyncRequestDTO): Promise<SyncResponseDTO> {
    const now = new Date();

    const since = request.lastSyncAt ? new Date(request.lastSyncAt) : null;

    const applied: SyncAppliedResult[] = [];
    const conflicts: SyncConflict[] = [];

    // -- 1. Aplicar mudanças do client ---

    for (const change of request.changes) {
      try {
        const result = await applyClientChange(userId, change);
        applied.push(result);

        if (result.status === 'conflict') {
          conflicts.push({
            entity: change.entity,
            id: result.serverId,
            clientId: change.clientId,
            reason: 'Versão do servidor é mais recente',
            resolution: 'server_wins',
            serverData: {}, // será preenchido nos serverChanges
          });
        }
      } catch (error) {
        logger.error('Erro ao aplicar sync change', { change, error });
        applied.push({
          clientId: change.clientId,
          entity: change.entity,
          action: change.action,
          serverId: change.id || 0,
          status: 'skipped',
        });
      }
    }

    // -- 2. Buscar mudanças do servidor ---

    const serverChanges: SyncServerChange[] = [];

    if (since) {
      // Mudanças desde o último sync
      const decks = await syncRepository.getDecksChangedSince(userId, since);
      const cards = await syncRepository.getCardsChangedSince(userId, since);
      const reviews = await syncRepository.getReviewLogsCreatedSince(userId, since);

      for (const deck of decks) {
        serverChanges.push({
          entity: 'deck',
          action: deck.is_deleted ? 'delete' : 'update',
          id: deck.id,
          data: deckRowToSyncData(deck),
          updatedAt: deck.updated_at.toISOString(),
        });
      }

      for (const card of cards) {
        serverChanges.push({
          entity: 'card',
          action: card.is_deleted ? 'delete' : 'update',
          id: card.id,
          data: cardRowToSyncData(card),
          updatedAt: card.updated_at.toISOString(),
        });
      }

      for (const review of reviews) {
        serverChanges.push({
          entity: 'reviewLog',
          action: 'create',
          id: review.id,
          data: reviewRowToSyncData(review),
          updatedAt: review.created_at.toISOString(),
        });
      }
    } else {
      // Primeiro sync — enviar tudo
      const decks = await syncRepository.getAllDecks(userId);
      const cards = await syncRepository.getAllCards(userId);
      const reviews = await syncRepository.getAllReviewLogs(userId);

      for (const deck of decks) {
        serverChanges.push({
          entity: 'deck',
          action: 'create',
          id: deck.id,
          data: deckRowToSyncData(deck),
          updatedAt: deck.updated_at.toISOString(),
        });
      }

      for (const card of cards) {
        serverChanges.push({
          entity: 'card',
          action: 'create',
          id: card.id,
          data: cardRowToSyncData(card),
          updatedAt: card.updated_at.toISOString(),
        });
      }

      for (const review of reviews) {
        serverChanges.push({
          entity: 'reviewLog',
          action: 'create',
          id: review.id,
          data: reviewRowToSyncData(review),
          updatedAt: review.created_at.toISOString(),
        });
      }
    }

    // -- 3. Salvar timestamp do sync ---
    await syncRepository.saveSyncTimestamp(userId, now);

    logger.info('Sync concluído', {
      userId,
      clientChanges: request.changes.length,
      applied: applied.filter((a) => a.status === 'applied').length,
      conflicts: conflicts.length,
      serverChanges: serverChanges.length,
    });

    return {
      applied,
      serverChanges,
      newSyncAt: now.toISOString(),
      conflicts,
    };
  },
};

// -- Helpers internos ---

async function applyClientChange(
  userId: number,
  change: SyncChange
): Promise<SyncAppliedResult> {

  switch (change.entity) {
    case 'deck':
      return applyDeckChange(userId, change);
    case 'card':
      return applyCardChange(userId, change);
    case 'reviewLog':
      return applyReviewLogChange(userId, change);
    default:
      return {
        clientId: change.clientId,
        entity: change.entity,
        action: change.action,
        serverId: 0,
        status: 'skipped',
      };
  }
}

async function applyDeckChange(userId: number, change: SyncChange): Promise<SyncAppliedResult> {
  const pool = getPool();
  const d = change.data;

  if (change.action === 'create') {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tb_decks (user_id, name, description, parent_deck_id,
       new_cards_per_day, review_cards_per_day, desired_retention)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, d.name, d.description || null, d.parentDeckId || null,
       d.newCardsPerDay ?? 20, d.reviewCardsPerDay ?? 200, d.desiredRetention ?? 0.9]
    );

    return {
      clientId: change.clientId,
      entity: 'deck',
      action: 'create',
      serverId: result.insertId,
      status: 'applied',
    };
  }

  if (change.action === 'update' && change.id) {
    // Verificar conflito: server wins se updated_at > client updatedAt
    const existing = await deckRepository.findById(change.id);
    if (existing && new Date(change.updatedAt) < existing.updated_at) {
      return {
        clientId: change.clientId,
        entity: 'deck',
        action: 'update',
        serverId: change.id,
        status: 'conflict',
      };
    }

    const fields: Record<string, unknown> = {};
    if (d.name !== undefined) fields.name = d.name;
    if (d.description !== undefined) fields.description = d.description;
    if (d.parentDeckId !== undefined) fields.parent_deck_id = d.parentDeckId;
    if (d.newCardsPerDay !== undefined) fields.new_cards_per_day = d.newCardsPerDay;
    if (d.reviewCardsPerDay !== undefined) fields.review_cards_per_day = d.reviewCardsPerDay;
    if (d.desiredRetention !== undefined) fields.desired_retention = d.desiredRetention;

    await deckRepository.update(change.id, fields);
    return { clientId: change.clientId, entity: 'deck', action: 'update', serverId: change.id, status: 'applied' };
  }

  if (change.action === 'delete' && change.id) {
    await deckRepository.softDelete(change.id);
    return { clientId: change.clientId, entity: 'deck', action: 'delete', serverId: change.id, status: 'applied' };
  }

  return { clientId: change.clientId, entity: 'deck', action: change.action, serverId: 0, status: 'skipped' };
}

async function applyCardChange(userId: number, change: SyncChange): Promise<SyncAppliedResult> {
  const d = change.data;
  const requestedProgressId =
    typeof d.progressId === 'number' && Number.isFinite(d.progressId)
      ? (d.progressId as number)
      : change.id;

  if (change.action === 'create') {
    // Progresso do usuário é criado a partir de uma associação deck-card.
    // O cliente continua enviando flashcardId por compatibilidade; internamente
    // isso referencia o card reutilizável em tb_cards.
    if (!d.flashcardId || !d.deckId) {
      return { clientId: change.clientId, entity: 'card', action: 'create', serverId: 0, status: 'skipped' };
    }
    await cardRepository.createInstance(
      d.deckId as number,
      d.flashcardId as number,
      userId
    );
    // Fetch the inserted row to get server id
    const rows = await cardRepository.findByDeck(d.deckId as number, userId);
    const inserted = rows.find((r) => r.flashcard_id === d.flashcardId);
    const serverId = inserted ? inserted.id : 0;

    return { clientId: change.clientId, entity: 'card', action: 'create', serverId, status: 'applied' };
  }

  if (change.action === 'update' && requestedProgressId) {
    const existing = await cardRepository.findById(requestedProgressId, userId);
    if (existing && new Date(change.updatedAt) < existing.updated_at) {
      return { clientId: change.clientId, entity: 'card', action: 'update', serverId: requestedProgressId, status: 'conflict' };
    }

    // Para reviews do FSRS vindos do mobile offline, atualizar estado completo
    if (d.state !== undefined) {
      await cardRepository.updateFSRSState(
        requestedProgressId, userId,
        d.state as number, d.difficulty as number, d.stability as number,
        d.retrievability as number, d.elapsedDays as number, d.scheduledDays as number,
        d.reps as number, d.lapses as number, d.due as Date, d.lastReview as Date
      );
    } else {
      const fields: Record<string, unknown> = {};
      // deckId/front/back/cardType pertencem ao relacionamento deck-card e ao
      // card reutilizável; o sync offline atual mantém apenas o progresso FSRS.
      await cardRepository.update(requestedProgressId, userId, fields);
    }

    return { clientId: change.clientId, entity: 'card', action: 'update', serverId: requestedProgressId, status: 'applied' };
  }

  if (change.action === 'delete' && requestedProgressId) {
    await cardRepository.softDelete(requestedProgressId, userId);
    return { clientId: change.clientId, entity: 'card', action: 'delete', serverId: requestedProgressId, status: 'applied' };
  }

  return { clientId: change.clientId, entity: 'card', action: change.action, serverId: 0, status: 'skipped' };
}

async function applyReviewLogChange(userId: number, change: SyncChange): Promise<SyncAppliedResult> {
  const d = change.data;

  // Review logs são append-only — só create
  if (change.action === 'create') {
    const id = await reviewRepository.create(
      d.cardId as number, userId, d.rating as number, d.state as number,
      d.difficulty as number, d.stability as number, d.retrievability as number,
      d.elapsedDays as number, d.scheduledDays as number,
      d.durationMs as number || 0, new Date(d.reviewedAt as string)
    );

    return { clientId: change.clientId, entity: 'reviewLog', action: 'create', serverId: id, status: 'applied' };
  }

  return { clientId: change.clientId, entity: 'reviewLog', action: change.action, serverId: 0, status: 'skipped' };
}

// -- Conversores de row para sync data ---

function deckRowToSyncData(row: Record<string, unknown>): Record<string, unknown> {
  return {
    name: row.name,
    description: row.description,
    type: row.type,
    ownerUserId: row.owner_user_id,
    newCardsPerDay: row.new_cards_per_day,
    reviewCardsPerDay: row.review_cards_per_day,
    desiredRetention: row.desired_retention,
    isDeleted: row.is_deleted,
  };
}

function cardRowToSyncData(row: Record<string, unknown>): Record<string, unknown> {
  return {
    progressId: row.progress_id ?? null,
    deckId: row.deck_id,
    flashcardId: row.flashcard_id,
    // Content from tb_packages JOIN (f_ prefix)
    front: row.f_front,
    back: row.f_back,
    front_img_url: row.f_front_img_url,
    back_img_url: row.f_back_img_url,
    cardType: row.f_card_type,
    mcqOptions: row.f_mcq_options ? JSON.parse(row.f_mcq_options as string) : null,
    mcqCorrect: row.f_mcq_correct,
    state: row.state,
    difficulty: row.difficulty,
    stability: row.stability,
    retrievability: row.retrievability,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    due: row.due,
    lastReview: row.last_review,
    isDeleted: row.is_deleted,
  };
}

function reviewRowToSyncData(row: Record<string, unknown>): Record<string, unknown> {
  return {
    cardId: row.card_progress_id,
    rating: row.rating,
    state: row.state,
    difficulty: row.difficulty,
    stability: row.stability,
    retrievability: row.retrievability,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    durationMs: row.duration_ms,
    reviewedAt: row.reviewed_at,
  };
}

export default syncService;
