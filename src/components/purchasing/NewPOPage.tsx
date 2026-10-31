"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarOutlined,
  DownOutlined,
  PlusOutlined,
  CloseOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import {
  supplierDirectory,
  createPurchaseOrder,
  formatCurrency,
  POLineItem,
} from "./purchasing-data";

const initialLineItems: POLineItem[] = [
  {
    product: "Wireless Mouse M185",
    qty: 200,
    unitCost: 8.5,
    lineTotal: 1700.0,
  },
  {
    product: "USB-C Cable 2m",
    qty: 500,
    unitCost: 1.2,
    lineTotal: 600.0,
  },
  {
    product: "HDMI Cable 1.5m",
    qty: 150,
    unitCost: 2.8,
    lineTotal: 420.0,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function NewPOPage() {
  const router = useRouter();

  const [selectedSupplier, setSelectedSupplier] = useState(
    "TechEdge Distribution",
  );
  const [expectedDelivery, setExpectedDelivery] = useState("05.09.2026");
  const [lineItems, setLineItems] = useState<POLineItem[]>(initialLineItems);

  // New item draft inputs for inline adding
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newProduct, setNewProduct] = useState("");
  const [newQty, setNewQty] = useState<number>(50);
  const [newUnitCost, setNewUnitCost] = useState<number>(10.0);

  const supplierInfo =
    supplierDirectory[selectedSupplier] ||
    supplierDirectory["TechEdge Distribution"];

  const orderTotal = lineItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleDeleteItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddLineItem = () => {
    if (!newProduct.trim()) {
      setIsAddingItem(true);
      return;
    }
    const item: POLineItem = {
      product: newProduct.trim(),
      qty: newQty,
      unitCost: newUnitCost,
      lineTotal: newQty * newUnitCost,
    };
    setLineItems((prev) => [...prev, item]);
    setNewProduct("");
    setNewQty(50);
    setNewUnitCost(10.0);
    setIsAddingItem(false);
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();

    const created = createPurchaseOrder({
      supplier: selectedSupplier,
      expectedDate: expectedDelivery,
      lineItems: lineItems,
      total: orderTotal,
      status: "Pending",
      supplierInfo: supplierInfo,
    });

    router.push(`/purchasing/${created.id}`);
  };

  return (
    <div className="purchasing-page po-new-page">
      <form onSubmit={handleSavePO}>
        {/* Top Header & Breadcrumb */}
        <div className="po-new-header">
          <div className="po-new-header-left">
            <nav className="po-detail-breadcrumb" aria-label="Breadcrumb">
              <Link href="/purchasing" className="po-detail-breadcrumb-link">
                Purchase Orders
              </Link>
              <span className="po-detail-breadcrumb-sep">/</span>
              <span className="po-detail-breadcrumb-curr">New PO</span>
            </nav>
            <h1 className="po-detail-title">New Purchase Order</h1>
          </div>

          <div className="po-new-header-actions">
            <Link href="/purchasing" className="po-new-cancel-btn">
              Cancel
            </Link>
            <button type="submit" className="po-new-save-btn">
              Save Purchase Order
            </button>
          </div>
        </div>

        {/* 2-column Grid */}
        <div className="po-new-grid">
          {/* Left Column */}
          <div className="po-new-main">
            {/* Top Card: Supplier & Expected delivery */}
            <div className="po-card po-new-form-card">
              <div className="po-new-form-row">
                {/* Supplier select */}
                <div className="po-new-field">
                  <label htmlFor="po-supplier-select">Supplier</label>
                  <div className="po-new-select-wrap">
                    <select
                      id="po-supplier-select"
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="po-new-select"
                    >
                      {Object.keys(supplierDirectory).map((sup) => (
                        <option key={sup} value={sup}>
                          {sup}
                        </option>
                      ))}
                    </select>
                    <DownOutlined className="po-new-select-chevron" />
                  </div>
                </div>

                {/* Expected delivery input */}
                <div className="po-new-field">
                  <label htmlFor="po-expected-delivery">Expected delivery</label>
                  <div className="po-new-date-wrap">
                    <CalendarOutlined className="po-new-date-icon" />
                    <input
                      id="po-expected-delivery"
                      type="text"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      placeholder="DD.MM.YYYY"
                      className="po-new-date-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card: Line items */}
            <div className="po-card po-new-items-card">
              <h2 className="po-card-title">Line items</h2>

              <div className="po-new-table-wrap">
                <table className="po-new-table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "42%" }}>
                        PRODUCT
                      </th>
                      <th scope="col" style={{ width: "16%" }}>
                        QUANTITY
                      </th>
                      <th scope="col" style={{ width: "20%" }}>
                        UNIT COST
                      </th>
                      <th scope="col" style={{ width: "17%" }}>
                        LINE TOTAL
                      </th>
                      <th scope="col" style={{ width: "5%" }}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="po-line-product">{item.product}</td>
                        <td className="po-line-qty">{item.qty}</td>
                        <td className="po-line-unit-cost">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="po-line-total">
                          {formatCurrency(item.lineTotal)}
                        </td>
                        <td className="po-line-action">
                          <button
                            type="button"
                            className="po-line-delete-btn"
                            onClick={() => handleDeleteItem(idx)}
                            aria-label={`Remove ${item.product}`}
                          >
                            <CloseOutlined />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Inline row addition if adding */}
                    {isAddingItem && (
                      <tr className="po-new-inline-add-row">
                        <td>
                          <input
                            type="text"
                            placeholder="Product name"
                            value={newProduct}
                            onChange={(e) => setNewProduct(e.target.value)}
                            className="po-inline-input"
                            autoFocus
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={newQty}
                            onChange={(e) =>
                              setNewQty(parseInt(e.target.value) || 1)
                            }
                            className="po-inline-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newUnitCost}
                            onChange={(e) =>
                              setNewUnitCost(parseFloat(e.target.value) || 0)
                            }
                            className="po-inline-input"
                          />
                        </td>
                        <td className="po-line-total">
                          {formatCurrency(newQty * newUnitCost)}
                        </td>
                        <td className="po-line-action">
                          <button
                            type="button"
                            className="po-inline-confirm-btn"
                            onClick={handleAddLineItem}
                            title="Add item"
                          >
                            ✓
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add line item button */}
              <button
                type="button"
                className="po-add-line-btn"
                onClick={() => {
                  if (isAddingItem) {
                    handleAddLineItem();
                  } else {
                    setIsAddingItem(true);
                  }
                }}
              >
                <PlusOutlined /> Add line item
              </button>

              {/* Order total footer */}
              <div className="po-new-order-total-wrap">
                <span className="po-new-order-total">
                  Order total:{" "}
                  <strong>{formatCurrency(orderTotal)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Supplier contact */}
          <div className="po-new-sidebar">
            <div className="po-card po-new-contact-card">
              <h2 className="po-card-title">Supplier contact</h2>

              <div className="po-new-supplier-block">
                <div className="po-new-avatar-box" aria-hidden="true">
                  {getInitials(supplierInfo.name)}
                </div>
                <div className="po-new-supplier-copy">
                  <strong className="po-new-supplier-name">
                    {supplierInfo.name}
                  </strong>
                  <span className="po-new-supplier-sub">
                    {supplierInfo.contact}
                  </span>
                </div>
              </div>

              <div className="po-new-contact-details">
                <div className="po-new-contact-row">
                  <MailOutlined className="po-new-contact-icon" />
                  <span className="po-new-contact-text">
                    {supplierInfo.email}
                  </span>
                </div>
                <div className="po-new-contact-row">
                  <PhoneOutlined className="po-new-contact-icon" />
                  <span className="po-new-contact-text">
                    {supplierInfo.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
