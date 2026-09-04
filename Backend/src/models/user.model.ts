import { RowDataPacket } from 'mysql2';

export type RoleName = 'develop' | 'admin' | 'monitor' | 'user';

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role_id: number;
  role: RoleName;          // vem do JOIN com tb_roles
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  userId: number;       // alias for id (expected by frontend)
  name: string;
  login: string;        // alias for email (no login column in DB)
  email: string;
  role: RoleName;
  roleId: number;       // from role_id join
  isActive: boolean;
  actived: boolean;     // alias for isActive (expected by frontend)
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    userId: row.id,
    name: row.name,
    login: row.email,
    email: row.email,
    role: row.role,
    roleId: row.role_id,
    isActive: row.is_active,
    actived: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
