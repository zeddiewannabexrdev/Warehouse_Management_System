import { UserRole } from './auth.types';

export interface UserRecord {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branch: 'HN' | 'HCM' | 'DN' | 'ALL';
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface PaginatedUsersResponse {
  items: UserRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  branch: 'HN' | 'HCM' | 'DN' | 'ALL';
  phoneNumber?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  branch?: 'HN' | 'HCM' | 'DN' | 'ALL';
  phoneNumber?: string;
  isActive?: boolean;
}

export interface UserFilterQuery {
  search?: string;
  branch?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}
