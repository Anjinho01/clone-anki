/**
 * Adiciona um flashcard existente a um deck, criando a(s) instância(s) tb_cards.
 * - deck 'general': cria tb_cards para TODOS os usuários
 * - deck 'private': cria tb_cards somente para o owner
 */
export interface CreateCardDTO {
  deckId:      number;
  flashcardId: number;
}

/** Atualiza o estado FSRS de um card (ex: suspend/bury via flags). */
export interface UpdateCardDTO {
  isSuspended?: boolean;
  isBuried?:    boolean;
}

/** Vincula um flashcard existente a outro deck (M:N via tb_cards). */
export interface AddFlashcardToDeckDTO {
  flashcardId: number;
  deckId:      number;
}

