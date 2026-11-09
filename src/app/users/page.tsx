"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Select, message } from "antd";
import { CaretDownOutlined, CheckOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined, SearchOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { useAuth } from "@/hooks/use-auth";
import { changeMemberRole, fetchRoles, fetchTeamMembers, roleLabel, type RoleRow, type TeamMemberRow } from "@/features/users/users-live";
import { ApiError } from "@/features/live/http";
import Can from "@/components/common/Can";

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [editing, setEditing] = useState<TeamMemberRow | null>(null);
  const [newRoleId, setNewRoleId] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  async function openChangeRole(member: TeamMemberRow) {
    setEditing(member);
    try {
      const list = roles.length ? roles : await fetchRoles();
      setRoles(list);
      setNewRoleId(list.find((r) => roleLabel(r.name) === member.role)?.id ?? "");
    } catch (error) {
      setEditing(null);
      messageApi.error(error instanceof ApiError ? error.message : "Could not load roles.");
    }
  }

  async function saveRole() {
    if (!editing || !newRoleId) return;
    setSavingRole(true);
    try {
      await changeMemberRole(editing.id, newRoleId);
      messageApi.success(`${editing.name}'s role was updated.`);
      setEditing(null);
      await load();
    } catch (error) {
      messageApi.error(error instanceof ApiError ? error.message : "Could not change the role.");
    } finally {
      setSavingRole(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setMembers(await fetchTeamMembers());
    } catch (error) {
      setLoadError(errorText(error, "Could not load team members."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roleOptions = useMemo(() => {
    const base = ["Super Admin", "Admin", "Manager", "Staff"];
    const extra = Array.from(new Set(members.map((member) => member.role))).filter((role) => !base.includes(role));
    return [...base, ...extra];
  }, [members]);

  useEffect(() => {
    if (!roleDropdownOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !roleDropdownRef.current?.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setRoleDropdownOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [roleDropdownOpen]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const rank = (role: string) => {
      const index = roleOptions.indexOf(role);
      return index === -1 ? roleOptions.length : index;
    };
    return members
      .filter((member) => {
        const matchesSearch = !normalizedSearch || `${member.name} ${member.staffId} ${member.email}`.toLowerCase().includes(normalizedSearch);
        return matchesSearch && (roleFilter === "all" || member.role === roleFilter);
      })
      .sort((a, b) => rank(a.role) - rank(b.role));
  }, [members, roleFilter, search, roleOptions]);

  return <div className="team-members-page">
    {contextHolder}
    <div className="team-members-heading">
      <h1>Team Members</h1>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Can any="ROLE_VIEW"><Button icon={<SafetyCertificateOutlined />} onClick={() => router.push("/users/roles")}>Roles &amp; permissions</Button></Can>
      <Can any={"USER_CREATE"}><Button className="team-invite-button" type="primary" icon={<PlusOutlined />} onClick={() => router.push("/users/invite")}>Invite Member</Button></Can>
      </div>
    </div>
    <div className="team-members-toolbar">
      <Input
        className="team-members-search"
        prefix={<SearchOutlined />}
        placeholder="Search name, staff ID, email..."
        aria-label="Search team members"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="team-members-role-dropdown" ref={roleDropdownRef}>
        <button
          className={`team-members-role-trigger ${roleDropdownOpen ? "is-open" : ""}`}
          type="button"
          aria-label="Filter by role"
          aria-haspopup="menu"
          aria-expanded={roleDropdownOpen}
          onClick={() => setRoleDropdownOpen((open) => !open)}
        >
          <span className="team-members-role-label">{roleFilter === "all" ? "All Roles" : roleFilter}</span>
          <CaretDownOutlined className="team-members-role-chevron" />
        </button>
        {roleDropdownOpen && <div className="team-members-role-menu" role="menu" aria-label="Filter by role">
          <span className="team-members-role-menu-title">Filter by role</span>
          {[{ value: "all", label: "All Roles" }, ...roleOptions.map((value) => ({ value, label: value }))].map((option) => {
            const isSelected = roleFilter === option.value;
            return <button
              className={`team-members-role-option ${isSelected ? "selected" : ""}`}
              type="button"
              role="menuitemradio"
              aria-checked={isSelected}
              key={option.value}
              onClick={() => {
                setRoleFilter(option.value);
                setRoleDropdownOpen(false);
              }}
            >
              <span>{option.label}</span>
              {isSelected && <CheckOutlined className="team-members-role-check" />}
            </button>;
          })}
        </div>}
      </div>
    </div>
    <div className="team-members-table-wrap">
      <LiveState loading={loading} error={loadError} onRetry={load} loadingText="Loading team members…">
      <table className="team-members-table">
        <thead><tr>
          <th scope="col">Member</th>
          <th scope="col">Staff ID</th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
          <th scope="col">Status</th>
          <th scope="col">Joined</th>
          <Can any="USER_ROLE_UPDATE"><th scope="col" className="team-member-actions-col">Actions</th></Can>
        </tr></thead>
        <tbody>
          {filteredMembers.map((member) => <tr key={member.id}>
            <td><div className="team-member-name">
              <span className="team-member-avatar" aria-hidden="true">{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
              <strong>{member.name}</strong>
              {user?.staffId && member.staffId === user.staffId && <span className="team-member-you">You</span>}
            </div></td>
            <td>{member.staffId}</td>
            <td>{member.email}</td>
            <td><span className={`team-member-role team-member-role-${member.roleClass}`}>{member.role}</span></td>
            <td><span className={`team-member-status ${member.status === "Active" ? "active" : "pending"}`}>{member.status}</span></td>
            <td>{member.joined}</td>
            <Can any="USER_ROLE_UPDATE"><td className="team-member-actions">
              {!(user?.staffId && member.staffId === user.staffId) && <button type="button" className="team-member-action-btn" onClick={() => openChangeRole(member)} aria-label={`Change role for ${member.name}`}><EditOutlined />Change role</button>}
            </td></Can>
          </tr>)}
          {filteredMembers.length === 0 && <tr><td className="team-members-empty" colSpan={7}>No team members found.</td></tr>}
        </tbody>
      </table>
      </LiveState>
    </div>
    <Modal
      open={Boolean(editing)}
      title={editing ? `Change role - ${editing.name}` : ""}
      okText="Save"
      confirmLoading={savingRole}
      okButtonProps={{ disabled: !newRoleId }}
      onOk={saveRole}
      onCancel={() => setEditing(null)}
      centered
    >
      <p style={{ color: "var(--muted)" }}>The new role applies the next time this person signs in.</p>
      <Select
        style={{ width: "100%" }}
        value={newRoleId || undefined}
        onChange={setNewRoleId}
        placeholder="Choose a role"
        options={roles.map((r) => ({ value: r.id, label: roleLabel(r.name) }))}
      />
    </Modal>
  </div>;
}
