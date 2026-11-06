"use client";

import Link from "next/link";
import { LockOutlined } from "@ant-design/icons";
import { Button } from "antd";

/** Shown in place of a screen the signed-in role has no permission for. */
export default function AccessDenied({ feature, needs, role }: { feature: string; needs: string[]; role?: string }) {
  return (
    <div className="page-content" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div className="panel-card" role="alert" style={{ maxWidth: 460, textAlign: "center", padding: "40px 32px", borderRadius: 20 }}>
        <span
          aria-hidden="true"
          style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 18px", display: "grid", placeItems: "center", fontSize: 28, color: "#DC2626", background: "rgba(239,68,68,0.12)" }}
        >
          <LockOutlined />
        </span>
        <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>You don&apos;t have access to {feature || "this page"}</h2>
        <p style={{ margin: "0 0 6px", color: "var(--muted)", lineHeight: 1.5 }}>
          {role ? `Your role (${role}) isn't` : "Your role isn't"} allowed to open this feature. Ask an administrator to grant you access if you need it.
        </p>
        {needs.length > 0 && (
          <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 12.5 }}>
            Required permission: <strong>{needs.join(" or ")}</strong>
          </p>
        )}
        <Link href="/dashboard">
          <Button type="primary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
