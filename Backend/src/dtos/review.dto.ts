export interface SubmitReviewDTO {
  /** Aceita `progressId` legado ou `deckCardId` estável. */
  cardId: number;
  rating: 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
  durationMs?: number;
  /** Deck no contexto do qual o review está acontecendo (para desired_retention). */
  deckId?: number;
}

export interface StudySessionDTO {
  deckId: number;
  limit?: number; // quantidade máxima de cards
}
