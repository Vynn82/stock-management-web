"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InfoCircleOutlined } from "@ant-design/icons";
import { message } from "antd";
import { errorText } from "@/components/common/live-state";
import { fetchRoles, inviteMember, type RoleRow } from "@/features/users/users-live";

import BackButton from "@/components/ui/BackButton";
type TeamRole = "Admin" | "Manager" | "Staff";

const roleOptions: { role: TeamRole; description: string }[] = [
  { role: "Admin", description: "Full access — can invite any role" },
  { role: "Manager", description: "Approvals & reports — can invite Staff only" },
  { role: "Staff", description: "Daily stock actions — cannot invite users" },
];

export default function InviteTeamMemberPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Staff");
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch((error) => messageApi.error(errorText(error, "Could not load roles.")));
  }, [messageApi]);

  const roleId = useMemo(() => roles.find((r) => r.name === role.toUpperCase())?.id, [roles, role]);

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = name.trim();
    const normalizedEmail = email.trim();
    if (!fullName || !normalizedEmail) {
      messageApi.error("Enter a full name and email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      messageApi.error("Enter a valid email address.");
      return;
    }

    if (!roleId) {
      messageApi.error("Roles haven't loaded yet. Please try again in a moment.");
      return;
    }
    const [firstName, ...rest] = fullName.split(/\s+/);
    setSaving(true);
    try {
      await inviteMember({ firstName, lastName: rest.join(" ") || firstName, email: normalizedEmail, roleId });
      router.push("/users");
    } catch (error) {
      messageApi.error(errorText(error, "Could not send this invitation."));
    } finally {
      setSaving(false);
    }
  }

  return <div className="team-invite-page">
    {contextHolder}
    <div className="team-invite-container">
      <header className="team-invite-heading">
        <div>
          <BackButton href="/users" />
          <nav className="team-invite-breadcrumb" aria-label="Breadcrumb">
            <Link href="/users">Team Members</Link>
            <span aria-hidden="true">/</span>
            <span>Invite</span>
          </nav>
          <h1>Invite Team Member</h1>
        </div>
      </header>
      <form className="team-invite-card" id="team-invite-form" onSubmit={submitInvite}>
        <div className="team-invite-field">
          <label htmlFor="invite-full-name">Full name</label>
          <input
            id="invite-full-name"
            autoComplete="name"
            placeholder="Enter full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="team-invite-field">
          <label htmlFor="invite-email">Email</label>
          <input
            id="invite-email"
            type="email"
            autoComplete="email"
            placeholder="name@stockflow.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <p className="team-invite-helper">Login ID and a temporary password will be sent to this email.</p>
        </div>
        <div className="team-invite-field">
          <label htmlFor="invite-staff-id">Staff ID</label>
          <div className="team-invite-staff-id">
            <input id="invite-staff-id" value="Assigned when invited" readOnly aria-readonly="true" />
            <span>Auto-generated</span>
          </div>
        </div>
        <fieldset className="team-invite-role-field">
          <legend>Role</legend>
          <div className="team-invite-role-options">
            {roleOptions.map((option) => <label
              className={`team-invite-role-option ${role === option.role ? "selected" : ""}`}
              key={option.role}
            >
              <input
                type="radio"
                name="team-member-role"
                value={option.role}
                checked={role === option.role}
                onChange={() => setRole(option.role)}
              />
              <span className="team-invite-radio" aria-hidden="true" />
              <span className="team-invite-role-copy">
                <strong>{option.role}</strong>
                <span>{option.description}</span>
              </span>
            </label>)}
          </div>
        </fieldset>
        <div className="team-invite-notice">
          <InfoCircleOutlined aria-hidden="true" />
          <p>Once invited, StockFlow generates a Staff ID and temporary password and emails both to this address so they can sign in right away.</p>
        </div>
        <div className="page-form-actions">
        <div className="team-invite-actions">
          <button className="team-invite-cancel" type="button" onClick={() => router.push("/users")}>Cancel</button>
          <button className="team-invite-submit" type="submit" form="team-invite-form" disabled={saving}>{saving ? "Sending…" : "Send Invite"}</button>
        </div>
        </div>
      </form>
    </div>
  </div>;
}
