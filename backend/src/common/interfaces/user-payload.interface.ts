export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  branch: string; // 'HN' | 'HCM' | 'DN' | 'ALL'
  fullName: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  branch: string;
  fullName: string;
  permissions?: string[];
}
