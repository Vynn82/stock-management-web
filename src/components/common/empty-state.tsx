import React from "react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No data available",
  description = "There are currently no items to display.",
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        border: "1px dashed rgba(255, 255, 255, 0.1)",
        borderRadius: 16,
        background: "rgba(255, 255, 255, 0.02)",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#f8fafc" }}>
        {title}
      </h3>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#94a3b8" }}>
        {description}
      </p>
      {action}
    </div>
  );
}
