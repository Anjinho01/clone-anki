/**
 * Raw user object returned by the backend API.
 */
export type RawApiUser = {
  id?: number;
  userId?: number;
  name?: string;
  email?: string;
  role?: string;
  photoURL?: string;
  loginRedirectUrl?: string;
};

/**
 * The type definition for a user object stored in Redux.
 */
export type UserType = {
  userId: number | null;
  role: string | null;
  data: {
    displayName: string;
    displayRole: string;
    email?: string;
    photoURL?: string;
  };
  loginRedirectUrl?: string;
};

export default UserType;
