"use client";

import React, { useState } from "react";
import { CloseOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { POStatus, PurchaseOrder } from "./purchasing-data";

interface NewPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (po: PurchaseOrder) => void;
  nextId: string;
}

const suppliersList = [
  "PaperCo Supplies",
  "TechEdge Distribution",
  "Khmer Pack Co.",
  "Baitong Lighting",
  "Angkor Tech Hardware",
];

export default function NewPOModal({
  isOpen,
  onClose,
  onCreate,
  nextId,
}: NewPOModalProps) {
  const [poNumber, setPoNumber] = useState(nextId);
  const [supplier, setSupplier] = useState(suppliersList[0]);
  const [status, setStatus] = useState<POStatus>("Pending");
  const [orderDate, setOrderDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  });
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  });
  const [notes, setNotes] = useState("");

  const [itemsList, setItemsList] = useState<
    { name: string; quantity: number; unitPrice: number }[]
  >([
    { name: "Carton Packaging Boxes", quantity: 50, unitPrice: 4.5 },
  ]);

  if (!isOpen) return null;

  const totalCalculated = itemsList.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const totalItemsCount = itemsList.reduce((sum, item) => sum + item.quantity, 0);

  const addItemRow = () => {
    setItemsList([
      ...itemsList,
      { name: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItemsList(itemsList.filter((_, idx) => idx !== index));
  };

  const updateItemRow = (
    index: number,
    field: "name" | "quantity" | "unitPrice",
    val: string | number,
  ) => {
    setItemsList((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, [field]: val };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) return;

    const lineItems = itemsList
      .filter((item) => item.name.trim().length > 0)
      .map((item) => ({
        product: item.name,
        qty: item.quantity,
        unitCost: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
      }));

    const newPO: PurchaseOrder = {
      id: poNumber.trim().toUpperCase(),
      supplier,
      items: lineItems.length > 0 ? lineItems.length : 1,
      total: totalCalculated > 0 ? totalCalculated : 100,
      status,
      orderDate: orderDate.trim() || "Aug 26, 2026",
      expectedDate: status === "Draft" ? "—" : expectedDate.trim() || "Sep 02, 2026",
      notes: notes.trim(),
      lineItems: lineItems.length > 0 ? lineItems : [
        { product: "Office Procurement Items", qty: 1, unitCost: totalCalculated || 100, lineTotal: totalCalculated || 100 }
      ],
      activities: [
        {
          id: `act-${Date.now()}`,
          title: "Created by Dara Pich",
          time: `${orderDate.trim()} • 9:00 AM`,
          completed: true,
        },
        {
          id: `act-${Date.now() + 1}`,
          title: `Sent to ${supplier}`,
          time: `${orderDate.trim()} • 9:15 AM`,
          completed: true,
        },
        {
          id: `act-${Date.now() + 2}`,
          title: "Awaiting your approval",
          time: "now",
          completed: false,
        },
      ],
    };

    onCreate(newPO);
    onClose();
  };

  return (
    <div
      className="po-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="po-modal" role="dialog" aria-modal="true" aria-labelledby="new-po-title">
        <div className="po-modal-header">
          <div>
            <h2 id="new-po-title">New Purchase Order</h2>
            <p className="po-modal-subtitle">
              Draft or issue a new PO for stock procurement
            </p>
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

        <form onSubmit={handleSubmit} className="po-form">
          <div className="po-form-row">
            <div className="po-form-field">
              <label htmlFor="po-number">PO Number</label>
              <input
                id="po-number"
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-2042"
              />
            </div>
            <div className="po-form-field">
              <label htmlFor="po-supplier">Supplier</label>
              <select
                id="po-supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                {suppliersList.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="po-form-row">
            <div className="po-form-field">
              <label htmlFor="po-status">Initial Status</label>
              <select
                id="po-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as POStatus)}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Draft">Draft</option>
                <option value="Received">Received</option>
              </select>
            </div>
            <div className="po-form-field">
              <label htmlFor="po-order-date">Order Date</label>
              <input
                id="po-order-date"
                type="text"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
            <div className="po-form-field">
              <label htmlFor="po-expected-date">Expected Date</label>
              <input
                id="po-expected-date"
                type="text"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                disabled={status === "Draft"}
              />
            </div>
          </div>

          <div className="po-items-section">
            <div className="po-items-header">
              <label>Items Breakdown</label>
              <button
                type="button"
                className="po-add-item-btn"
                onClick={addItemRow}
              >
                <PlusOutlined /> Add Item
              </button>
            </div>
            <div className="po-items-list">
              {itemsList.map((item, idx) => (
                <div key={idx} className="po-item-row">
                  <input
                    type="text"
                    placeholder="Item name / SKU"
                    value={item.name}
                    onChange={(e) =>
                      updateItemRow(idx, "name", e.target.value)
                    }
                    className="po-item-name"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      updateItemRow(
                        idx,
                        "quantity",
                        Math.max(1, parseInt(e.target.value) || 0),
                      )
                    }
                    className="po-item-qty"
                  />
                  <div className="po-item-price-wrapper">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateItemRow(
                          idx,
                          "unitPrice",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="po-item-price"
                    />
                  </div>
                  {itemsList.length > 1 && (
                    <button
                      type="button"
                      className="po-remove-item-btn"
                      onClick={() => removeItemRow(idx)}
                      aria-label="Remove item"
                    >
                      <DeleteOutlined />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="po-items-summary">
              <span>
                Total Items: <strong>{totalItemsCount}</strong>
              </span>
              <span>
                Estimated Total:{" "}
                <strong>
                  ${totalCalculated.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </span>
            </div>
          </div>

          <div className="po-form-field">
            <label htmlFor="po-notes">Notes / Special Instructions</label>
            <textarea
              id="po-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deliver to Siem Reap loading dock..."
            />
          </div>

          <div className="po-modal-actions">
            <button
              type="button"
              className="po-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="po-submit-btn">
              Create PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
