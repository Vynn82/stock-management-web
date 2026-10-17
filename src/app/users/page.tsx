"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, message } from "antd";
import { CaretDownOutlined, CheckOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { initialTeamMembers, readInvitedTeamMembers } from "@/components/users/team-members";

export default function UsersPage() {
  const router = useRouter();
  const [members, setMembers] = useState(initialTeamMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    try {
      setMembers([...initialTeamMembers, ...readInvitedTeamMembers()]);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Could not load saved team members.");
    }
  }, [messageApi]);

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
    return members.filter((member) => {
      const matchesSearch = !normalizedSearch || `${member.name} ${member.staffId} ${member.email}`.toLowerCase().includes(normalizedSearch);
      return matchesSearch && (roleFilter === "all" || member.role === roleFilter);
    });
  }, [members, roleFilter, search]);

  return <div className="team-members-page">
    {contextHolder}
    <div className="team-members-heading">
      <h1>Team Members</h1>
      <Button className="team-invite-button" type="primary" icon={<PlusOutlined />} onClick={() => router.push("/users/invite")}>Invite Member</Button>
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
          {[{ value: "all", label: "All Roles" }, ...(["Admin", "Manager", "Staff"] as const).map((value) => ({ value, label: value }))].map((option) => {
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
      <table className="team-members-table">
        <thead><tr>
          <th scope="col">Member</th>
          <th scope="col">Staff ID</th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
          <th scope="col">Status</th>
          <th scope="col">Joined</th>
        </tr></thead>
        <tbody>
          {filteredMembers.map((member) => <tr key={member.staffId}>
            <td><div className="team-member-name">
              <span className="team-member-avatar" aria-hidden="true">{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
              <strong>{member.name}</strong>
              {member.isCurrentUser && <span className="team-member-you">You</span>}
            </div></td>
            <td>{member.staffId}</td>
            <td>{member.email}</td>
            <td><span className={`team-member-role team-member-role-${member.role.toLowerCase()}`}>{member.role}</span></td>
            <td><span className={`team-member-status ${member.status === "Active" ? "active" : "pending"}`}>{member.status}</span></td>
            <td>{member.joined}</td>
          </tr>)}
          {filteredMembers.length === 0 && <tr><td className="team-members-empty" colSpan={6}>No team members found.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}
