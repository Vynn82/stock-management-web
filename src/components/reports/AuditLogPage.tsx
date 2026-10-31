"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { downloadCSV } from "./reports-data";

interface AuditRecord {
  id: string;
  dateTime: string;
  user: string;
  action:
    | "Stock In"
    | "Rejected"
    | "Approved"
    | "Adjustment"
    | "Signed in"
    | "User invited"
    | "Sent to supplier";
  target: string;
  details: string;
}

const auditRows: AuditRecord[] = [
  {
    id: "aud-1",
    dateTime: "Aug 29, 9:14 AM",
    user: "Dara",
    action: "Stock In",
    target: "Wireless Mouse M185",
    details: "+50 units at Phnom Penh Main Warehouse",
  },
  {
    id: "aud-2",
    dateTime: "Aug 29, 8:40 AM",
    user: "Visal",
    action: "Rejected",
    target: "PO-2039 • TechEdge Distribution",
    details: "Reason: pricing above approved budget",
  },
  {
    id: "aud-3",
    dateTime: "Aug 28, 4:45 PM",
    user: "Sokha",
    action: "Approved",
    target: "REQ-0141",
    details: "Transfer 12 units, Phnom Penh Main → Siem Reap",
  },
  {
    id: "aud-4",
    dateTime: "Aug 28, 2:20 PM",
    user: "Ravy",
    action: "Adjustment",
    target: "Desk Lamp LED",
    details: "−2 units, damaged in Battambang Warehouse",
  },
  {
    id: "aud-5",
    dateTime: "Aug 28, 11:05 AM",
    user: "Lina",
    action: "Signed in",
    target: "—",
    details: "from 103.7.42.18",
  },
  {
    id: "aud-6",
    dateTime: "Aug 27, 3:30 PM",
    user: "Dara",
    action: "Stock In",
    target: "USB-C Cable 2m",
    details: "+40 units at Phnom Penh Main Warehouse",
  },
  {
    id: "aud-7",
    dateTime: "Aug 27, 10:12 AM",
    user: "Admin",
    action: "User invited",
    target: "sokun@stockflow.io",
    details: "Role: Warehouse Staff • Siem Reap Branch",
  },
  {
    id: "aud-8",
    dateTime: "Aug 26, 9:20 AM",
    user: "Visal",
    action: "Sent to supplier",
    target: "PO-2041 • PaperCo Supplies",
    details: "Order sent for confirmation",
  },
];

const actionOptions = [
  "All Actions",
  "Stock In",
  "Rejected",
  "Approved",
  "Adjustment",
  "Signed in",
  "User invited",
  "Sent to supplier",
];

const datePresets = [
  "Aug 22 – Aug 29",
  "Last 7 Days (Aug 22 – Aug 29)",
  "Last 14 Days (Aug 15 – Aug 29)",
  "This Month (Aug 2026)",
  "Last Month (Jul 2026)",
];

export default function AuditLogPage() {
  const [selectedAction, setSelectedAction] = useState("All Actions");
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Aug 22 – Aug 29");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  const filteredLogs = useMemo(() => {
    if (selectedAction === "All Actions") {
      return auditRows;
    }
    return auditRows.filter((r) => r.action === selectedAction);
  }, [selectedAction]);

  function handleExport() {
    const lines = [
      "==================================================",
      "STOCKFLOW - AUDIT LOG REPORT",
      `Period: ${dateRange}`,
      `Action Filter: ${selectedAction}`,
      "Total Logged Actions: 4,912",
      "Generated: Aug 29, 2026",
      "==================================================",
      "",
      "DATE / TIME,USER,ACTION,TARGET,DETAILS",
      ...filteredLogs.map(
        (r) =>
          `"${r.dateTime}","${r.user}","${r.action}","${r.target}","${r.details.replace(/"/g, '""')}"`
      ),
    ];

    downloadCSV("StockFlow_Audit_Log_Aug2026.csv", lines.join("\n"));
    showToast("Audit log report exported successfully.");
  }

  return (
    <div className="audit-log-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className="reports-toast" role="status" aria-live="polite">
          <span className="reports-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="audit-log-header">
        <div className="audit-log-header-left">
          <nav className="audit-log-breadcrumb" aria-label="Breadcrumb">
            <Link href="/reports" className="audit-log-breadcrumb-link">
              Reports
            </Link>
            <span className="audit-log-breadcrumb-sep">/</span>
            <span className="audit-log-breadcrumb-current">Audit Log</span>
          </nav>
          <h1 className="audit-log-title">Audit Log</h1>
        </div>

        <div className="audit-log-header-right">
          {/* Action Filter Dropdown */}
          <div className="audit-log-action-container">
            <button
              type="button"
              className="audit-log-action-btn"
              onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
              aria-expanded={actionDropdownOpen}
              aria-label="Filter by action"
            >
              <span>{selectedAction}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`audit-log-chevron ${actionDropdownOpen ? "open" : ""}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {actionDropdownOpen && (
              <div className="audit-log-dropdown">
                <div className="audit-log-dropdown-header">Filter Action</div>
                {actionOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`audit-log-dropdown-item ${
                      selectedAction === opt ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedAction(opt);
                      setActionDropdownOpen(false);
                      showToast(`Filtered by ${opt}`);
                    }}
                  >
                    <span>{opt}</span>
                    {selectedAction === opt && <span className="action-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Picker Pill */}
          <div className="audit-log-date-container">
            <button
              type="button"
              className="audit-log-date-btn"
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              aria-expanded={datePickerOpen}
              aria-label="Select date range"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{dateRange}</span>
            </button>

            {datePickerOpen && (
              <div className="audit-log-dropdown">
                <div className="audit-log-dropdown-header">Select Period</div>
                {datePresets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`audit-log-dropdown-item ${
                      dateRange === p ? "selected" : ""
                    }`}
                    onClick={() => {
                      setDateRange(p);
                      setDatePickerOpen(false);
                      showToast(`Date filter updated: ${p}`);
                    }}
                  >
                    <span>{p}</span>
                    {dateRange === p && <span className="action-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            className="audit-log-export-btn"
            onClick={handleExport}
            aria-label="Export audit log report"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="audit-log-kpi-grid">
        {/* Card 1: Logged actions */}
        <div className="audit-log-kpi-card">
          <div className="audit-log-kpi-top">
            <div className="audit-log-kpi-icon purple">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <span className="audit-log-badge gray">this period</span>
          </div>
          <div className="audit-log-kpi-metric">4,912</div>
          <div className="audit-log-kpi-label">Logged actions</div>
        </div>

        {/* Card 2: Active users */}
        <div className="audit-log-kpi-card">
          <div className="audit-log-kpi-top">
            <div className="audit-log-kpi-icon purple">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="audit-log-badge gray">of 12 total</span>
          </div>
          <div className="audit-log-kpi-metric">9</div>
          <div className="audit-log-kpi-label">Active users</div>
        </div>

        {/* Card 3: Rejections logged */}
        <div className="audit-log-kpi-card">
          <div className="audit-log-kpi-top">
            <div className="audit-log-kpi-icon red">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <span className="audit-log-badge gray">this period</span>
          </div>
          <div className="audit-log-kpi-metric">6</div>
          <div className="audit-log-kpi-label">Rejections logged</div>
        </div>
      </div>

      {/* Bottom Table Card */}
      <div className="audit-log-table-card">
        <div className="audit-log-table-wrap">
          <table className="audit-log-table">
            <thead>
              <tr>
                <th>DATE / TIME</th>
                <th>USER</th>
                <th>ACTION</th>
                <th>TARGET</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((row) => (
                <tr key={row.id}>
                  <td className="col-datetime">{row.dateTime}</td>
                  <td className="col-user">
                    <strong>{row.user}</strong>
                  </td>
                  <td className="col-action">
                    <span
                      className={`audit-tag ${
                        row.action === "Stock In" || row.action === "Approved"
                          ? "tag-green"
                          : row.action === "Rejected"
                          ? "tag-red"
                          : row.action === "Adjustment"
                          ? "tag-amber"
                          : row.action === "Signed in"
                          ? "tag-gray"
                          : "tag-purple"
                      }`}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="col-target">
                    <strong>{row.target}</strong>
                  </td>
                  <td className="col-details">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
