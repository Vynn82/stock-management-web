"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import { useRouter } from "next/navigation";
import { CheckOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { fetchPurchaseOrder, receivePo, type PoDetail } from "@/features/purchasing/purchasing-live";

interface ReceiveGoodsPageProps {
  poId: string;
}

export default function ReceiveGoodsPage({ poId }: ReceiveGoodsPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<PoDetail | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [notesEdited, setNotesEdited] = useState(false);
  const [reasons, setReasons] = useState<Record<string, "NOT_ARRIVED" | "DAMAGED" | "WRONG_ITEM">>({});
  const [rating, setRating] = useState(0);
  const [closeAfter, setCloseAfter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const po = await fetchPurchaseOrder(poId);
      setOrder(po);
      // Start with everything that is still to come.
      setQty(Object.fromEntries(po.items.map((i) => [i.id, i.remainingQuantity])));
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

  const breadcrumb = (
    <>
    <BackButton href={`/purchasing/${poId}`} label="Back to purchase order" />
    <nav className="po-detail-breadcrumb" aria-label="Breadcrumb">
      <Link href="/purchasing" className="po-detail-breadcrumb-link">
        Purchase Orders
      </Link>
      <span className="po-detail-breadcrumb-sep">/</span>
      {order ? (
        <Link href={`/purchasing/${order.id}`} className="po-detail-breadcrumb-link">
          {order.poNumber}
        </Link>
      ) : (
        <span className="po-detail-breadcrumb-curr">{poId}</span>
      )}
      {order && (
        <>
          <span className="po-detail-breadcrumb-sep">/</span>
          <span className="po-detail-breadcrumb-curr">Receive</span>
        </>
      )}
    </nav>
    </>
  );

  if (notFound) {
    return (
      <div className="purchasing-page">
        {breadcrumb}
        <div className="po-not-found-card">
          <h2>Purchase Order Not Found</h2>
          <p>This purchase order could not be found.</p>
          <Link href="/purchasing" className="po-back-btn">
            Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="purchasing-page">
        {breadcrumb}
        <LiveState loading={loading} error={error} onRetry={load} loadingText="Loading purchase order…" />
      </div>
    );
  }

  if (order.status !== "APPROVED" && order.status !== "PARTIALLY_RECEIVED") {
    return (
      <div className="purchasing-page">
        {breadcrumb}
        <div className="po-not-found-card">
          <h2>Not ready to receive</h2>
          <p>Goods can only be received on an approved order. This one is {order.status.toLowerCase().replaceAll("_", " ")}.</p>
          <Link href={`/purchasing/${order.id}`} className="po-back-btn">
            Back to {order.poNumber}
          </Link>
        </div>
      </div>
    );
  }

  const suggestion = (next: Record<string, number>) => {
    const short = order.items.filter((i) => (next[i.id] ?? 0) < i.remainingQuantity);
    if (short.length === 0) return "";
    return `${short.map((i) => `${i.label} short by ${Math.round((i.remainingQuantity - (next[i.id] ?? 0)) * 1000) / 1000} units`).join(", ")} — supplier notified, remainder expected next shipment.`;
  };

  const handleQtyChange = (itemId: string, remaining: number, value: number) => {
    const safe = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), remaining);
    setQty((prev) => {
      const next = { ...prev, [itemId]: safe };
      if (!notesEdited) setNotes(suggestion(next));
      return next;
    });
  };

  const handleConfirmReceipt = async () => {
    const items = order.items.filter((i) => (qty[i.id] ?? 0) > 0).map((i) => ({ itemId: i.id, quantity: qty[i.id] }));
    if (items.length === 0) {
      setSaveError("Enter a received quantity for at least one product.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const issues = order.items
        .filter((i) => i.remainingQuantity > 0 && (qty[i.id] ?? 0) < i.remainingQuantity)
        .map((i) => ({
          itemId: i.id,
          reason: reasons[i.id] ?? ("NOT_ARRIVED" as const),
          quantity: Math.round((i.remainingQuantity - (qty[i.id] ?? 0)) * 1000) / 1000,
        }));
      await receivePo(order.id, { items, note: notes, issues, rating: rating || undefined, closeAfter });
      router.push(`/purchasing/${order.id}`);
    } catch (e) {
      setSaveError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="purchasing-page po-receive-page">
      <div className="po-receive-header">
        <div className="po-receive-header-left">
          {breadcrumb}
          <h1 className="po-detail-title">Receive Goods — {order.poNumber}</h1>
        </div>

      </div>

      <div className="po-card po-receive-card">
        <h2 className="po-receive-supplier-title">Delivered from {order.supplier.name} to {order.warehouse.name}</h2>

        <div className="po-receive-table-wrap">
          <table className="po-receive-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "34%" }}>PRODUCT</th>
                <th scope="col" style={{ width: "18%" }}>STILL TO RECEIVE</th>
                <th scope="col" style={{ width: "18%" }}>RECEIVED QTY</th>
                <th scope="col" style={{ width: "22%" }}>IF SHORT, WHY</th>
                <th scope="col" style={{ width: "8%", textAlign: "right" }}>
                  <span className="sr-only">Status</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const value = qty[item.id] ?? 0;
                const done = item.remainingQuantity <= 0;
                const hasDiscrepancy = !done && value !== item.remainingQuantity;
                return (
                  <tr key={item.id} className={`po-receive-row ${hasDiscrepancy ? "has-discrepancy" : ""}`}>
                    <td className="po-receive-product">{item.label}</td>
                    <td className="po-receive-ordered-qty">{item.remainingQuantity}</td>
                    <td className="po-receive-qty-cell">
                      <input
                        type="number"
                        min="0"
                        max={item.remainingQuantity}
                        disabled={done}
                        className={`po-receive-qty-input ${hasDiscrepancy ? "discrepancy" : ""}`}
                        value={value}
                        onChange={(e) => handleQtyChange(item.id, item.remainingQuantity, parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      {hasDiscrepancy ? (
                        <select
                          className="po-new-select"
                          value={reasons[item.id] ?? "NOT_ARRIVED"}
                          onChange={(e) => setReasons((r) => ({ ...r, [item.id]: e.target.value as "NOT_ARRIVED" | "DAMAGED" | "WRONG_ITEM" }))}
                        >
                          <option value="NOT_ARRIVED">Not arrived</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="WRONG_ITEM">Wrong item</option>
                        </select>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td className="po-receive-check-cell">
                      {hasDiscrepancy ? (
                        <span className="po-receive-checkbox warning" aria-label="Discrepancy" />
                      ) : (
                        <span className="po-receive-checkbox checked" aria-label="Matched">
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

        <div className="po-discrepancy-section">
          <label htmlFor="po-discrepancy-notes" className="po-discrepancy-label">
            Discrepancy notes
          </label>
          <textarea
            id="po-discrepancy-notes"
            className="po-discrepancy-textarea"
            rows={2}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesEdited(true);
            }}
            placeholder="Note any damaged, short, or substituted items..."
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", marginTop: 14 }}>
          <div>
            <span style={{ fontSize: 12.5, color: "var(--muted)", marginRight: 8 }}>How was the delivery?</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(rating === n ? 0 : n)}
                style={{ background: "none", border: 0, cursor: "pointer", fontSize: 22, color: n <= rating ? "#F59E0B" : "#D1D5DB", padding: 0 }}
              >
                ★
              </button>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={closeAfter} onChange={(e) => setCloseAfter(e.target.checked)} />
            Close this order after receiving — the rest is not coming
          </label>
        </div>
        {saveError && (
          <p className="po-reject-helper" role="alert" style={{ color: "#dc2626" }}>
            {saveError}
          </p>
        )}
      </div>
      <div className="page-form-actions">
        <div className="po-receive-header-actions">
          <Link href={`/purchasing/${order.id}`} className="po-receive-cancel-btn">
            Cancel
          </Link>
          <button type="button" className="po-receive-confirm-btn" onClick={handleConfirmReceipt} disabled={saving}>
            {saving ? "Saving…" : "Confirm Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
