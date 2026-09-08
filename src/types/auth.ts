export interface UserProfile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  telegramChatId?: string | null;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserMenuItem {
  id: string;
  name: string;
  label: string;
  path?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  children?: UserMenuItem[];
}

export interface CurrentUserResponse {
  id: string;
  staffId: string;
  status: string;
  mustChangePassword: boolean;
  profile?: UserProfile;
  roles: string[];
  permissions: string[];
  menus: UserMenuItem[];
}

export interface User {
  id: string;
  staffId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  telegramChatId?: string | null;
  avatar?: string | null;
  role?: string;
  roleId?: string;
  roles?: string[];
  permissions?: string[];
  menus?: UserMenuItem[];
  mustChangePassword?: boolean;
  status?: string;
  profile?: UserProfile;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
