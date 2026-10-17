"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InfoCircleOutlined } from "@ant-design/icons";
import { message } from "antd";
import { getNextStaffId, initialTeamMembers, readInvitedTeamMembers, saveInvitedTeamMember, type TeamRole } from "@/components/users/team-members";

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
  const [staffId, setStaffId] = useState(() => getNextStaffId(initialTeamMembers));
  const [role, setRole] = useState<TeamRole>("Staff");

  useEffect(() => {
    try {
      setStaffId(getNextStaffId([...initialTeamMembers, ...readInvitedTeamMembers()]));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Could not load saved team members.");
    }
  }, [messageApi]);

  function submitInvite(event: FormEvent<HTMLFormElement>) {
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

    try {
      const existingMembers = [...initialTeamMembers, ...readInvitedTeamMembers()];
      if (existingMembers.some((member) => member.email.toLowerCase() === normalizedEmail.toLowerCase())) {
        messageApi.error("A team member with this email already exists.");
        return;
      }
      const invitedMember = {
        name: fullName,
        email: normalizedEmail,
        staffId,
        role,
        status: "Invite pending" as const,
        joined: new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date()),
      };
      saveInvitedTeamMember(invitedMember);
      router.push("/users");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Could not send this invitation.");
    }
  }

  return <div className="team-invite-page">
    {contextHolder}
    <div className="team-invite-container">
      <header className="team-invite-heading">
        <div>
          <nav className="team-invite-breadcrumb" aria-label="Breadcrumb">
            <Link href="/users">Team Members</Link>
            <span aria-hidden="true">/</span>
            <span>Invite</span>
          </nav>
          <h1>Invite Team Member</h1>
        </div>
        <div className="team-invite-actions">
          <button className="team-invite-cancel" type="button" onClick={() => router.push("/users")}>Cancel</button>
          <button className="team-invite-submit" type="submit" form="team-invite-form">Send Invite</button>
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
            <input id="invite-staff-id" value={staffId} readOnly aria-readonly="true" />
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
      </form>
    </div>
  </div>;
}
