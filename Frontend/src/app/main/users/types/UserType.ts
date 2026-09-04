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
  role: string;
};

/**
 * Users Type
 */
export type UsersType = UserType[];
