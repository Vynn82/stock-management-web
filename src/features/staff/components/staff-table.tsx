"use client";

import React from "react";
import { Tag, Popconfirm, Button } from "antd";
import { Table, Column } from "@/components/ui/table";
import { StaffMember } from "../staff.types";

export function StaffTable({
  staff,
  onEditRole,
  onDelete,
}: {
  staff: StaffMember[];
  onEditRole?: (member: StaffMember) => void;
  onDelete?: (id: string) => void;
}) {
  function getRoleTagColor(role?: string) {
    if (!role) return "default";
    switch (role.toUpperCase()) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return "purple";
      case "INVENTORY_MANAGER":
      case "WAREHOUSE STAFF":
        return "blue";
      case "STAFF":
        return "cyan";
      default:
        return "geekblue";
    }
  }

  const columns: Column<StaffMember>[] = [
    {
      key: "staffId",
      header: "Staff ID",
      width: 120,
      sorter: (a, b) =>
        ((a.staffId as string) || "").localeCompare(
          (b.staffId as string) || "",
        ),
      render: (m) => (
        <code
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            color: "var(--brand-600)",
            background: "rgba(124, 58, 237, 0.08)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {(m.staffId as string) || "—"}
        </code>
      ),
    },
    {
      key: "name",
      header: "Staff Name",
      sorter: (a, b) => {
        const nameA = a.firstName
          ? `${a.firstName} ${a.lastName}`
          : (a.name as string) || "";
        const nameB = b.firstName
          ? `${b.firstName} ${b.lastName}`
          : (b.name as string) || "";
        return nameA.localeCompare(nameB);
      },
      render: (member) => {
        const fullName = member.firstName
          ? `${member.firstName} ${member.lastName}`
          : (member.name as string) || "—";
        return (
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
              {fullName}
            </div>
            {member.email && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {member.email}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (member) => (
        <div style={{ fontSize: 12.5 }}>
          {member.phone && (
            <div style={{ color: "var(--text-main)" }}>📞 {member.phone}</div>
          )}
          {member.telegramChatId && (
            <div style={{ color: "#1890ff", marginTop: 2 }}>
              ✈️ TG: {member.telegramChatId}
            </div>
          )}
          {!member.phone && !member.telegramChatId && (
            <span style={{ color: "var(--text-muted)" }}>—</span>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Assigned Role",
      width: 160,
      render: (member) => (
        <Tag
          color={getRoleTagColor(member.role)}
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          {member.role || "—"}
        </Tag>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: 100,
      render: (member) => (
        <Tag
          color={member.status === "active" ? "success" : "default"}
          style={{
            borderRadius: 6,
            textTransform: "capitalize",
            fontWeight: 600,
          }}
        >
          {member.status || "—"}
        </Tag>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: 160,
      render: (member) => (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {onEditRole && (
            <Button
              type="link"
              size="small"
              onClick={() => onEditRole(member)}
              style={{ padding: 0, fontWeight: 600, color: "var(--brand-600)" }}
            >
              Role
            </Button>
          )}
          {onDelete && (
            <Popconfirm
              title="Remove Staff Account"
              description={`Are you sure you want to remove ${
                member.firstName
                  ? `${member.firstName} ${member.lastName}`
                  : (member.name as string) || "this staff member"
              }?`}
              okText="Yes, Remove"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(member.id)}
            >
              <Button
                type="link"
                danger
                size="small"
                style={{ padding: 0, fontWeight: 600 }}
              >
                Remove
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={staff}
      emptyText="No staff members registered."
    />
  );
}
