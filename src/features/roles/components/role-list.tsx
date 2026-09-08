"use client";

import React from "react";
import { Role } from "../roles.types";

export function RoleList({ roles }: { roles: Role[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {roles.map((role) => (
        <div
          key={role.id}
          style={{
            padding: 22,
            borderRadius: 16,
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-card)",
            boxShadow: "var(--card-shadow)",
            transition: "all 0.2s ease",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            {role.name}
          </h4>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 13,
              color: "var(--text-sub)",
              lineHeight: 1.5,
            }}
          >
            {role.description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {role.permissions?.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: 6,
                  background: "rgba(124, 58, 237, 0.1)",
                  color: "var(--brand-600)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
