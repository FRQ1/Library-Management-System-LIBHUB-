export type UserRole = 'admin' | 'librarian' | 'member';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function getUserId(user: User | null | undefined): string {
  if (!user) return '';
  return user._id || user.id || '';
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  data: {
    user: User;
  };
}

