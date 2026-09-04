import { RowDataPacket } from 'mysql2';

export interface DeckRow extends RowDataPacket {
  id:                  number;
  uuid:                string;
  package_id:          number | null;
  name:                string;
  description:         string | null;
  type:                'general' | 'private';
  owner_user_id:       number | null;
  new_cards_per_day:   number;
  review_cards_per_day: number;
  desired_retention:   number;
  position:            number;
  created_by:          number | null;
  is_deleted:          boolean;
  created_at:          Date;
  updated_at:          Date;
}

export interface Deck {
  id:                  number;
  uuid:                string;
  packageId:           number | null;
  name:                string;
  description:         string | null;
  type:                'general' | 'private';
  ownerUserId:         number | null;
  newCardsPerDay:      number;
  reviewCardsPerDay:   number;
  desiredRetention:    number;
  position:            number;
  createdBy:           number | null;
  isDeleted:           boolean;
  createdAt:           Date;
  updatedAt:           Date;
}

export function toDeck(row: DeckRow): Deck {
  return {
    id:                row.id,
    uuid:              row.uuid,
    packageId:         row.package_id,
    name:              row.name,
    description:       row.description,
    type:              row.type,
    ownerUserId:       row.owner_user_id,
    newCardsPerDay:    row.new_cards_per_day,
    reviewCardsPerDay: row.review_cards_per_day,
    desiredRetention:  row.desired_retention,
    position:          row.position,
    createdBy:         row.created_by,
    isDeleted:         row.is_deleted,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  };
}

