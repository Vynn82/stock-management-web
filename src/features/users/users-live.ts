import { api, listAll } from "@/features/live/http";

/** Team members and roles from the real API. */

export interface TeamMemberRow {
  id: string;
  name: string;
  staffId: string;
  email: string;
  role: string;
  /** CSS suffix for the existing role badge: admin | manager | staff. */
  roleClass: string;
  status: "Active" | "Invite pending" | "Inactive" | "Locked";
  joined: string;
}

export interface RoleRow {
  id: string;
  name: string;
}

interface ApiUser {
  id: string;
  staffId: string;
  status?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
  profile?: { firstName?: string; lastName?: string; email?: string } | null;
  userRoles?: { role?: { id: string; name: string } | null }[];
}

export function roleLabel(name: string): string {
  switch (name) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "STAFF":
      return "Staff";
    default:
      return name
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

function roleClassOf(name: string): string {
  if (name === "SUPER_ADMIN" || name === "ADMIN") return "admin";
  if (name === "MANAGER") return "manager";
  return "staff";
}

function toMember(u: ApiUser): TeamMemberRow {
  const role = u.userRoles?.map((r) => r.role?.name).find(Boolean) ?? "STAFF";
  const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ").trim() || u.staffId;
  let status: TeamMemberRow["status"] = "Active";
  if (u.status === "INACTIVE") status = "Inactive";
  else if (u.status === "LOCKED") status = "Locked";
  else if (u.mustChangePassword) status = "Invite pending";
  return {
    id: u.id,
    name,
    staffId: u.staffId,
    email: u.profile?.email ?? "—",
    role: roleLabel(role),
    roleClass: roleClassOf(role),
    status,
    joined: u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      : "—",
  };
}

export async function fetchTeamMembers(): Promise<TeamMemberRow[]> {
  return (await listAll<ApiUser>("users")).map(toMember);
}

export async function fetchRoles(): Promise<RoleRow[]> {
  return listAll<RoleRow>("roles");
}

/** `PUT /users/:id/role` (needs USER_ROLE_UPDATE). */
export async function changeMemberRole(userId: string, roleId: string): Promise<void> {
  await api.put(`users/${userId}/role`, { roleId });
}

export interface InviteInput {
  firstName: string;
  lastName: string;
  email: string;
  roleId?: string;
}

/** Creates the user; the server generates the Staff ID and emails a temporary password. */
export async function inviteMember(input: InviteInput): Promise<void> {
  await api.post("users", {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    ...(input.roleId ? { roleId: input.roleId } : {}),
  });
}
