export interface CreateLibraryCardDTO {
  type?: 'general' | 'private';
  ownerUserId?: number | null;
  front: string;
  back: string;
  cardType?: 'basic' | 'reverse' | 'reversed' | 'cloze' | 'mcq';
  mcqOptions?: string[];
  mcqCorrect?: number;
}

export interface UpdateLibraryCardDTO {
  type?: 'general' | 'private';
  ownerUserId?: number | null;
  front?: string;
  back?: string;
  cardType?: 'basic' | 'reverse' | 'reversed' | 'cloze' | 'mcq';
  mcqOptions?: string[];
  mcqCorrect?: number;
}