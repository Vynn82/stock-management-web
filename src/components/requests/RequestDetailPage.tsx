"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRightOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { RequestStatus, StockRequest } from "@/components/requests/request-data";

const products: Record<string, string> = {
  "REQ-0142": "Wireless Mouse M185",
  "REQ-0143": "USB-C Charging Hub",
  "REQ-0141": "Ergonomic Office Chair",
  "REQ-0140": "A5 Hardcover Notebook",
  "REQ-0139": "Wireless Headphones",
  "REQ-0138": "Adjustable Desk Lamp",
  "REQ-0137": "USB-C Charging Hub",
};

function getWarehouses(route: string) {
  const [from, to] = route.split(" → ");
  return {
    from: from.endsWith("Warehouse") ? from : `${from} Warehouse`,
    to: to ? (to.endsWith("Warehouse") ? to : `${to} Warehouse`) : "Stock room",
  };
}

export default function RequestDetailPage({ request }: { request: StockRequest }) {
  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const rejectTriggerRef = useRef<HTMLButtonElement>(null);
  const warehouses = getWarehouses(request.route);
  const requesterName = `${request.requester} Chan`;
  const isPending = status === "Pending";

  useEffect(() => {
    if (!showRejectDialog) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowRejectDialog(false);
        rejectTriggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showRejectDialog]);

  function rejectRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectionReason.trim()) return;
    setStatus("Rejected");
    setShowRejectDialog(false);
  }

  return (
    <main className="request-detail-page">
      <nav className="request-breadcrumb" aria-label="Breadcrumb">
        <Link href="/requests">Requests</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{request.id}</span>
      </nav>

      <div className="request-detail-grid">
        <div className="request-detail-primary">
          <section className="request-summary-card" aria-labelledby="request-detail-title">
            <div className="request-summary-top">
              <span className="request-detail-avatar" aria-hidden="true">{request.requester[0]}</span>
              <div className="request-summary-heading">
                <h1 id="request-detail-title">Request #{request.id}</h1>
                <p>{request.requester} · requested {request.requested}</p>
              </div>
              <span className={`request-status ${status.toLowerCase()}`}>{status}</span>
            </div>

            <div className="request-route-card">
              <div>
                <span>From</span>
                <strong>{warehouses.from}</strong>
              </div>
              <ArrowRightOutlined className="request-route-arrow" />
              <div className="request-route-destination">
                <span>To</span>
                <strong>{warehouses.to}</strong>
              </div>
            </div>

            <dl className="request-summary-details">
              <div><dt>Product</dt><dd>{request.product ?? products[request.id] ?? "Stock item"}</dd></div>
              <div><dt>Quantity</dt><dd>{request.quantity} units</dd></div>
              <div><dt>Type</dt><dd>{request.type === "Transfer" ? "Stock Transfer" : "Stock Out"}</dd></div>
              {request.notes && <div className="request-summary-notes"><dt>Notes</dt><dd>{request.notes}</dd></div>}
            </dl>
          </section>

          <section className="request-activity-card" aria-labelledby="request-activity-title">
            <h2 id="request-activity-title">Activity</h2>
            <ol className="request-activity-list">
              <li className="complete">
                <strong>{request.requester} created this request</strong>
                <span>{request.requested}</span>
              </li>
              <li className="complete">
                <strong>Stock availability confirmed at {warehouses.from}</strong>
                <span>1 hour ago</span>
              </li>
              <li className={isPending ? "current" : "complete"}>
                <strong>{isPending ? "Awaiting your approval" : `Request ${status.toLowerCase()}`}</strong>
                <span>{isPending ? "now" : "Updated just now"}</span>
              </li>
              {status === "Rejected" && rejectionReason.trim() && (
                <li className="complete">
                  <strong>Rejection reason: {rejectionReason.trim()}</strong>
                  <span>Saved to the request activity log</span>
                </li>
              )}
            </ol>
          </section>
        </div>

        <aside className="request-detail-secondary">
          <section className="request-decision-card" aria-labelledby="request-decision-title">
            <h2 id="request-decision-title">Decision</h2>
            {isPending ? (
              <div className="request-decision-actions">
                <button type="button" className="request-decision-approve" onClick={() => setStatus("Approved")}>
                  <CheckOutlined /> Approve
                </button>
                <button ref={rejectTriggerRef} type="button" className="request-decision-reject" onClick={() => setShowRejectDialog(true)}>
                  <CloseOutlined /> Reject
                </button>
              </div>
            ) : (
              <p className={`request-decision-result ${status.toLowerCase()}`}>
                {status === "Approved" ? <CheckOutlined /> : <CloseOutlined />}
                This request has been {status.toLowerCase()}.
              </p>
            )}
          </section>

          <section className="request-requester-card" aria-labelledby="requester-card-title">
            <h2 id="requester-card-title">Requested by</h2>
            <div className="requester-profile">
              <span className="request-detail-avatar" aria-hidden="true">{request.requester[0]}</span>
              <div>
                <strong>{requesterName}</strong>
                <span>Warehouse Staff · Phnom Penh</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
      {showRejectDialog && (
        <div
          className="reject-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRejectDialog(false);
              rejectTriggerRef.current?.focus();
            }
          }}
        >
          <form className="reject-dialog" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title" onSubmit={rejectRequest}>
            <button
              className="reject-dialog-close"
              type="button"
              aria-label="Close rejection dialog"
              onClick={() => {
                setShowRejectDialog(false);
                rejectTriggerRef.current?.focus();
              }}
            >
              ×
            </button>
            <span className="reject-dialog-icon" aria-hidden="true"><CloseOutlined /></span>
            <h2 id="reject-dialog-title">Reject {request.id}?</h2>
            <p className="reject-dialog-description">
              {request.requester} will be notified. Let them know why this request is being rejected.
            </p>
            <label className="reject-reason-label" htmlFor="reject-reason">
              Reason for rejection <span aria-hidden="true">*</span>
            </label>
            <textarea
              autoFocus
              id="reject-reason"
              className="reject-reason-input"
              required
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Explain why this request cannot be approved..."
            />
            <p className="reject-dialog-helper">Saved to the request&apos;s activity log and shared with the requester.</p>
            <div className="reject-dialog-actions">
              <button
                className="reject-dialog-cancel"
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  rejectTriggerRef.current?.focus();
                }}
              >
                Cancel
              </button>
              <button className="reject-dialog-submit" type="submit">
                <CloseOutlined /> Reject Request
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
