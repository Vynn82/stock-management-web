"use client";

import Link from "next/link";
import {
  CheckCircleOutlined,
  InboxOutlined,
  ShopOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

const stats = [
  {
    value: "18",
    label: "New requests",
    change: "↑ 8.4%",
    icon: <InboxOutlined />,
    red: true,
  },
  {
    value: "42",
    label: "Approved",
    change: "↑ 4.9%",
    icon: <CheckCircleOutlined />,
  },
  {
    value: "1,284",
    label: "Total products",
    change: "↑ 1.6%",
    icon: <DatabaseOutlined />,
  },
  {
    value: "6",
    label: "Active warehouses",
    change: "no change",
    icon: <ShopOutlined />,
    neutral: true,
  },
];
const bars = [48, 68, 57, 83, 51, 65, 76];
const barsLight = [30, 37, 22, 43, 27, 34, 41];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const requests = [
  ["Sokha", "Phnom Penh", "Pending"],
  ["Dara", "Siem Reap", "Approved"],
  ["Lina", "Battambang", "Approved"],
  ["Ravy", "Kampong Cham", "Rejected"],
];

export default function DashboardHome() {
  return (
    <div className="page-content">
      <div className="page-heading">
        <h1>Dashboard</h1>
        <p>Welcome back, Visal. Here&apos;s what&apos;s happening today.</p>
      </div>
      <div className="stats-grid">
        {stats.map((stat) => (
          <Link href="#" className="stat-card dashboard-card" key={stat.label}>
            <div className="stat-top">
              <span className="stat-icon">{stat.icon}</span>
              <span className={`stat-change ${stat.red ? "red" : ""}`}>
                {stat.change}
              </span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <Link href="#" className="panel-card dashboard-card">
          <div className="panel-header">
            <span className="panel-title">Stock movement</span>
            <div className="legend">
              <span>
                <i className="dot" />
                In
              </span>
              <span>
                <i className="dot light" />
                Out
              </span>
            </div>
          </div>
          <div className="chart">
            {days.map((day, i) => (
              <div className="chart-day" key={day}>
                <div className="bars">
                  <div className="bar" style={{ height: `${bars[i]}%` }} />
                  <div
                    className="bar light"
                    style={{ height: `${barsLight[i]}%` }}
                  />
                </div>
                <div className="day-label">{day}</div>
              </div>
            ))}
          </div>
        </Link>
        <Link href="#" className="panel-card dashboard-card">
          <div className="panel-header">
            <span className="panel-title">Recent requests</span>
            <span className="panel-action">See all</span>
          </div>
          <table className="request-table">
            <thead>
              <tr>
                <th>REQUESTER</th>
                <th>ROUTE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(([name, route, status]) => (
                <tr key={name}>
                  <td>
                    <strong>{name}</strong>
                  </td>
                  <td>{route}</td>
                  <td>
                    <span className={`status-pill ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Link>
      </div>
      <div className="metrics-row">
        <Metric value="$8 240" label="Pending value" />
        <Metric value="3.2x" label="Turnover rate" />
        <Metric value="94.0%" label="Fulfillment rate" ring />
        <Metric value="98.4%" label="Stock accuracy" ring green />
      </div>
    </div>
  );
}
function Metric({
  value,
  label,
  ring,
  green,
}: {
  value: string;
  label: string;
  ring?: boolean;
  green?: boolean;
}) {
  return (
    <Link href="#" className="metric-card dashboard-card">
      {ring && <div className={`progress-ring ${green ? "green" : ""}`} />}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </Link>
  );
}
