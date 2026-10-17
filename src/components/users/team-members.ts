export type TeamRole = "Admin" | "Manager" | "Staff";
export type TeamMember = {
  name: string;
  staffId: string;
  email: string;
  role: TeamRole;
  status: "Active" | "Invite pending";
  joined: string;
  isCurrentUser?: boolean;
};

export const initialTeamMembers: TeamMember[] = [
  { name: "Visal Khem", staffId: "STF-2045", email: "visal.khem@stockflow.io", role: "Admin", status: "Active", joined: "Jan 12, 2025", isCurrentUser: true },
  { name: "Sokha Chan", staffId: "STF-2046", email: "sokha.chan@stockflow.io", role: "Manager", status: "Active", joined: "Mar 03, 2025" },
  { name: "Dara Pich", staffId: "STF-2047", email: "dara.pich@stockflow.io", role: "Staff", status: "Active", joined: "Jun 18, 2025" },
  { name: "Lina Sok", staffId: "STF-2049", email: "lina.sok@stockflow.io", role: "Staff", status: "Invite pending", joined: "Aug 20, 2026" },
  { name: "Ravy Meas", staffId: "STF-2044", email: "ravy.meas@stockflow.io", role: "Manager", status: "Active", joined: "Nov 02, 2024" },
  { name: "Chenda Ly", staffId: "STF-2041", email: "chenda.ly@stockflow.io", role: "Staff", status: "Active", joined: "Feb 14, 2024" },
  { name: "Bopha Nov", staffId: "STF-2043", email: "bopha.nov@stockflow.io", role: "Admin", status: "Active", joined: "Sep 09, 2024" },
];

export const teamMembersStorageKey = "sf-team-members";

export function readInvitedTeamMembers(): TeamMember[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(teamMembersStorageKey);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isTeamMember)) {
    throw new Error("Saved team member data is invalid. Clear the saved team members and try again.");
  }
  return parsed;
}

export function saveInvitedTeamMember(member: TeamMember): void {
  if (typeof window === "undefined") throw new Error("Team members can only be invited in a browser.");
  const invitedMembers = readInvitedTeamMembers();
  if (invitedMembers.some((existing) => existing.email.toLowerCase() === member.email.toLowerCase())) {
    throw new Error("A team member with this email already exists.");
  }
  window.localStorage.setItem(teamMembersStorageKey, JSON.stringify([...invitedMembers, member]));
}

export function getNextStaffId(members: TeamMember[]): string {
  const nextNumber = Math.max(2047, ...members.map((member) => Number(member.staffId.replace("STF-", "")))) + 1;
  return `STF-${nextNumber}`;
}

function isTeamMember(value: unknown): value is TeamMember {
  if (typeof value !== "object" || value === null) return false;
  const member = value as Partial<TeamMember>;
  return typeof member.name === "string"
    && typeof member.staffId === "string"
    && typeof member.email === "string"
    && (member.role === "Admin" || member.role === "Manager" || member.role === "Staff")
    && (member.status === "Active" || member.status === "Invite pending")
    && typeof member.joined === "string";
}
