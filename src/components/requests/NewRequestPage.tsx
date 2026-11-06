"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CaretDownOutlined, CheckOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { useLiveStock } from "@/features/stock/stock-live";
import { createStockRequest, fetchApproverCandidates, type ApproverCandidate } from "@/features/requests/requests-live";

type RequestType = "Transfer" | "Stock Out" | "Stock In" | "Adjustment";
const COLORS = ["sand", "lavender", "blue", "green"];

export default function NewRequestPage() {
  const router = useRouter();
  const { products: allProducts, warehouses: allWarehouses, loaded, loading, error: loadError, load } = useLiveStock();
  const [type, setType] = useState<RequestType>("Transfer");
  const [direction, setDirection] = useState<"INCREASE" | "DECREASE">("DECREASE");
  const [productCode, setProductCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [fromCode, setFromCode] = useState("");
  const [toCode, setToCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [people, setPeople] = useState<ApproverCandidate[]>([]);
  const [chain, setChain] = useState<{ userId: string; actionType: "CERTIFIER" | "APPROVER" }[]>([]);

  useEffect(() => {
    fetchApproverCandidates().then(setPeople).catch(() => setPeople([]));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const products = allProducts;
  const warehouses = allWarehouses;

  // Pick sensible defaults once the data arrives.
  useEffect(() => {
    if (!productCode && products[0]) setProductCode(products[0].code);
    if (!fromCode && warehouses[0]) setFromCode(warehouses[0].code);
    if (!toCode && warehouses[1]) setToCode(warehouses[1].code);
  }, [products, warehouses, productCode, fromCode, toCode]);

  const product = useMemo(() => products.find((item) => item.code === productCode) ?? products[0], [products, productCode]);
  const productIndex = Math.max(0, products.findIndex((item) => item.code === product?.code));
  const fromName = warehouses.find((w) => w.code === fromCode)?.name ?? "";
  const stockHere = product?.warehouses.find((w) => w.code === fromCode)?.qty ?? 0;
  const reorder = product?.reorderPoint ?? 0;
  const requestedQuantity = Number(quantity) || 0;
  // Stock leaves the source warehouse for a transfer, a stock out and an adjustment that decreases.
  const removesStock = type === "Transfer" || type === "Stock Out" || (type === "Adjustment" && direction === "DECREASE");
  const remainingStock = removesStock ? stockHere - requestedQuantity : stockHere + requestedQuantity;

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!product || !fromCode) {
      setError("Choose a product and a warehouse.");
      return;
    }
    if (type === "Transfer" && (!toCode || toCode === fromCode)) {
      setError("Choose a destination warehouse different from the source.");
      return;
    }
    if (requestedQuantity <= 0) {
      setError("Enter a quantity of 1 or more.");
      return;
    }
    if (removesStock && requestedQuantity > stockHere) {
      setError(`Only ${stockHere} units are available at ${fromName}.`);
      return;
    }

    if (chain.some((c) => !c.userId)) {
      setError("Choose a person for every step of the approval chain, or remove the empty step.");
      return;
    }
    if (new Set(chain.map((c) => c.userId)).size !== chain.length) {
      setError("A person can only appear once in the approval chain.");
      return;
    }
    if (chain.length > 0 && !chain.some((c) => c.actionType === "APPROVER")) {
      setError("The chain needs at least one approver.");
      return;
    }

    setSubmitting(true);
    try {
      await createStockRequest({
        type: type === "Transfer" ? "STOCK_TRANSFER" : type === "Stock In" ? "STOCK_IN" : type === "Adjustment" ? "STOCK_ADJUSTMENT" : "STOCK_OUT",
        adjustmentType: type === "Adjustment" ? direction : undefined,
        productCode: product.code,
        quantity: requestedQuantity,
        fromWarehouseCode: fromCode,
        toWarehouseCode: type === "Transfer" ? toCode : undefined,
        remark: notes,
        approvers: chain,
      });
      router.push("/requests");
    } catch (submitError) {
      setError(errorText(submitError, "Could not submit your request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="new-request-page">
      <nav className="new-request-breadcrumb" aria-label="Breadcrumb">
        <Link href="/requests">Requests</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New Request</span>
      </nav>

      {!loaded ? (
        <LiveState loading={loading || !loadError} error={loadError} onRetry={() => void load(true)} loadingText="Loading products and warehouses…" />
      ) : (
      <form className="new-request-form" onSubmit={submitRequest}>
        <div className="new-request-heading">
          <h1>New Request</h1>
          <div className="new-request-heading-actions">
            <Link className="new-request-cancel" href="/requests">Cancel</Link>
            <button className="new-request-submit" type="submit" disabled={submitting || !loaded}><CheckOutlined /> {submitting ? "Submitting…" : "Submit Request"}</button>
          </div>
        </div>

        <div className="new-request-grid">
          <section className="new-request-fields-card" aria-label="Request details">
            <fieldset className="new-request-type-field">
              <legend>Request type</legend>
              <div className="new-request-type-options">
                <button className={type === "Transfer" ? "selected" : ""} type="button" aria-pressed={type === "Transfer"} onClick={() => setType("Transfer")}>
                  Stock Transfer
                </button>
                <button className={type === "Stock Out" ? "selected" : ""} type="button" aria-pressed={type === "Stock Out"} onClick={() => setType("Stock Out")}>
                  Stock Out
                </button>
                <button className={type === "Stock In" ? "selected" : ""} type="button" aria-pressed={type === "Stock In"} onClick={() => setType("Stock In")}>
                  Stock In
                </button>
                <button className={type === "Adjustment" ? "selected" : ""} type="button" aria-pressed={type === "Adjustment"} onClick={() => setType("Adjustment")}>
                  Adjustment
                </button>
              </div>
            </fieldset>

            <div className="new-request-product-field">
              <label htmlFor="request-product">Product</label>
              <div className="new-request-select-wrap">
                <select id="request-product" value={productCode} onChange={(event) => setProductCode(event.target.value)}>
                  {products.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
                <CaretDownOutlined />
              </div>
            </div>

            <div className="new-request-quantity-field">
              <label htmlFor="request-quantity">Quantity</label>
              <input id="request-quantity" type="number" min="1" max={removesStock ? stockHere || undefined : undefined} required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>

            {type === "Adjustment" && (
              <div className="new-request-quantity-field">
                <label htmlFor="request-direction">Adjustment</label>
                <div className="new-request-select-wrap">
                  <select id="request-direction" value={direction} onChange={(event) => setDirection(event.target.value as "INCREASE" | "DECREASE")}>
                    <option value="DECREASE">Decrease (remove stock)</option>
                    <option value="INCREASE">Increase (add stock)</option>
                  </select>
                  <CaretDownOutlined />
                </div>
              </div>
            )}

            <div className="new-request-warehouse-fields">
              <div>
                <label htmlFor="request-from-warehouse">{type === "Transfer" || type === "Stock Out" ? "From warehouse" : "Warehouse"}</label>
                <div className="new-request-select-wrap">
                  <select id="request-from-warehouse" value={fromCode} onChange={(event) => setFromCode(event.target.value)}>
                    {warehouses.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                  </select>
                  <CaretDownOutlined />
                </div>
              </div>
              {type === "Transfer" && (
                <div>
                  <label htmlFor="request-to-warehouse">To warehouse</label>
                  <div className="new-request-select-wrap">
                    <select id="request-to-warehouse" value={toCode} onChange={(event) => setToCode(event.target.value)}>
                      {warehouses.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                    </select>
                    <CaretDownOutlined />
                  </div>
                </div>
              )}
            </div>

            <div className="new-request-notes-field">
              <label htmlFor="request-notes">Notes (optional)</label>
              <textarea id="request-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add any context the approver should know..." />
            </div>

            {people.length > 0 && (
              <div className="new-request-notes-field">
                <label>Approval chain (optional — leave empty to let the system choose)</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {chain.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ width: 22, color: "#6B7280", fontWeight: 600 }}>{i + 1}.</span>
                      <select
                        value={step.actionType}
                        onChange={(e) => setChain((c) => c.map((x, j) => (j === i ? { ...x, actionType: e.target.value as "CERTIFIER" | "APPROVER" } : x)))}
                        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ECE9F3" }}
                      >
                        <option value="CERTIFIER">Certifier</option>
                        <option value="APPROVER">Approver</option>
                      </select>
                      <select
                        value={step.userId}
                        onChange={(e) => setChain((c) => c.map((x, j) => (j === i ? { ...x, userId: e.target.value } : x)))}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ECE9F3" }}
                      >
                        <option value="">Choose a person…</option>
                        {people
                          .filter((p) => step.actionType === "CERTIFIER" || p.canApprove)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.roles.join(", ") || p.staffId})
                            </option>
                          ))}
                      </select>
                      <button type="button" onClick={() => setChain((c) => c.filter((_, j) => j !== i))} style={{ border: 0, background: "none", cursor: "pointer", color: "#DC2626", fontSize: 18 }} aria-label="Remove step">
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setChain((c) => [...c, { userId: "", actionType: c.length === 0 ? "APPROVER" : "CERTIFIER" }])}
                    style={{ justifySelf: "start", border: "1px dashed #C4B5FD", background: "#F5F3FF", color: "#6D28D9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}
                  >
                    + Add step
                  </button>
                </div>
              </div>
            )}
            {error && <p className="new-request-error" role="alert">{error}</p>}
          </section>

          <aside className="new-request-availability-card" aria-live="polite">
            <h2>Available at {fromName || "—"}</h2>
            <div className="new-request-product-stock">
              <span className={`new-request-product-icon ${COLORS[productIndex % COLORS.length]}`} aria-hidden="true">◆</span>
              <div>
                <strong>{product?.name ?? "—"}</strong>
                <span>{stockHere} units on hand</span>
              </div>
            </div>
            <p className={remainingStock < reorder ? "below-reorder" : ""}>
              Requesting {requestedQuantity || 0} units {removesStock ? "leaves" : "brings"} {remainingStock} units at the {type === "Transfer" || type === "Stock Out" ? "source " : ""}warehouse — {remainingStock >= reorder ? "above" : "below"} its reorder point of {reorder}.
            </p>
          </aside>
        </div>
      </form>
      )}
    </main>
  );
}
