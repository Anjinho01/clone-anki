/**
 * DTOs de autenticação — request/response shapes
 */

import type { RoleName } from '../models/user.model';

// ─── Auth DTOs ────────────────────────────────────────────────

export interface SigninDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// ─── User Management DTOs (admin CRUD) ───────────────────────

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: RoleName;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: RoleName;
  isActive?: boolean;
}
