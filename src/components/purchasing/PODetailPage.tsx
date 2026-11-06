"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckOutlined, CloseOutlined, ShopOutlined, CheckCircleOutlined, ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { suppliersApi, type SupplierRow } from "@/features/live/master-data";
import {
  approvePo,
  closePo,
  exportNewProducts,
  markCatalogAdded,
  fetchApprovers,
  fetchPurchaseOrder,
  formatDateTime,
  poBadge,
  rejectPo,
  submitPo,
  type Approver,
  type PoDetail,
} from "@/features/purchasing/purchasing-live";
import { formatCurrency } from "./purchasing-data";
import RejectPOModal from "./RejectPOModal";
import Can from "@/components/common/Can";

interface PODetailPageProps {
  poId: string;
}

interface TimelineEntry {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  reason?: string;
}

function buildTimeline(po: PoDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { id: "created", title: `Created by ${po.createdBy?.name ?? "Unknown"}`, time: formatDateTime(po.createdAt), completed: true },
  ];
  if (po.status === "DRAFT") {
    entries.push({ id: "draft", title: "Saved as a draft — not sent for approval yet", time: "", completed: false });
    return entries;
  }
  if (po.approver) {
    entries.push({ id: "sent", title: `Sent to ${po.approver.name} for approval`, time: "", completed: true });
  }
  if (po.status === "SUBMITTED") {
    entries.push({ id: "await", title: "Awaiting approval", time: "now", completed: false });
    return entries;
  }
  if (po.status === "REJECTED") {
    entries.push({
      id: "rejected",
      title: `Rejected${po.decidedBy ? ` by ${po.decidedBy.name}` : ""}`,
      time: formatDateTime(po.decidedAt),
      completed: true,
      reason: po.rejectionReason ?? undefined,
    });
    return entries;
  }
  entries.push({
    id: "approved",
    title: po.decidedBy ? `Approved by ${po.decidedBy.name}` : "Approved automatically",
    time: formatDateTime(po.decidedAt),
    completed: true,
  });
  for (const r of [...po.receipts].reverse()) {
    const qty = r.items.reduce((sum, i) => sum + i.quantity, 0);
    entries.push({
      id: r.id,
      title: `Received ${qty} units (${r.receiptNumber})${r.receivedBy ? ` by ${r.receivedBy.name}` : ""}`,
      time: formatDateTime(r.createdAt),
      completed: true,
      reason: r.note ?? undefined,
    });
  }
  if (po.status === "APPROVED") entries.push({ id: "receive", title: "Waiting for the goods", time: "", completed: false });
  if (po.status === "PARTIALLY_RECEIVED") entries.push({ id: "more", title: "Waiting for the rest of the goods", time: "", completed: false });
  if (po.status === "CLOSED") entries.push({ id: "closed", title: "Closed — the rest is not coming", time: "", completed: true });
  return entries;
}

export default function PODetailPage({ poId }: PODetailPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<PoDetail | null>(null);
  const [supplier, setSupplier] = useState<SupplierRow | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [approverId, setApproverId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const po = await fetchPurchaseOrder(poId);
      setOrder(po);
      suppliersApi
        .list(po.supplier.code)
        .then((rows) => setSupplier(rows.find((s) => s.code === po.supplier.code) ?? null))
        .catch(() => setSupplier(null));
      if (po.status === "DRAFT") {
        fetchApprovers()
          .then((list) => {
            setApprovers(list);
            setApproverId((cur) => cur || list[0]?.id || "");
          })
          .catch(() => setApprovers([]));
      }
    } catch (e) {
      if ((e as { status?: number }).status === 404) setNotFound(true);
      else setError(errorText(e, "Couldn't load this purchase order."));
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    void load();
  }, [load]);

  const notice = (text: string) => {
    setActionNotice(text);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setActionError("");
    try {
      await action();
      notice(done);
      await load();
      return true;
    } catch (e) {
      setActionError(errorText(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const breadcrumb = (curr: string) => (
    <nav className="po-detail-breadcrumb" aria-label="Breadcrumb">
      <Link href="/purchasing" className="po-detail-breadcrumb-link">
        Purchase Orders
      </Link>
      <span className="po-detail-breadcrumb-sep">/</span>
      <span className="po-detail-breadcrumb-curr">{curr}</span>
    </nav>
  );

  if (notFound) {
    return (
      <div className="purchasing-page">
        {breadcrumb(poId)}
        <div className="po-not-found-card">
          <h2>Purchase Order Not Found</h2>
          <p>This purchase order could not be found.</p>
          <Link href="/purchasing" className="po-back-btn">
            <ArrowLeftOutlined /> Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="purchasing-page">
        {breadcrumb("…")}
        <LiveState loading={loading} error={error} onRetry={load} loadingText="Loading purchase order…" />
      </div>
    );
  }

  const badge = poBadge(order.status);
  const timeline = buildTimeline(order);
  const status = order.status;
  const canReceive = status === "APPROVED" || status === "PARTIALLY_RECEIVED";

  return (
    <div className="purchasing-page po-detail-page">
      {breadcrumb(order.poNumber)}

      <div className="po-detail-header-row">
        <h1 className="po-detail-title">{order.poNumber}</h1>
        <span className={`po-status-badge status-${badge.cls}`}>{badge.label}</span>
        <span className="po-detail-supplier-bullet">• {order.supplier.name} → {order.warehouse.name}</span>
      </div>

      {actionNotice && (
        <div className="po-action-notice" role="alert">
          <CheckCircleOutlined />
          <span>{actionNotice}</span>
        </div>
      )}
      {actionError && !isRejectModalOpen && (
        <div className="po-action-notice" role="alert" style={{ color: "#dc2626" }}>
          <CloseOutlined />
          <span>{actionError}</span>
        </div>
      )}

      <div className="po-detail-grid">
        <div className="po-detail-main">
          <section className="po-card po-line-items-card" aria-labelledby="line-items-title">
            <h2 id="line-items-title" className="po-card-title">
              Line items
            </h2>
            <div className="po-line-items-table-wrap">
              <table className="po-line-items-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "42%" }}>PRODUCT</th>
                    <th scope="col" style={{ width: "16%" }}>QTY</th>
                    <th scope="col" style={{ width: "22%" }}>UNIT COST</th>
                    <th scope="col" style={{ width: "20%" }}>LINE TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="po-line-product">{item.label}</td>
                      <td className="po-line-qty">
                        {item.quantity}
                        {item.receivedQuantity > 0 && <span style={{ color: "var(--muted)" }}> ({item.receivedQuantity} received)</span>}
                      </td>
                      <td className="po-line-unit-cost">{formatCurrency(item.unitPrice)}</td>
                      <td className="po-line-total">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                  <tr className="po-line-items-total-row">
                    <td colSpan={2}></td>
                    <td className="po-line-total-label">Total</td>
                    <td className="po-line-total-value">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="po-card po-activity-card" aria-labelledby="activity-title">
            <h2 id="activity-title" className="po-card-title">
              Activity
            </h2>
            <div className="po-activity-timeline">
              {timeline.map((act, index) => {
                const isLast = index === timeline.length - 1;
                return (
                  <div key={act.id} className={`po-timeline-item ${act.completed ? "completed" : "pending"}`}>
                    <div className="po-timeline-node">
                      <span className="po-timeline-dot" />
                      {!isLast && <span className="po-timeline-line" />}
                    </div>
                    <div className="po-timeline-content">
                      <strong className="po-timeline-title">{act.title}</strong>
                      <span className="po-timeline-time">{act.time}</span>
                      {act.reason && (
                        <div className="po-timeline-reason-box">
                          <span className="po-timeline-reason-tag">{status === "REJECTED" && act.id === "rejected" ? "Reason:" : "Note:"}</span>
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

        <div className="po-detail-sidebar">
          <section className="po-card po-decision-card" aria-labelledby="decision-title">
            <h2 id="decision-title" className="po-card-title">
              Decision
            </h2>
            {status === "DRAFT" && (
              <Can any={"PO_CREATE"}><div className="po-decision-actions" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                {approvers.length > 0 && (
                  <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                    Send for approval to
                    <select className="po-new-select" value={approverId} onChange={(e) => setApproverId(e.target.value)}>
                      {approvers.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <button type="button" className="po-btn-reject" disabled={busy} onClick={() => router.push(`/purchasing/${order.id}/edit`)}>
                  Edit draft
                </button>
                <button type="button" className="po-btn-approve" disabled={busy} onClick={() => run(() => submitPo(order.id, approverId || undefined), "Purchase order sent for approval.")}>
                  <CheckOutlined /> {busy ? "Working…" : "Submit for approval"}
                </button>
              </div></Can>
            )}
            {status === "SUBMITTED" && (
              <Can any={"PO_APPROVE"}><div className="po-decision-actions">
                <button type="button" className="po-btn-approve" disabled={busy} onClick={() => run(() => approvePo(order.id), "Purchase order approved.")}>
                  <CheckOutlined /> {busy ? "Working…" : "Approve"}
                </button>
                <button type="button" className="po-btn-reject" disabled={busy} onClick={() => { setActionError(""); setIsRejectModalOpen(true); }}>
                  <CloseOutlined /> Reject
                </button>
              </div></Can>
            )}
            {canReceive && (
              <Can any={"PO_RECEIVE"}><div className="po-decision-actions" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                <button type="button" className="po-btn-approve active" onClick={() => router.push(`/purchasing/${order.id}/receive`)}>
                  <InboxOutlined /> Receive goods
                </button>
                {status === "PARTIALLY_RECEIVED" && (
                  <button type="button" className="po-btn-reject" disabled={busy} onClick={() => run(() => closePo(order.id), "Purchase order closed.")}>
                    <CloseOutlined /> Close — rest not coming
                  </button>
                )}
              </div></Can>
            )}
            {status === "REJECTED" && (
              <div className="po-decision-rejected-state">
                <div className="po-decision-rejected-badge">
                  <CloseOutlined /> Rejected
                </div>
                {order.rejectionReason && <p className="po-decision-rejected-reason">{order.rejectionReason}</p>}
              </div>
            )}
            {(status === "RECEIVED" || status === "CLOSED") && (
              <p className="po-decision-rejected-reason">{status === "RECEIVED" ? "All goods were received." : "This order is closed."}</p>
            )}
          </section>

          {order.items.some((i) => i.pendingCatalog || i.catalogAdded) && (
            <section className="po-card" aria-labelledby="catalog-title">
              <h2 id="catalog-title" className="po-card-title">
                New products
              </h2>
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 10px" }}>
                {order.items.some((i) => i.pendingCatalog)
                  ? "These items arrived but are not in the catalogue yet. Export them as an Add Product import file, then mark them as added."
                  : "All received new products were added to the catalogue."}
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                <Can any={"PO_VIEW"}>
                  <button type="button" className="po-btn-reject" disabled={busy} onClick={() => run(() => exportNewProducts(order.id, order.poNumber), "Excel file downloaded.")}>
                    Export to Excel
                  </button>
                </Can>
                {order.items.some((i) => i.pendingCatalog) && (
                  <Can any={"PO_CREATE"}>
                    <button type="button" className="po-btn-approve" disabled={busy} onClick={() => run(() => markCatalogAdded(order.id), "Marked as added to the catalogue.")}>
                      <CheckOutlined /> Mark as added to catalogue
                    </button>
                  </Can>
                )}
              </div>
            </section>
          )}

          <section className="po-card po-supplier-card" aria-labelledby="supplier-title">
            <h2 id="supplier-title" className="po-card-title">
              Supplier
            </h2>
            <div className="po-supplier-header">
              <div className="po-supplier-icon-box" aria-hidden="true">
                <ShopOutlined />
              </div>
              <div className="po-supplier-header-copy">
                <strong className="po-supplier-name">{order.supplier.name}</strong>
                <span className="po-supplier-subtitle">{supplier?.contactPerson || "No contact person"}</span>
              </div>
            </div>

            <div className="po-supplier-details-list">
              <div className="po-supplier-detail-row">
                <span className="po-supplier-detail-label">Phone</span>
                <strong className="po-supplier-detail-val">{supplier?.phone || "—"}</strong>
              </div>
              <div className="po-supplier-detail-row">
                <span className="po-supplier-detail-label">Email</span>
                <strong className="po-supplier-detail-val">{supplier?.email || "—"}</strong>
              </div>
              <div className="po-supplier-detail-row">
                <span className="po-supplier-detail-label">Deliver to</span>
                <strong className="po-supplier-detail-val">{order.warehouse.name}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>

      <RejectPOModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        busy={busy}
        error={actionError}
        onConfirmReject={async (reason) => {
          const ok = await run(() => rejectPo(order.id, reason), "Purchase order has been rejected.");
          if (ok) setIsRejectModalOpen(false);
        }}
        poId={order.poNumber}
        supplierName={order.supplier.name}
      />
    </div>
  );
}
