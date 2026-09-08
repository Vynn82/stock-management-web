import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function DashboardPage() {
  const cards = [
    {
      title: "Products",
      count: "1,248",
      desc: "Active items in stock",
      href: ROUTES.PRODUCTS,
      color: "#3b82f6",
    },
    {
      title: "Staff & Users",
      count: "24",
      desc: "Registered personnel",
      href: ROUTES.STAFF,
      color: "#10b981",
    },
    {
      title: "Roles",
      count: "5",
      desc: "Configured role profiles",
      href: ROUTES.ROLES,
      color: "#f59e0b",
    },
    {
      title: "Reports & Stock",
      count: "12",
      desc: "Monthly inventory insights",
      href: ROUTES.REPORTS,
      color: "#8b5cf6",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 700,
            color: "var(--text-main)",
          }}
        >
          System Overview
        </h1>
        <p
          style={{ margin: "6px 0 0", color: "var(--text-sub)", fontSize: 14 }}
        >
          Live summary of your inventory, staff access, and reports.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 36,
        }}
      >
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            style={{
              padding: 24,
              borderRadius: 18,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "var(--text-sub)",
                fontWeight: 600,
              }}
            >
              {c.title}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                margin: "8px 0 4px",
                color: c.color,
              }}
            >
              {c.count}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {c.desc}
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          padding: 24,
          borderRadius: 18,
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: 18,
            color: "var(--text-main)",
          }}
        >
          Quick Actions
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={ROUTES.PRODUCT_CREATE}
            className="submit"
            style={{
              width: "auto",
              padding: "0 24px",
              height: 42,
              fontSize: 14,
            }}
          >
            + Add New Product
          </Link>
          <Link
            href={ROUTES.STAFF}
            style={{
              padding: "0 24px",
              height: 42,
              borderRadius: 14,
              border: "1px solid var(--border-color)",
              color: "var(--text-main)",
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              fontSize: 14,
              background: "transparent",
            }}
          >
            Manage Staff
          </Link>
        </div>
      </div>
    </div>
  );
}
