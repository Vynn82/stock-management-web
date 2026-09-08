"use client";

import React from "react";
import { Permission } from "../permissions.types";

export function PermissionMatrix({
  permissions = [],
}: {
  permissions?: Permission[];
}) {
  const safePermissions = Array.isArray(permissions) ? permissions : [];

  if (safePermissions.length === 0) {
    return (
      <div
        style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}
      >
        No permissions found to display in matrix.
      </div>
    );
  }

  // Safely extract distinct categories, checking category, resource, or fallback
  const getCategory = (p: Permission): string =>
    p?.category ||
    p?.resource ||
    (p?.name && p.name.includes(":") ? p.name.split(":")[0] : "General");

  const categories = Array.from(
    new Set(safePermissions.map((p) => getCategory(p) || "General")),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {categories.map((category, index) => {
        const categoryItems = safePermissions.filter(
          (p) => getCategory(p) === category,
        );

        return (
          <div
            key={category || `cat-${index}`}
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: 16,
                color: "var(--brand-600)",
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {category}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {categoryItems.map((perm, pIdx) => {
                const displayName =
                  perm?.name ||
                  (perm?.resource && perm?.action
                    ? `${perm.resource}:${perm.action}`
                    : perm?.id || `perm-${pIdx}`);

                return (
                  <div
                    key={perm?.id || `p-${pIdx}-${displayName}`}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: "var(--bg-app)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <code
                      style={{
                        fontSize: 12,
                        color: "var(--brand-600)",
                        fontWeight: 600,
                      }}
                    >
                      {displayName}
                    </code>
                    {perm?.description && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 12,
                          color: "var(--text-sub)",
                        }}
                      >
                        {perm.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
