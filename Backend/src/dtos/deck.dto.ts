export interface CreateDeckDTO {
  packageId?:         number | null;
  name:             string;
  description?:     string;
  type?:            'general' | 'private';
  newCardsPerDay?:  number;
  reviewCardsPerDay?: number;
  desiredRetention?: number;
  position?:        number;
}

export interface UpdateDeckDTO {
  packageId?:          number | null;
  name?:             string;
  description?:      string;
  newCardsPerDay?:   number;
  reviewCardsPerDay?: number;
  desiredRetention?: number;
  position?:         number;
}

