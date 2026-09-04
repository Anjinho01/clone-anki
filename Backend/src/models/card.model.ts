import { RowDataPacket } from 'mysql2';

// ─── Enums FSRS ───────────────────────────────────────────────────────────────

export enum CardState {
  New        = 0,
  Learning   = 1,
  Review     = 2,
  Relearning = 3,
}

export enum Rating {
  Again = 1,
  Hard  = 2,
  Good  = 3,
  Easy  = 4,
}

// ─── Raw DB row ───────────────────────────────────────────────────────────────

/**
 * CardRow — linha de tb_card_progress com os campos do card reutilizável via
 * JOIN em tb_deck_cards + tb_cards.
 */
export interface CardRow extends RowDataPacket {
  // Identificador estável da associação deck/card
  id:             number;
  progress_id?:   number | null;
  deck_id:        number;
  card_id?:       number;
  flashcard_id:   number;
  user_id?:       number | null;
  deck_card_id?:  number;

  // Estado FSRS (tb_card_progress)
  state:          number;
  difficulty:     number;
  stability:      number;
  retrievability: number;
  elapsed_days:   number;
  scheduled_days: number;
  reps:           number;
  lapses:         number;
  due:            Date | null;
  last_review:    Date | null;
  is_suspended:   boolean;
  is_buried:      boolean;
  is_deleted:     boolean;
  created_at:     Date;
  updated_at:     Date;

  // Campos do card reutilizável (JOIN — prefixo f_ preservado por compatibilidade)
  f_front:        string;
  f_back:         string;
  f_card_type:    'basic' | 'reverse' | 'cloze' | 'mcq';
  f_mcq_options:  string | null;  // JSON serializado
  f_mcq_correct:  number | null;
}

// ─── Domain type ──────────────────────────────────────────────────────────────

export interface Card {
  id:             number;
  progressId?:    number | null;
  deckId:         number;
  cardId?:        number;
  flashcardId:    number;
  userId?:        number | null;
  // Conteúdo do flashcard
  front:          string;
  back:           string;
  cardType:       'basic' | 'reversed' | 'cloze' | 'mcq';
  mcqOptions:     string[] | null;
  mcqCorrect:     number | null;
  // Estado FSRS
  state:          CardState;
  difficulty:     number;
  stability:      number;
  retrievability: number;
  elapsedDays:    number;
  scheduledDays:  number;
  reps:           number;
  lapses:         number;
  due:            Date | null;
  lastReview:     Date | null;
  isSuspended:    boolean;
  isBuried:       boolean;
  isDeleted:      boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

// ─── Converter ────────────────────────────────────────────────────────────────

export function toCard(row: CardRow): Card {
  return {
    id:             row.id,
    progressId:     row.progress_id ?? null,
    deckId:         row.deck_id,
    cardId:         row.card_id ?? row.flashcard_id,
    flashcardId:    row.flashcard_id,
    userId:         row.user_id ?? null,
    front:          row.f_front,
    back:           row.f_back,
    cardType:       row.f_card_type === 'reverse' ? 'reversed' : row.f_card_type,
    mcqOptions:     row.f_mcq_options ? JSON.parse(row.f_mcq_options) : null,
    mcqCorrect:     row.f_mcq_correct,
    state:          row.state as CardState,
    difficulty:     row.difficulty,
    stability:      row.stability,
    retrievability: row.retrievability,
    elapsedDays:    row.elapsed_days,
    scheduledDays:  row.scheduled_days,
    reps:           row.reps,
    lapses:         row.lapses,
    due:            row.due ?? null,
    lastReview:     row.last_review,
    isSuspended:    row.is_suspended,
    isBuried:       row.is_buried,
    isDeleted:      row.is_deleted,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

