/**
 * User Type
 */
export type UserType = {
  id: number;
  userId: number;
  name: string;
  login: string;
  email: string;
  actived: boolean;
  roleId: number;
  role: 'develop' | 'admin' | 'manager' | 'coordinator' | 'crm' | 'coren';
  createdAt?: Date;
  updatedAt?: Date;
};

/*** formato completo da resposta JSON ***/
export interface UserApiResponse {
  data: UserType | null;
}
