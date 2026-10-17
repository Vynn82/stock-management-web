import React from "react";

export default function ReportsPage() {
  const metrics = [
    {
      label: "Total Valuation",
      value: "$148,250.00",
      change: "+8.4% this month",
    },
    { label: "Low Stock Alerts", value: "7 items", change: "Action required" },
    { label: "Turnover Rate", value: "4.2x", change: "+0.3 vs last quarter" },
    {
      label: "Dead Stock Quantity",
      value: "12 units",
      change: "Ready for clearance",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-main)",
          }}
        >
          Inventory Reports
        </h1>
        <p
          style={{ margin: "6px 0 0", color: "var(--text-sub)", fontSize: 13 }}
        >
          Analytical trends, valuations, and stock movement metrics.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              padding: 24,
              borderRadius: 16,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--text-sub)" }}>
              {m.label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: "8px 0 4px",
                color: "var(--text-main)",
              }}
            >
              {m.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--brand-600)",
                fontWeight: 600,
              }}
            >
              {m.change}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--card-shadow)",
          padding: 24,
        }}
      >
        <h3
          style={{ margin: "0 0 8px", fontSize: 18, color: "var(--text-main)" }}
        >
          Automated Report Exports
        </h3>
        <p
          style={{ margin: "0 0 16px", color: "var(--text-sub)", fontSize: 13 }}
        >
          Export inventory ledgers and audit logs in CSV or PDF format.
        </p>
        <button
          type="button"
          className="submit"
          style={{ width: "auto", padding: "0 24px", height: 42, fontSize: 14 }}
        >
          Download Audit Log (CSV)
        </button>
      </div>
    </div>
  );
}
