"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input, Modal, message } from "antd";
import { BankOutlined, EditOutlined } from "@ant-design/icons";
import { errorText } from "@/components/common/live-state";
import { suppliersApi, type SupplierOrder, type SupplierRow } from "@/features/live/master-data";
import Can from "@/components/common/Can";

const OPEN = ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"];
const SPENT = ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED"];

function statusClass(status: string) {
  if (status === "RECEIVED" || status === "CLOSED") return "received";
  if (status === "REJECTED") return "cancelled";
  return "pending";
}

export default function SupplierDetailsPage({ supplier: initial, orders }: { supplier: SupplierRow; orders: SupplierOrder[] }) {
  const [supplier, setSupplier] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ contact: "", phone: "", email: "", address: "" });
  const [messageApi, contextHolder] = message.useMessage();

  const openOrders = orders.filter((o) => OPEN.includes(o.status)).length;
  const totalSpend = orders.filter((o) => SPENT.includes(o.status)).reduce((sum, o) => sum + o.total, 0);

  const openEdit = () => {
    setForm({
      contact: supplier.contactPerson ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
    });
    setEditing(true);
  };

  const saveDetails = async () => {
    if (!form.contact.trim()) {
      messageApi.error("Enter a contact person.");
      return;
    }
    setSaving(true);
    try {
      const updated = await suppliersApi.update(supplier.id, {
        contactPerson: form.contact.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });
      setSupplier((cur) => ({ ...cur, ...updated }));
      setEditing(false);
    } catch (e) {
      messageApi.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="supplier-detail-page">
      {contextHolder}
      <nav className="supplier-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/manage/suppliers">Suppliers</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{supplier.name}</span>
      </nav>
      <div className="supplier-detail-heading">
        <div className="supplier-detail-title">
          <span className="supplier-detail-icon" aria-hidden="true">
            <BankOutlined />
          </span>
          <h1>{supplier.name}</h1>
        </div>
        <Can any={"SUPPLIER_MANAGE"}><Button className="supplier-edit-button" icon={<EditOutlined />} onClick={openEdit}>
          Edit
        </Button></Can>
      </div>

      <div className="supplier-detail-grid">
        <div className="supplier-detail-main-column">
          <section className="supplier-detail-card supplier-contact-card" aria-labelledby="supplier-contact-title">
            <h2 id="supplier-contact-title">Contact information</h2>
            <dl className="supplier-contact-grid">
              <div>
                <dt>Contact person</dt>
                <dd>{supplier.contactPerson || "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{supplier.phone || "—"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{supplier.email ? <a href={`mailto:${supplier.email}`}>{supplier.email}</a> : "—"}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{supplier.address || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="supplier-detail-card supplier-orders-card" aria-labelledby="supplier-orders-title">
            <h2 id="supplier-orders-title">Purchase order history</h2>
            <div className="supplier-orders-table-wrap">
              <table className="supplier-orders-table">
                <thead>
                  <tr>
                    <th scope="col">PO number</th>
                    <th scope="col">Date</th>
                    <th scope="col">Total</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link className="supplier-order-number" href={`/purchasing/${order.id}`}>
                          {order.number}
                        </Link>
                      </td>
                      <td>{order.date}</td>
                      <td>${order.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`supplier-order-status ${statusClass(order.status)}`}>{order.status.replaceAll("_", " ")}</span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                        No purchase orders for this supplier yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="supplier-detail-side-column">
          <section className="supplier-detail-card supplier-summary-card" aria-labelledby="supplier-summary-title">
            <h2 id="supplier-summary-title">Summary</h2>
            <span className="supplier-summary-label">Total spend</span>
            <strong className="supplier-summary-total">${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <dl className="supplier-summary-stats">
              <div>
                <dt>Open orders</dt>
                <dd>{openOrders}</dd>
              </div>
              <div>
                <dt>Orders placed</dt>
                <dd>{orders.length}</dd>
              </div>
              <div>
                <dt>Code</dt>
                <dd>{supplier.code}</dd>
              </div>
            </dl>
          </section>
          <section className="supplier-detail-card supplier-notes-card" aria-labelledby="supplier-notes-title">
            <h2 id="supplier-notes-title">Details</h2>
            <p>
              {[supplier.platform && `Platform: ${supplier.platform}`, supplier.platformLink, supplier.country && `Country: ${supplier.country}`]
                .filter(Boolean)
                .join(" · ") || "No extra details."}
            </p>
          </section>
        </aside>
      </div>

      <Modal title="Edit supplier" open={editing} onOk={saveDetails} confirmLoading={saving} onCancel={() => setEditing(false)} okText="Save changes" destroyOnHidden>
        <div className="supplier-edit-fields">
          <label htmlFor="supplier-edit-contact">Contact person</label>
          <Input id="supplier-edit-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <label htmlFor="supplier-edit-phone">Phone</label>
          <Input id="supplier-edit-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label htmlFor="supplier-edit-email">Email</label>
          <Input id="supplier-edit-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label htmlFor="supplier-edit-address">Address</label>
          <Input id="supplier-edit-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} onPressEnter={saveDetails} />
        </div>
      </Modal>
    </div>
  );
}
