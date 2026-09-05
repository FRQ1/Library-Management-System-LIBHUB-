export type UserRole = 'admin' | 'librarian' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  data: {
    user: User;
  };
}
