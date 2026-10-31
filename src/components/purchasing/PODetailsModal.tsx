"use client";

import React from "react";
import { CloseOutlined, CheckCircleOutlined, SyncOutlined, DeleteOutlined } from "@ant-design/icons";
import { PurchaseOrder, POStatus, formatCurrency } from "./purchasing-data";

interface PODetailsModalProps {
  order: PurchaseOrder | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: POStatus) => void;
  onDelete: (id: string) => void;
}

export default function PODetailsModal({
  order,
  onClose,
  onUpdateStatus,
  onDelete,
}: PODetailsModalProps) {
  if (!order) return null;

  return (
    <div
      className="po-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="po-modal" role="dialog" aria-modal="true" aria-labelledby="po-detail-title">
        <div className="po-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 id="po-detail-title">{order.id}</h2>
              <span className={`po-status-badge status-${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>
            <p className="po-modal-subtitle">{order.supplier}</p>
          </div>
          <button
            className="po-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="po-detail-body">
          <div className="po-detail-grid">
            <div className="po-detail-item">
              <span className="po-detail-label">Supplier</span>
              <strong className="po-detail-val">{order.supplier}</strong>
            </div>
            <div className="po-detail-item">
              <span className="po-detail-label">Status</span>
              <strong className="po-detail-val">{order.status}</strong>
            </div>
            <div className="po-detail-item">
              <span className="po-detail-label">Total Items</span>
              <strong className="po-detail-val">{order.items}</strong>
            </div>
            <div className="po-detail-item">
              <span className="po-detail-label">Total Spend</span>
              <strong className="po-detail-val" style={{ color: "var(--purple)", fontSize: 15 }}>
                {formatCurrency(order.total)}
              </strong>
            </div>
            <div className="po-detail-item">
              <span className="po-detail-label">Order Date</span>
              <strong className="po-detail-val">{order.orderDate}</strong>
            </div>
            <div className="po-detail-item">
              <span className="po-detail-label">Expected Delivery</span>
              <strong className="po-detail-val">{order.expectedDate}</strong>
            </div>
          </div>

          {order.lineItems && order.lineItems.length > 0 && (
            <div className="po-detail-items-table-wrap">
              <h4>Ordered Items Breakdown</h4>
              <table className="po-detail-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lineItems.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.product}</td>
                      <td>{it.qty}</td>
                      <td>{formatCurrency(it.unitCost)}</td>
                      <td>{formatCurrency(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {order.notes && (
            <div className="po-detail-notes">
              <span className="po-detail-label">Notes</span>
              <p>{order.notes}</p>
            </div>
          )}

          <div className="po-status-quick-actions">
            <span className="po-detail-label">Update Status:</span>
            <div className="po-quick-btns">
              {order.status !== "Approved" && (
                <button
                  type="button"
                  className="po-quick-btn approve"
                  onClick={() => onUpdateStatus(order.id, "Approved")}
                >
                  <CheckCircleOutlined /> Mark Approved
                </button>
              )}
              {order.status !== "Received" && (
                <button
                  type="button"
                  className="po-quick-btn receive"
                  onClick={() => onUpdateStatus(order.id, "Received")}
                >
                  <CheckCircleOutlined /> Mark Received
                </button>
              )}
              {order.status !== "Pending" && (
                <button
                  type="button"
                  className="po-quick-btn pending"
                  onClick={() => onUpdateStatus(order.id, "Pending")}
                >
                  <SyncOutlined /> Set Pending
                </button>
              )}
              {order.status !== "Draft" && (
                <button
                  type="button"
                  className="po-quick-btn draft"
                  onClick={() => onUpdateStatus(order.id, "Draft")}
                >
                  Set Draft
                </button>
              )}
            </div>
          </div>

          <div className="po-modal-footer">
            <button
              type="button"
              className="po-delete-btn"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${order.id}?`)) {
                  onDelete(order.id);
                  onClose();
                }
              }}
            >
              <DeleteOutlined /> Delete PO
            </button>
            <button
              type="button"
              className="po-submit-btn"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
