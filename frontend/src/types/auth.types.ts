export type UserRole =
  | 'SUPER_ADMIN'
  | 'MANAGER_HN'
  | 'MANAGER_HCM'
  | 'QC_INSPECTOR'
  | 'AUDITOR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branch: string; // 'HN' | 'HCM' | 'DN' | 'ALL'
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
