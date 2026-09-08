import { User } from "@/types/auth";

export interface LoginPayload {
  staffId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  mustChangePassword: boolean;
  user?: User;
  [key: string]: unknown;
}

export interface SetupPasswordPayload {
  currentPassword: string;
  newPassword: string;
}
