export type { FlashcardType } from '../../decks/types/DeckTypes';

export interface LibraryCardsPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
}

export interface LibraryCardsLimits {
  privateOwnedCards: {
    current: number;
    max: number;
  };
}

export interface LibraryCardsApiResponse {
  success: boolean;
  data: FlashcardType[];
  pagination: LibraryCardsPagination;
  limits: LibraryCardsLimits;
}

export const CARD_TYPE_OPTIONS: Array<{
  value: 'basic' | 'reversed' | 'cloze' | 'mcq';
  label: string;
}> = [
  { value: 'basic', label: 'Basico' },
  { value: 'reversed', label: 'Reverso' },
  { value: 'cloze', label: 'Lacuna' },
  { value: 'mcq', label: 'Multipla Escolha' },
];

export const VISIBILITY_OPTIONS: Array<{ value: 'general' | 'private'; label: string }> = [
  { value: 'general', label: 'Publico' },
  { value: 'private', label: 'Privado' },
];

export const CARD_TYPE_COLORS: Record<'basic' | 'reversed' | 'cloze' | 'mcq', string> = {
  basic: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  reversed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  cloze: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  mcq: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export const VISIBILITY_COLORS: Record<'general' | 'private', string> = {
  general: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  private: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};
