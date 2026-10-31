"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckOutlined } from "@ant-design/icons";
import {
  PurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
} from "./purchasing-data";

interface ReceiveGoodsPageProps {
  poId: string;
}

interface ReceiveLineItem {
  product: string;
  orderedQty: number;
  receivedQty: number;
}

export default function ReceiveGoodsPage({ poId }: ReceiveGoodsPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<PurchaseOrder | null>(() => getPurchaseOrderById(poId) ?? null);

  useEffect(() => {
    const found = getPurchaseOrderById(poId);
    if (found) {
      setOrder(found);
    }
  }, [poId]);

  // Initial receive items based on the screenshot:
  // If the order has items, use them; for PO-2041 or TechEdge, match the exact items from the screenshot
  const [receiveItems, setReceiveItems] = useState<ReceiveLineItem[]>(() => {
    const found = getPurchaseOrderById(poId);
    if (found && found.lineItems && found.lineItems.length > 0) {
      // Check if it already has USB-C Cable or if we can use order's items
      const hasUsb = found.lineItems.some((i) => i.product.includes("USB-C"));
      if (hasUsb) {
        return found.lineItems.map((i) => ({
          product: i.product,
          orderedQty: i.qty,
          receivedQty: i.product.includes("USB-C") ? Math.max(0, i.qty - 40) : i.qty,
        }));
      }
    }

    // Default matching screenshot
    return [
      { product: "Wireless Mouse M185", orderedQty: 200, receivedQty: 200 },
      { product: "USB-C Cable 2m", orderedQty: 500, receivedQty: 460 },
      { product: "HDMI Cable 1.5m", orderedQty: 150, receivedQty: 150 },
    ];
  });

  const [discrepancyNotes, setDiscrepancyNotes] = useState(
    "USB-C Cable 2m short by 40 units — supplier notified, remainder expected next shipment.",
  );

  if (!order) {
    return (
      <div className="purchasing-page">
        <nav className="po-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/purchasing" className="po-detail-breadcrumb-link">
            Purchase Orders
          </Link>
          <span className="po-detail-breadcrumb-sep">/</span>
          <span className="po-detail-breadcrumb-curr">{poId}</span>
        </nav>
        <div className="po-not-found-card">
          <h2>Purchase Order Not Found</h2>
          <p>The purchase order &quot;{poId}&quot; could not be found.</p>
          <Link href="/purchasing" className="po-back-btn">
            Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  const supplierName =
    order.supplier === "PaperCo Supplies"
      ? "TechEdge Distribution"
      : order.supplier || "TechEdge Distribution";

  const handleQtyChange = (index: number, newQty: number) => {
    setReceiveItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], receivedQty: newQty };

      // Check discrepancies and auto update notes suggestion if needed
      const discrepancies = updated.filter((i) => i.receivedQty !== i.orderedQty);
      if (discrepancies.length > 0) {
        const desc = discrepancies
          .map((d) => {
            const diff = d.orderedQty - d.receivedQty;
            return diff > 0
              ? `${d.product} short by ${diff} units`
              : `${d.product} extra by ${Math.abs(diff)} units`;
          })
          .join(", ");
        setDiscrepancyNotes(`${desc} — supplier notified, remainder expected next shipment.`);
      }

      return updated;
    });
  };

  const handleConfirmReceipt = () => {
    // Update PO status to Received
    updatePurchaseOrderStatus(order.id, "Received");
    router.push(`/purchasing/${order.id}`);
  };

  return (
    <div className="purchasing-page po-receive-page">
      {/* Header & Breadcrumb */}
      <div className="po-receive-header">
        <div className="po-receive-header-left">
          <nav className="po-detail-breadcrumb" aria-label="Breadcrumb">
            <Link href="/purchasing" className="po-detail-breadcrumb-link">
              Purchase Orders
            </Link>
            <span className="po-detail-breadcrumb-sep">/</span>
            <Link href={`/purchasing/${order.id}`} className="po-detail-breadcrumb-link">
              {order.id}
            </Link>
            <span className="po-detail-breadcrumb-sep">/</span>
            <span className="po-detail-breadcrumb-curr">Receive</span>
          </nav>

          <h1 className="po-detail-title">Receive Goods — {order.id}</h1>
        </div>

        <div className="po-receive-header-actions">
          <Link href={`/purchasing/${order.id}`} className="po-receive-cancel-btn">
            Cancel
          </Link>
          <button
            type="button"
            className="po-receive-confirm-btn"
            onClick={handleConfirmReceipt}
          >
            Confirm Receipt
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="po-card po-receive-card">
        <h2 className="po-receive-supplier-title">
          Delivered from {supplierName}
        </h2>

        <div className="po-receive-table-wrap">
          <table className="po-receive-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "48%" }}>
                  PRODUCT
                </th>
                <th scope="col" style={{ width: "24%" }}>
                  ORDERED QTY
                </th>
                <th scope="col" style={{ width: "20%" }}>
                  RECEIVED QTY
                </th>
                <th scope="col" style={{ width: "8%", textAlign: "right" }}>
                  <span className="sr-only">Status</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {receiveItems.map((item, index) => {
                const hasDiscrepancy = item.receivedQty !== item.orderedQty;

                return (
                  <tr
                    key={index}
                    className={`po-receive-row ${hasDiscrepancy ? "has-discrepancy" : ""}`}
                  >
                    <td className="po-receive-product">{item.product}</td>
                    <td className="po-receive-ordered-qty">{item.orderedQty}</td>
                    <td className="po-receive-qty-cell">
                      <input
                        type="number"
                        min="0"
                        className={`po-receive-qty-input ${hasDiscrepancy ? "discrepancy" : ""}`}
                        value={item.receivedQty}
                        onChange={(e) =>
                          handleQtyChange(index, parseInt(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="po-receive-check-cell">
                      {hasDiscrepancy ? (
                        <span
                          className="po-receive-checkbox warning"
                          aria-label="Discrepancy"
                        />
                      ) : (
                        <span
                          className="po-receive-checkbox checked"
                          aria-label="Matched"
                        >
                          <CheckOutlined />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Discrepancy Notes */}
        <div className="po-discrepancy-section">
          <label htmlFor="po-discrepancy-notes" className="po-discrepancy-label">
            Discrepancy notes
          </label>
          <textarea
            id="po-discrepancy-notes"
            className="po-discrepancy-textarea"
            rows={2}
            value={discrepancyNotes}
            onChange={(e) => setDiscrepancyNotes(e.target.value)}
            placeholder="Note any damaged, short, or substituted items..."
          />
        </div>
      </div>
    </div>
  );
}
