export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  displayName?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
  timestamp?: string;
}