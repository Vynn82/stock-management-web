"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRightOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { errorText } from "@/components/common/live-state";
import { commitRequest, timeAgo, type LiveRequest } from "@/features/requests/requests-live";

import BackButton from "@/components/ui/BackButton";
function stepLabel(actionType: string) {
  return actionType === "CERTIFIER" ? "Certifier" : "Approver";
}

export default function RequestDetailPage({ request, onChanged }: { request: LiveRequest; onChanged: () => void | Promise<void> }) {
  const status = request.status;
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rejectTriggerRef = useRef<HTMLButtonElement>(null);
  const isPending = status === "Pending";
  const waitingFor = request.approvers.find((a) => a.status === "PENDING");

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

  async function decide(action: "APPROVE" | "REJECT") {
    setBusy(true);
    setError("");
    try {
      await commitRequest(request.id, action, rejectionReason);
      setShowRejectDialog(false);
      await onChanged();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  function rejectRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectionReason.trim()) return;
    void decide("REJECT");
  }

  return (
    <main className="request-detail-page">
      <BackButton href="/requests" />
      <nav className="request-breadcrumb" aria-label="Breadcrumb">
        <Link href="/requests">Requests</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{request.requestNo}</span>
      </nav>

      <div className="request-detail-grid">
        <div className="request-detail-primary">
          <section className="request-summary-card" aria-labelledby="request-detail-title">
            <div className="request-summary-top">
              <span className="request-detail-avatar" aria-hidden="true">{request.requester[0]}</span>
              <div className="request-summary-heading">
                <h1 id="request-detail-title">Request #{request.requestNo}</h1>
                <p>{request.requester} · requested {request.requested}</p>
              </div>
              <span className={`request-status ${status.toLowerCase()}`}>{status}</span>
            </div>

            {request.hasRoute && (
              <div className="request-route-card">
                <div>
                  <span>From</span>
                  <strong>{request.from}</strong>
                </div>
                <ArrowRightOutlined className="request-route-arrow" />
                <div className="request-route-destination">
                  <span>To</span>
                  <strong>{request.to}</strong>
                </div>
              </div>
            )}

            <dl className="request-summary-details">
              <div><dt>Product</dt><dd>{request.productSummary}</dd></div>
              <div><dt>Quantity</dt><dd>{request.quantity} units</dd></div>
              <div><dt>Type</dt><dd>{request.typeLabel}</dd></div>
              {request.remark && <div className="request-summary-notes"><dt>Notes</dt><dd>{request.remark}</dd></div>}
            </dl>
          </section>

          <section className="request-activity-card" aria-labelledby="request-activity-title">
            <h2 id="request-activity-title">Activity</h2>
            <ol className="request-activity-list">
              <li className="complete">
                <strong>{request.requester} created this request</strong>
                <span>{request.requested}</span>
              </li>
              {request.approvers.map((a) => {
                const done = a.status === "APPROVED" || a.status === "REJECTED";
                const current = a.status === "PENDING" && isPending;
                return (
                  <li key={a.id} className={done ? "complete" : current ? "current" : ""}>
                    <strong>
                      {done
                        ? `${a.name} (${stepLabel(a.actionType)}) ${a.status === "APPROVED" ? "approved" : "rejected"}${a.remark ? `: ${a.remark}` : ""}`
                        : current
                          ? `Awaiting ${a.name} (${stepLabel(a.actionType)})`
                          : `${a.name} (${stepLabel(a.actionType)}) will review next`}
                    </strong>
                    <span>{done && a.actionDate ? timeAgo(a.actionDate) : current ? "now" : "Queued"}</span>
                  </li>
                );
              })}
              {request.approvers.length === 0 && (
                <li className={isPending ? "current" : "complete"}>
                  <strong>{isPending ? "Awaiting an approver" : `Request ${status.toLowerCase()}`}</strong>
                  <span>{isPending ? "now" : ""}</span>
                </li>
              )}
            </ol>
          </section>
        </div>

        <aside className="request-detail-secondary">
          <section className="request-decision-card" aria-labelledby="request-decision-title">
            <h2 id="request-decision-title">Decision</h2>
            {isPending && request.canAct ? (
              <div className="request-decision-actions">
                <button type="button" className="request-decision-approve" disabled={busy} onClick={() => decide("APPROVE")}>
                  <CheckOutlined /> {busy ? "Working…" : "Approve"}
                </button>
                <button ref={rejectTriggerRef} type="button" className="request-decision-reject" disabled={busy} onClick={() => setShowRejectDialog(true)}>
                  <CloseOutlined /> Reject
                </button>
              </div>
            ) : isPending ? (
              <p className="request-decision-result pending">
                {waitingFor ? `Waiting for ${waitingFor.name} (${stepLabel(waitingFor.actionType)}).` : "Waiting for an approver."}
              </p>
            ) : (
              <p className={`request-decision-result ${status.toLowerCase()}`}>
                {status === "Approved" ? <CheckOutlined /> : <CloseOutlined />}
                This request has been {status.toLowerCase()}.
              </p>
            )}
            {error && !showRejectDialog && <p className="new-request-error" role="alert">{error}</p>}
          </section>

          <section className="request-requester-card" aria-labelledby="requester-card-title">
            <h2 id="requester-card-title">Requested by</h2>
            <div className="requester-profile">
              <span className="request-detail-avatar" aria-hidden="true">{request.requester[0]}</span>
              <div>
                <strong>{request.requester}</strong>
                <span>{request.typeLabel} request</span>
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
            <h2 id="reject-dialog-title">Reject {request.requestNo}?</h2>
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
            {error && <p className="new-request-error" role="alert">{error}</p>}
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
              <button className="reject-dialog-submit" type="submit" disabled={busy}>
                <CloseOutlined /> {busy ? "Working…" : "Reject Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
