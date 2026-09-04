export interface FlashcardType {
  id: number;
  uuid: string;
  type?: 'general' | 'private';
  ownerUserId?: number | null;
  createdBy: number;
  front: string;
  back: string;
  cardType: 'basic' | 'reversed' | 'cloze' | 'mcq';
  mcqOptions?: string[] | null;
  mcqCorrect?: string | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeckType {
  id: number;
  uuid: string;
  packageId?: number | null;
  name: string;
  description?: string | null;
  type: 'general' | 'private';
  ownerUserId?: number | null;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
  desiredRetention: number;
  position: number;
  createdBy?: number | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  cardCount?: {
    total: number;
    new: number;
    due: number;
  };
}

export interface CardType {
  id: number;
  progressId?: number | null;
  deckId: number;
  cardId?: number;
  flashcardId: number;
  userId?: number | null;
  // Content from JOIN with tb_flashcards
  front: string;
  back: string;
  cardType: 'basic' | 'reversed' | 'cloze' | 'mcq';
  mcqOptions?: string[] | null;
  mcqCorrect?: string | null;
  // FSRS state (0=New, 1=Learning, 2=Review, 3=Relearning)
  state: 0 | 1 | 2 | 3;
  difficulty: number;
  stability: number;
  retrievability: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  due?: string | null;
  lastReview?: string | null;
  isSuspended?: boolean;
  isBuried?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashcardApiResponse {
  success: boolean;
  data: FlashcardType[];
}

export interface PackageGroupType {
  id: number;
  uuid: string;
  name: string;
  description?: string | null;
  type: 'general' | 'private';
  ownerUserId?: number | null;
  createdBy?: number | null;
  position: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageApiResponse {
  success: boolean;
  data: PackageGroupType[];
}

export interface DeckApiResponse {
  success: boolean;
  data: DeckType[];
}

export interface DeckByIdApiResponse {
  success: boolean;
  data: DeckType;
}

export interface CardApiResponse {
  success: boolean;
  data: CardType[];
}
