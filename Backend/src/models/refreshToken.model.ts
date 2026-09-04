import { RowDataPacket } from 'mysql2';

export interface RefreshTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token_hash: string;
  jti: string;
  expires_at: Date;
  is_revoked: boolean;
  replaced_by: string | null;
  created_at: Date;
}
