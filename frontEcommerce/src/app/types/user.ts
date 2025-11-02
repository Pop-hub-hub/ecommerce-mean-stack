export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;            // ده الـ accessToken
  refreshToken: string;     // لازم نضيفه
  role: 'user' | 'admin';
  isActive?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

