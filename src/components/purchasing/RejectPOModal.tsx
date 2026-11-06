"use client";

import React, { useState, useEffect, useRef } from "react";
import { CloseOutlined } from "@ant-design/icons";

interface RejectPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (reason: string) => void | Promise<void>;
  busy?: boolean;
  error?: string;
  poId: string;
  supplierName: string;
  defaultReason?: string;
}

export default function RejectPOModal({
  isOpen,
  onClose,
  onConfirmReject,
  poId,
  supplierName,
  defaultReason,
  busy = false,
  error = "",
}: RejectPOModalProps) {
  const [reason, setReason] = useState(defaultReason || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultReason) setReason(defaultReason);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultReason]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirmReject(reason.trim());
  };

  return (
    <div
      className="po-reject-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="po-reject-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
        onSubmit={handleSubmit}
      >
        <button
          className="po-reject-dialog-close"
          type="button"
          aria-label="Close rejection dialog"
          onClick={onClose}
        >
          <CloseOutlined />
        </button>

        <span className="po-reject-dialog-icon" aria-hidden="true">
          <CloseOutlined />
        </span>

        <h2 id="reject-dialog-title" className="po-reject-title">
          Reject {poId}?
        </h2>

        <p className="po-reject-description">
          {supplierName} will be notified. Let them know why this request is being rejected.
        </p>

        <label className="po-reject-label" htmlFor="reject-reason-input">
          Reason for rejection <span aria-hidden="true">*</span>
        </label>

        <textarea
          ref={textareaRef}
          id="reject-reason-input"
          className="po-reject-textarea"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this purchase order cannot be approved..."
        />

        <p className="po-reject-helper">
          Saved to the request&apos;s activity log and shared with the requester.
        </p>
        {error && <p className="po-reject-helper" role="alert" style={{ color: "#dc2626" }}>{error}</p>}

        <div className="po-reject-actions">
          <button
            className="po-reject-cancel-btn"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="po-reject-submit-btn" type="submit" disabled={busy}>
            <CloseOutlined /> {busy ? "Working…" : "Reject Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
