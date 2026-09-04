import { RowDataPacket } from 'mysql2';

export interface RoleRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}
