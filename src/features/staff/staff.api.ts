import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  UserAccount,
  CreateUserInput,
  UpdateUserRoleInput,
} from "./staff.types";

const INITIAL_USERS: UserAccount[] = [
  {
    id: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
    staffId: "KH0001",
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex@company.com",
    phone: "012345678",
    telegramChatId: "123456789",
    role: "SUPER_ADMIN",
    status: "active",
  },
  {
    id: "693a56ed-5436-4756-ba32-ff09e691fbfd",
    staffId: "KH0002",
    firstName: "Samantha",
    lastName: "Lee",
    email: "sam@company.com",
    phone: "098765432",
    telegramChatId: "987654321",
    role: "STAFF",
    status: "active",
  },
  {
    id: "1b5e9619-67e1-436a-b494-482acb94bffa",
    staffId: "KH0003",
    firstName: "David",
    lastName: "Miller",
    email: "david@company.com",
    phone: "011223344",
    role: "STAFF",
    status: "active",
  },
  {
    id: "027d43f8-4ff9-43da-8776-fea13f923f77",
    staffId: "KH0004",
    firstName: "Mo",
    lastName: "Lika",
    email: "molikakhorn71@gmail.com",
    phone: "012345678",
    telegramChatId: "123456789",
    role: "STAFF",
    status: "active",
  },
];

export async function getUsers(): Promise<UserAccount[]> {
  try {
    const data = await request<UserAccount[]>(API_ENDPOINTS.USERS.LIST, "GET");
    return Array.isArray(data) && data.length > 0 ? data : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export async function getMe(): Promise<UserAccount | null> {
  try {
    return await request<UserAccount>(API_ENDPOINTS.USERS.ME, "GET");
  } catch {
    return null;
  }
}

export async function createUser(
  payload: CreateUserInput,
): Promise<UserAccount> {
  try {
    return await request<UserAccount>(
      API_ENDPOINTS.USERS.CREATE,
      "POST",
      payload,
    );
  } catch (err) {
    console.warn("Backend users/create offline, saving to mock list:", err);
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      staffId:
        ((payload as unknown as Record<string, unknown>).staffId as string) ||
        `KH000${INITIAL_USERS.length + 1}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      telegramChatId: payload.telegramChatId,
      role:
        ((payload as unknown as Record<string, unknown>).role as string) ||
        "STAFF",
      status: "active",
    };
    INITIAL_USERS.unshift(newUser);
    return newUser;
  }
}

export async function updateUserRole(
  id: string,
  payload: UpdateUserRoleInput,
): Promise<unknown> {
  try {
    return await request(API_ENDPOINTS.USERS.UPDATE_ROLE(id), "PUT", payload);
  } catch (err) {
    console.warn("Backend users/role offline, updating mock list:", err);
    const target = INITIAL_USERS.find((u) => u.id === id);
    if (target) {
      target.role = payload.role;
    }
    return { success: true };
  }
}

// Aliases for compatibility
export const getStaffList = getUsers;
export const createStaffMember = createUser;
export async function deleteStaffMember(id: string): Promise<void> {
  try {
    await request(`users/${id}`, "DELETE");
  } catch (err) {
    console.warn("Backend users/delete offline, removing from mock list:", err);
    const idx = INITIAL_USERS.findIndex((u) => u.id === id);
    if (idx !== -1) {
      INITIAL_USERS.splice(idx, 1);
    }
  }
}
