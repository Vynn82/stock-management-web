"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CaretDownOutlined, CheckOutlined, PlusOutlined, SearchOutlined, ShopOutlined } from "@ant-design/icons";
import { initialRequests, loadAddedRequests, type RequestStatus, type StockRequest } from "@/components/requests/request-data";

const tabs = ["All", "Pending", "Approved", "Rejected"] as const;
type RequestTab = (typeof tabs)[number];
const warehouses = ["All Warehouses", "Phnom Penh", "Siem Reap", "Battambang", "Kampong Cham"];

export default function RequestsPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState<RequestTab>("All");
  const [query, setQuery] = useState("");
  const [warehouse, setWarehouse] = useState("All Warehouses");
  const [warehouseMenuOpen, setWarehouseMenuOpen] = useState(false);
  const warehouseMenuRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<StockRequest | null>(null);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    try {
      setRequests([...initialRequests, ...loadAddedRequests()]);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not load saved requests.");
    }
  }, []);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesTab = tab === "All" || request.status === tab;
    const matchesQuery = `${request.id} ${request.requester}`.toLowerCase().includes(query.trim().toLowerCase());
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

  function updateStatus(status: RequestStatus) {
    if (!selected) return;
    setRequests((current) => current.map((request) => request.id === selected.id ? { ...request, status } : request));
    setSelected({ ...selected, status });
  }

  return (
    <div className="page-content requests-page">
      <div className="requests-heading">
        <h1>Requests</h1>
        <Link className="requests-new-button" href="/requests/new">
          <PlusOutlined /> New Request
        </Link>
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
            {item === "Pending" && <span className="requests-pending-count">18</span>}
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
        {dataError && <div className="requests-no-results" role="alert">{dataError}</div>}
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
                <td className="request-id"><Link className="request-id-link" href={`/requests/${request.id}`}>{request.id}</Link></td>
                <td>
                  <div className="request-requester">
                    <span className="requester-avatar">{request.requester[0]}</span>
                    <span>{request.requester}</span>
                  </div>
                </td>
                <td className="request-route">{request.route}</td>
                <td className="request-type">{request.type}</td>
                <td className="request-quantity">{request.quantity}</td>
                <td><span className={`request-status ${request.status.toLowerCase()}`}>{request.status}</span></td>
                <td className="request-age">{request.requested}</td>
                <td><button className="request-review-button" type="button" onClick={() => setSelected(request)}>Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && <div className="requests-no-results">No requests match your filters.</div>}
      </div>

      {selected && (
        <div className="request-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setSelected(null);
          }
        }}>
          <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
            <button className="request-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <h2 id="request-modal-title">Review request</h2>
            <p className="request-modal-subtitle">{selected.id} · {selected.requester}</p>
            <dl className="request-details">
              <div><dt>Route</dt><dd>{selected.route}</dd></div>
              <div><dt>Type</dt><dd>{selected.type}</dd></div>
              <div><dt>Quantity</dt><dd>{selected.quantity}</dd></div>
              <div><dt>Status</dt><dd><span className={`request-status ${selected.status.toLowerCase()}`}>{selected.status}</span></dd></div>
            </dl>
            {selected.status === "Pending" && (
              <div className="request-modal-actions">
                <button className="request-reject-button" type="button" onClick={() => updateStatus("Rejected")}>Reject</button>
                <button className="request-approve-button" type="button" onClick={() => updateStatus("Approved")}>Approve</button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
