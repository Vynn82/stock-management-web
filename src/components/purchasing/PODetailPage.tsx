"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckOutlined,
  CloseOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  PurchaseOrder,
  POStatus,
  formatCurrency,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  supplierDirectory,
} from "./purchasing-data";

import RejectPOModal from "./RejectPOModal";

interface PODetailPageProps {
  poId: string;
}

export default function PODetailPage({ poId }: PODetailPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<PurchaseOrder | null>(() => getPurchaseOrderById(poId) ?? null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  useEffect(() => {
    const found = getPurchaseOrderById(poId);
    if (found) {
      setOrder(found);
    }
  }, [poId]);

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
            <ArrowLeftOutlined /> Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  const supplierDetails =
    order.supplierInfo ||
    supplierDirectory[order.supplier] || {
      name: order.supplier,
      contact: "Rithy Sok • Contact",
      phone: "+855 12 345 678",
      email: "rithy@papercosupplies.com",
    };

  const handleApprove = () => {
    // Navigate to Receive Goods page for this PO
    router.push(`/purchasing/${order.id}/receive`);
  };

  const handleConfirmReject = (reason: string) => {
    const updated = updatePurchaseOrderStatus(order.id, "Rejected", reason);
    if (updated) {
      setOrder(updated);
      setIsRejectModalOpen(false);
      setActionNotice("Purchase order has been rejected.");
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="purchasing-page po-detail-page">
      {/* Breadcrumb */}
      <nav className="po-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/purchasing" className="po-detail-breadcrumb-link">
          Purchase Orders
        </Link>
        <span className="po-detail-breadcrumb-sep">/</span>
        <span className="po-detail-breadcrumb-curr">{order.id}</span>
      </nav>

      {/* Header Row */}
      <div className="po-detail-header-row">
        <h1 className="po-detail-title">{order.id}</h1>
        <span className={`po-status-badge status-${order.status.toLowerCase()}`}>
          {order.status}
        </span>
        <span className="po-detail-supplier-bullet">• {order.supplier}</span>
      </div>

      {actionNotice && (
        <div className="po-action-notice" role="alert">
          <CheckCircleOutlined />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main 2-column Grid */}
      <div className="po-detail-grid">
        {/* Left Column (Line items & Activity) */}
        <div className="po-detail-main">
          {/* Line items Card */}
          <section className="po-card po-line-items-card" aria-labelledby="line-items-title">
            <h2 id="line-items-title" className="po-card-title">
              Line items
            </h2>
            <div className="po-line-items-table-wrap">
              <table className="po-line-items-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "42%" }}>
                      PRODUCT
                    </th>
                    <th scope="col" style={{ width: "16%" }}>
                      QTY
                    </th>
                    <th scope="col" style={{ width: "22%" }}>
                      UNIT COST
                    </th>
                    <th scope="col" style={{ width: "20%" }}>
                      LINE TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="po-line-product">{item.product}</td>
                      <td className="po-line-qty">{item.qty}</td>
                      <td className="po-line-unit-cost">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="po-line-total">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                  <tr className="po-line-items-total-row">
                    <td colSpan={2}></td>
                    <td className="po-line-total-label">Total</td>
                    <td className="po-line-total-value">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Activity Card */}
          <section className="po-card po-activity-card" aria-labelledby="activity-title">
            <h2 id="activity-title" className="po-card-title">
              Activity
            </h2>
            <div className="po-activity-timeline">
              {order.activities.map((act, index) => {
                const isLast = index === order.activities.length - 1;
                return (
                  <div
                    key={act.id || index}
                    className={`po-timeline-item ${act.completed ? "completed" : "pending"}`}
                  >
                    <div className="po-timeline-node">
                      <span className="po-timeline-dot" />
                      {!isLast && <span className="po-timeline-line" />}
                    </div>
                    <div className="po-timeline-content">
                      <strong className="po-timeline-title">{act.title}</strong>
                      <span className="po-timeline-time">{act.time}</span>
                      {act.reason && (
                        <div className="po-timeline-reason-box">
                          <span className="po-timeline-reason-tag">Reason:</span>
                          <span className="po-timeline-reason-text">&ldquo;{act.reason}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column (Decision & Supplier) */}
        <div className="po-detail-sidebar">
          {/* Decision Card */}
          <section className="po-card po-decision-card" aria-labelledby="decision-title">
            <h2 id="decision-title" className="po-card-title">
              Decision
            </h2>
            {order.status === "Rejected" ? (
              <div className="po-decision-rejected-state">
                <div className="po-decision-rejected-badge">
                  <CloseOutlined /> Rejected
                </div>
                {order.rejectionReason && (
                  <p className="po-decision-rejected-reason">
                    {order.rejectionReason}
                  </p>
                )}
                <button
                  type="button"
                  className="po-btn-reopen"
                  onClick={handleApprove}
                >
                  <CheckOutlined /> Re-evaluate &amp; Approve
                </button>
              </div>
            ) : (
              <div className="po-decision-actions">
                <button
                  type="button"
                  className={`po-btn-approve ${order.status === "Approved" ? "active" : ""}`}
                  onClick={handleApprove}
                >
                  <CheckOutlined /> Approve
                </button>
                <button
                  type="button"
                  className="po-btn-reject"
                  onClick={() => setIsRejectModalOpen(true)}
                >
                  <CloseOutlined /> Reject
                </button>
              </div>
            )}
          </section>

          {/* Supplier Card */}
          <section className="po-card po-supplier-card" aria-labelledby="supplier-title">
            <h2 id="supplier-title" className="po-card-title">
              Supplier
            </h2>
            <div className="po-supplier-header">
              <div className="po-supplier-icon-box" aria-hidden="true">
                <ShopOutlined />
              </div>
              <div className="po-supplier-header-copy">
                <strong className="po-supplier-name">
                  {supplierDetails.name}
                </strong>
                <span className="po-supplier-subtitle">
                  {supplierDetails.contact}
                </span>
              </div>
            </div>

            <div className="po-supplier-details-list">
              <div className="po-supplier-detail-row">
                <span className="po-supplier-detail-label">Phone</span>
                <strong className="po-supplier-detail-val">
                  {supplierDetails.phone}
                </strong>
              </div>
              <div className="po-supplier-detail-row">
                <span className="po-supplier-detail-label">Email</span>
                <strong className="po-supplier-detail-val">
                  {supplierDetails.email}
                </strong>
              </div>
            </div>
          </section>
        </div>
      </div>

      <RejectPOModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirmReject={handleConfirmReject}
        poId={order.id}
        supplierName={supplierDetails.name}
      />
    </div>
  );
}
