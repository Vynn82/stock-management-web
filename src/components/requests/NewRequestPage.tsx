"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CaretDownOutlined, CheckOutlined } from "@ant-design/icons";
import { saveNewRequest, type RequestType } from "@/components/requests/request-data";

const products = [
  { name: "Wireless Mouse M185", stock: 42, reorder: 15, color: "sand" },
  { name: "Wireless Headphones", stock: 128, reorder: 30, color: "lavender" },
  { name: "USB-C Charging Hub", stock: 24, reorder: 12, color: "blue" },
  { name: "A5 Hardcover Notebook", stock: 86, reorder: 20, color: "green" },
];

const warehouses = ["Phnom Penh Main", "Siem Reap Branch", "Battambang", "Kampong Cham"];

export default function NewRequestPage() {
  const router = useRouter();
  const [type, setType] = useState<RequestType>("Transfer");
  const [productName, setProductName] = useState(products[0].name);
  const [quantity, setQuantity] = useState("18");
  const [fromWarehouse, setFromWarehouse] = useState(warehouses[0]);
  const [toWarehouse, setToWarehouse] = useState(warehouses[1]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const product = useMemo(() => products.find((item) => item.name === productName) ?? products[0], [productName]);
  const requestedQuantity = Number(quantity) || 0;
  const remainingStock = product.stock - requestedQuantity;

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (type === "Transfer" && toWarehouse === fromWarehouse) {
      setError("Choose a destination warehouse different from the source.");
      return;
    }
    if (requestedQuantity > product.stock) {
      setError(`Only ${product.stock} units are available at ${fromWarehouse}.`);
      return;
    }

    try {
      saveNewRequest({
        requester: "Sokha",
        route: type === "Transfer" ? `${fromWarehouse} → ${toWarehouse}` : fromWarehouse,
        type,
        quantity: requestedQuantity,
        notes: notes.trim(),
        product: productName,
      });
      router.push("/requests");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit your request.");
    }
  }

  return (
    <main className="new-request-page">
      <nav className="new-request-breadcrumb" aria-label="Breadcrumb">
        <Link href="/requests">Requests</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New Request</span>
      </nav>

      <form className="new-request-form" onSubmit={submitRequest}>
        <div className="new-request-heading">
          <h1>New Request</h1>
          <div className="new-request-heading-actions">
            <Link className="new-request-cancel" href="/requests">Cancel</Link>
            <button className="new-request-submit" type="submit"><CheckOutlined /> Submit Request</button>
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
              </div>
            </fieldset>

            <div className="new-request-product-field">
              <label htmlFor="request-product">Product</label>
              <div className="new-request-select-wrap">
                <select id="request-product" value={productName} onChange={(event) => setProductName(event.target.value)}>
                  {products.map((item) => <option key={item.name}>{item.name}</option>)}
                </select>
                <CaretDownOutlined />
              </div>
            </div>

            <div className="new-request-quantity-field">
              <label htmlFor="request-quantity">Quantity</label>
              <input id="request-quantity" type="number" min="1" max={product.stock} required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>

            <div className="new-request-warehouse-fields">
              <div>
                <label htmlFor="request-from-warehouse">From warehouse</label>
                <div className="new-request-select-wrap">
                  <select id="request-from-warehouse" value={fromWarehouse} onChange={(event) => setFromWarehouse(event.target.value)}>
                    {warehouses.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <CaretDownOutlined />
                </div>
              </div>
              {type === "Transfer" && (
                <div>
                  <label htmlFor="request-to-warehouse">To warehouse</label>
                  <div className="new-request-select-wrap">
                    <select id="request-to-warehouse" value={toWarehouse} onChange={(event) => setToWarehouse(event.target.value)}>
                      {warehouses.map((item) => <option key={item}>{item}</option>)}
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
            {error && <p className="new-request-error" role="alert">{error}</p>}
          </section>

          <aside className="new-request-availability-card" aria-live="polite">
            <h2>Available at {fromWarehouse}</h2>
            <div className="new-request-product-stock">
              <span className={`new-request-product-icon ${product.color}`} aria-hidden="true">◆</span>
              <div>
                <strong>{product.name}</strong>
                <span>{product.stock} units on hand</span>
              </div>
            </div>
            <p className={remainingStock < product.reorder ? "below-reorder" : ""}>
              Requesting {requestedQuantity || 0} units leaves {remainingStock} units at the source warehouse — {remainingStock >= product.reorder ? "above" : "below"} its reorder point of {product.reorder}.
            </p>
          </aside>
        </div>
      </form>
    </main>
  );
}
