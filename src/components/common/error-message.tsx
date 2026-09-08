import React from "react";

export function ErrorMessage({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      style={{
        padding: "12px 16px",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: 12,
        color: "#f87171",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
