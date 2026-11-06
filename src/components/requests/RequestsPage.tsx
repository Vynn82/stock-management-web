"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CaretDownOutlined, CheckOutlined, PlusOutlined, SearchOutlined, ShopOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { commitRequest, fetchRequests, type LiveRequest } from "@/features/requests/requests-live";
import { fetchWarehouses } from "@/features/live/lookups";
import Can from "@/components/common/Can";

const tabs = ["All", "Pending", "Approved", "Rejected"] as const;
type RequestTab = (typeof tabs)[number];

export default function RequestsPage() {
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>(["All Warehouses"]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [tab, setTab] = useState<RequestTab>("All");
  const [query, setQuery] = useState("");
  const [warehouse, setWarehouse] = useState("All Warehouses");
  const [warehouseMenuOpen, setWarehouseMenuOpen] = useState(false);
  const warehouseMenuRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<LiveRequest | null>(null);
  const [dataError, setDataError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setDataError("");
    try {
      setRequests(await fetchRequests());
      fetchWarehouses()
        .then((list) => setWarehouses(["All Warehouses", ...list.map((w) => w.name)]))
        .catch(() => undefined);
    } catch (error) {
      setDataError(errorText(error, "Could not load requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesTab = tab === "All" || request.status === tab;
    const matchesQuery = `${request.requestNo} ${request.requester}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesWarehouse = warehouse === "All Warehouses" || request.route.includes(warehouse);
    return matchesTab && matchesQuery && matchesWarehouse;
  }), [query, requests, tab, warehouse]);

  useEffect(() => {
    if (!warehouseMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !warehouseMenuRef.current?.contains(event.target)) {
        setWarehouseMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setWarehouseMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [warehouseMenuOpen]);

  function closeReview() {
    setSelected(null);
    setRejecting(false);
    setRejectReason("");
  }

  async function decide(action: "APPROVE" | "REJECT") {
    if (!selected) return;
    if (action === "REJECT" && !rejectReason.trim()) return;
    setBusy(true);
    try {
      await commitRequest(selected.id, action, rejectReason);
      closeReview();
      await load();
    } catch (error) {
      setDataError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  const pendingCount = requests.filter((request) => request.status === "Pending").length;

  return (
    <div className="page-content requests-page">
      <div className="requests-heading">
        <h1>Requests</h1>
        <Can any={"REQUEST_CREATE"}><Link className="requests-new-button" href="/requests/new">
          <PlusOutlined /> New Request
        </Link></Can>
      </div>

      <div className="requests-tabs" role="tablist" aria-label="Request status">
        {tabs.map((item) => (
          <button
            className={`requests-tab ${tab === item ? "selected" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === item}
            key={item}
            onClick={() => setTab(item)}
          >
            {item}
            {item === "Pending" && pendingCount > 0 && <span className="requests-pending-count">{pendingCount}</span>}
          </button>
        ))}
      </div>

      <div className="requests-toolbar">
        <label className="requests-search">
          <SearchOutlined />
          <input
            type="search"
            placeholder="Search requester, request ID..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search requester or request ID"
          />
        </label>
        <div className="requests-warehouse" ref={warehouseMenuRef}>
          <button
            className={`requests-warehouse-trigger ${warehouseMenuOpen ? "is-open" : ""}`}
            type="button"
            aria-haspopup="menu"
            aria-expanded={warehouseMenuOpen}
            onClick={() => setWarehouseMenuOpen((open) => !open)}
          >
            <ShopOutlined className="requests-warehouse-icon" />
            <span className="requests-warehouse-label">{warehouse}</span>
            <CaretDownOutlined className="requests-warehouse-chevron" />
          </button>
          {warehouseMenuOpen && (
            <div className="requests-warehouse-menu" role="menu" aria-label="Filter by warehouse">
              <span className="requests-warehouse-menu-title">Filter by warehouse</span>
              {warehouses.map((option) => {
                const count = option === "All Warehouses"
                  ? requests.length
                  : requests.filter((request) => request.route.includes(option)).length;
                const isSelected = warehouse === option;
                return (
                  <button
                    className={`requests-warehouse-option ${isSelected ? "selected" : ""}`}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    key={option}
                    onClick={() => {
                      setWarehouse(option);
                      setWarehouseMenuOpen(false);
                    }}
                  >
                    <span className="requests-warehouse-option-copy">
                      <span className="requests-warehouse-option-name">{option}</span>
                      <span className="requests-warehouse-option-count">{count} {count === 1 ? "request" : "requests"}</span>
                    </span>
                    {isSelected && <CheckOutlined className="requests-warehouse-check" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="requests-table-wrap">
        <LiveState loading={loading} error={dataError} onRetry={load} loadingText="Loading requests…">
        <table className="requests-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Requester</th>
              <th scope="col">Route</th>
              <th scope="col">Type</th>
              <th scope="col">Qty</th>
              <th scope="col">Status</th>
              <th scope="col">Requested</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={request.id}>
                <td className="request-id"><Link className="request-id-link" href={`/requests/${request.id}`}>{request.requestNo}</Link></td>
                <td>
                  <div className="request-requester">
                    <span className="requester-avatar">{request.requester[0]}</span>
                    <span>{request.requester}</span>
                  </div>
                </td>
                <td className="request-route">{request.route}</td>
                <td className="request-type">{request.typeLabel}</td>
                <td className="request-quantity">{request.quantity}</td>
                <td><span className={`request-status ${request.status.toLowerCase()}`}>{request.status}</span></td>
                <td className="request-age">{request.requested}</td>
                <td><button className="request-review-button" type="button" onClick={() => setSelected(request)}>Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && <div className="requests-no-results">{requests.length === 0 ? "No requests yet." : "No requests match your filters."}</div>}
        </LiveState>
      </div>

      {selected && (
        <div className="request-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeReview();
          }
        }}>
          <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
            <button className="request-modal-close" type="button" onClick={closeReview} aria-label="Close">×</button>
            <h2 id="request-modal-title">Review request</h2>
            <p className="request-modal-subtitle">{selected.requestNo} · {selected.requester}</p>
            <dl className="request-details">
              <div><dt>Route</dt><dd>{selected.route}</dd></div>
              <div><dt>Type</dt><dd>{selected.typeLabel}</dd></div>
              <div><dt>Quantity</dt><dd>{selected.quantity}</dd></div>
              <div><dt>Status</dt><dd><span className={`request-status ${selected.status.toLowerCase()}`}>{selected.status}</span></dd></div>
            </dl>
            {selected.status === "Pending" && selected.canAct && !rejecting && (
              <div className="request-modal-actions">
                <button className="request-reject-button" type="button" disabled={busy} onClick={() => setRejecting(true)}>Reject</button>
                <button className="request-approve-button" type="button" disabled={busy} onClick={() => decide("APPROVE")}>{busy ? "Working…" : "Approve"}</button>
              </div>
            )}
            {selected.status === "Pending" && selected.canAct && rejecting && (
              <div>
                <textarea
                  className="reject-reason-input"
                  autoFocus
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Why is this request being rejected?"
                />
                <div className="request-modal-actions">
                  <button className="request-reject-button" type="button" disabled={busy} onClick={() => setRejecting(false)}>Back</button>
                  <button className="request-approve-button" type="button" disabled={busy || !rejectReason.trim()} onClick={() => decide("REJECT")}>{busy ? "Working…" : "Confirm reject"}</button>
                </div>
              </div>
            )}
            {selected.status === "Pending" && !selected.canAct && (
              <p className="request-modal-subtitle">
                {selected.approvers.find((a) => a.status === "PENDING")
                  ? `Waiting for ${selected.approvers.find((a) => a.status === "PENDING")?.name}.`
                  : "Waiting for an approver."}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
