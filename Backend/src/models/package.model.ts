import { RowDataPacket } from 'mysql2';

export interface PackageRow extends RowDataPacket {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  type: 'general' | 'private';
  owner_user_id: number | null;
  created_by: number | null;
  position: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Package {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  type: 'general' | 'private';
  ownerUserId: number | null;
  createdBy: number | null;
  position: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toPackage(row: PackageRow): Package {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    description: row.description,
    type: row.type,
    ownerUserId: row.owner_user_id,
    createdBy: row.created_by,
    position: row.position,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
