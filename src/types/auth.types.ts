/**
 * Authentication types and interfaces
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  emailVerified: boolean;
  subscription?: {
    type: 'free' | 'trial' | 'premium';
    expiresAt?: Date;
  };
  preferences?: {
    language: string;
    notifications: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface NewPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export type AuthState = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthStore {
  user: User | null;
  token: string | null;
  state: AuthState;
  error: AuthError | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}