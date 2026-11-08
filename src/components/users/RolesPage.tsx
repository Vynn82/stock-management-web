"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Checkbox, Tag, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { ApiError } from "@/features/live/http";
import { LiveState, errorText } from "@/components/common/live-state";
import { usePermission } from "@/hooks/use-permission";
import {
  PermissionGroup,
  RoleRow,
  fetchRoleList,
  fetchRolePermissions,
  grantPermission,
  revokePermission,
} from "@/features/roles/roles-live";
import BackButton from "@/components/ui/BackButton";

const pretty = (s: string) => s.replace(/[_-]+/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default function RolesPage() {
  const { can } = usePermission();
  const canEdit = can("ROLE_UPDATE");
  const [messageApi, holder] = message.useMessage();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [roleId, setRoleId] = useState("");
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchRoleList();
      setRoles(list);
      setRoleId((cur) => cur || list[0]?.id || "");
    } catch (e) {
      setError(errorText(e, "Could not load roles."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (!roleId) return;
    let live = true;
    setLoadingPerms(true);
    fetchRolePermissions(roleId)
      .then((g) => live && setGroups(g))
      .catch((e) => live && setError(errorText(e, "Could not load the permissions.")))
      .finally(() => live && setLoadingPerms(false));
    return () => {
      live = false;
    };
  }, [roleId]);

  const role = roles.find((r) => r.id === roleId);
  const locked = role?.name === "SUPER_ADMIN";

  async function toggle(permissionId: string, next: boolean) {
    setBusy(permissionId);
    try {
      if (next) await grantPermission(roleId, permissionId);
      else await revokePermission(roleId, permissionId);
      setGroups((cur) => cur.map((g) => ({ ...g, permissions: g.permissions.map((p) => (p.id === permissionId ? { ...p, assigned: next } : p)) })));
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : "Could not change the permission.");
    } finally {
      setBusy("");
    }
  }

  const total = groups.reduce((s, g) => s + g.permissions.length, 0);
  const granted = groups.reduce((s, g) => s + g.permissions.filter((p) => p.assigned).length, 0);

  return (
    <div className="page-content data-page">
      {holder}
      <BackButton href="/users" />
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
        <Link href="/users" style={{ color: "var(--muted)", fontWeight: 600, textDecoration: "none" }}>Users</Link>
        <span aria-hidden="true" style={{ color: "var(--muted)", opacity: 0.6 }}>/</span>
        <span style={{ fontWeight: 700 }}>Roles &amp; permissions</span>
      </nav>
      <div className="page-heading" style={{ marginTop: 12 }}>
        <h1>Roles &amp; permissions</h1>
        <p>Choose what each role can see and do. Changes apply the next time a person signs in.</p>
      </div>

      <LiveState loading={loading} error={error && roles.length === 0 ? error : ""} empty={!loading && roles.length === 0} emptyText="No roles yet." onRetry={loadRoles}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
          <div className="panel-card" style={{ flex: "0 1 240px", minWidth: 200, padding: 12, borderRadius: 16 }}>
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleId(r.id)}
                aria-current={r.id === roleId}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  marginBottom: 4,
                  border: 0,
                  borderRadius: 10,
                  cursor: "pointer",
                  font: "inherit",
                  fontWeight: 600,
                  color: r.id === roleId ? "#fff" : "inherit",
                  background: r.id === roleId ? "var(--purple)" : "transparent",
                }}
              >
                {pretty(r.name)}
              </button>
            ))}
          </div>

          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <LiveState loading={loadingPerms} error={error && roles.length > 0 ? error : ""} onRetry={() => setRoleId((x) => x)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 16 }}>{role ? pretty(role.name) : ""}</strong>
                <Tag color="purple">{granted} of {total} permissions</Tag>
                {locked && (
                  <Tag icon={<LockOutlined />}>Super admin always keeps every permission</Tag>
                )}
                {!canEdit && <Tag>View only</Tag>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                {groups.map((g) => (
                  <div key={g.name} className="panel-card" style={{ padding: 16, borderRadius: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>{pretty(g.name)}</div>
                    {g.permissions.map((p) => (
                      <div key={p.id} style={{ padding: "4px 0" }}>
                        <Checkbox
                          checked={p.assigned}
                          disabled={!canEdit || locked || busy === p.id}
                          onChange={(e) => toggle(p.id, e.target.checked)}
                        >
                          <span style={{ fontWeight: 600 }}>{pretty(p.action)}</span>
                          <span style={{ color: "var(--muted)", fontSize: 11.5, marginLeft: 6 }}>{p.name}</span>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </LiveState>
          </div>
        </div>
      </LiveState>
    </div>
  );
}
