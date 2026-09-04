import { RowDataPacket } from 'mysql2';

export interface LibraryCardRow extends RowDataPacket {
  id: number;
  uuid: string;
  type: 'general' | 'private';
  owner_user_id: number | null;
  created_by: number;
  front: string;
  back: string;
  card_type: 'basic' | 'reverse' | 'cloze' | 'mcq';
  mcq_options: string | null;
  mcq_correct: number | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LibraryCard {
  id: number;
  uuid: string;
  type: 'general' | 'private';
  ownerUserId: number | null;
  createdBy: number;
  front: string;
  back: string;
  cardType: 'basic' | 'reversed' | 'cloze' | 'mcq';
  mcqOptions: string[] | null;
  mcqCorrect: number | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toLibraryCard(row: LibraryCardRow): LibraryCard {
  return {
    id: row.id,
    uuid: row.uuid,
    type: row.type,
    ownerUserId: row.owner_user_id,
    createdBy: row.created_by,
    front: row.front,
    back: row.back,
    cardType: row.card_type === 'reverse' ? 'reversed' : row.card_type,
    mcqOptions: row.mcq_options ? JSON.parse(row.mcq_options) : null,
    mcqCorrect: row.mcq_correct,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}