import { BaseEntity, StatusType } from "@/types/common";

export interface UserAccount extends BaseEntity, Record<string, unknown> {
  id: string;
  staffId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  telegramChatId?: string;
  role?: string;
  status?: StatusType;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegramChatId?: string;
}

export interface UpdateUserRoleInput {
  role: string;
}

// Aliases for compatibility
export type StaffMember = UserAccount;
export type CreateStaffInput = CreateUserInput;
