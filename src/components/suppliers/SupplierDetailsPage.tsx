"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input, Modal, message } from "antd";
import { BankOutlined, EditOutlined } from "@ant-design/icons";
import type { Supplier } from "@/components/suppliers/supplier-data";

export default function SupplierDetailsPage({ supplier: initialSupplier }: { supplier: Supplier }) {
  const [supplier, setSupplier] = useState(initialSupplier);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...initialSupplier, contact: initialSupplier.detailContact ?? initialSupplier.contact });
  const [messageApi, contextHolder] = message.useMessage();

  const saveDetails = () => {
    if (!form.contact.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim()) {
      messageApi.error("Complete all contact information before saving.");
      return;
    }
    setSupplier((current) => ({
      ...current,
      contact: form.contact.trim(),
      detailContact: form.contact.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    }));
    setEditing(false);
  };

  return <div className="supplier-detail-page">
    {contextHolder}
    <nav className="supplier-detail-breadcrumb" aria-label="Breadcrumb">
      <Link href="/manage/suppliers">Suppliers</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{supplier.name}</span>
    </nav>
    <div className="supplier-detail-heading">
      <div className="supplier-detail-title">
        <span className="supplier-detail-icon" aria-hidden="true"><BankOutlined /></span>
        <h1>{supplier.name}</h1>
      </div>
      <Button className="supplier-edit-button" icon={<EditOutlined />} onClick={() => {
        setForm({ ...supplier, contact: supplier.detailContact ?? supplier.contact });
        setEditing(true);
      }}>Edit</Button>
    </div>

    <div className="supplier-detail-grid">
      <div className="supplier-detail-main-column">
        <section className="supplier-detail-card supplier-contact-card" aria-labelledby="supplier-contact-title">
          <h2 id="supplier-contact-title">Contact information</h2>
          <dl className="supplier-contact-grid">
            <div><dt>Contact person</dt><dd>{supplier.detailContact ?? supplier.contact}</dd></div>
            <div><dt>Phone</dt><dd>{supplier.phone}</dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${supplier.email}`}>{supplier.email}</a></dd></div>
            <div><dt>Address</dt><dd>{supplier.address}</dd></div>
          </dl>
        </section>

        <section className="supplier-detail-card supplier-orders-card" aria-labelledby="supplier-orders-title">
          <h2 id="supplier-orders-title">Purchase order history</h2>
          <div className="supplier-orders-table-wrap">
            <table className="supplier-orders-table">
              <thead><tr>
                <th scope="col">PO number</th>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
              </tr></thead>
              <tbody>
                {supplier.purchaseOrders.map((order) => <tr key={order.number}>
                  <td><span className="supplier-order-number">{order.number}</span></td>
                  <td>{order.date}</td>
                  <td>${order.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td><span className={`supplier-order-status ${order.status.toLowerCase()}`}>{order.status}</span></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="supplier-detail-side-column">
        <section className="supplier-detail-card supplier-summary-card" aria-labelledby="supplier-summary-title">
          <h2 id="supplier-summary-title">Summary</h2>
          <span className="supplier-summary-label">Total spend</span>
          <strong className="supplier-summary-total">${(supplier.detailTotalSpend ?? supplier.totalSpend).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <dl className="supplier-summary-stats">
            <div><dt>Open orders</dt><dd>{supplier.detailOpenOrders ?? supplier.openOrders}</dd></div>
            <div><dt>Avg. lead time</dt><dd>{supplier.averageLeadTime} days</dd></div>
            <div><dt>Orders placed</dt><dd>{supplier.ordersPlaced}</dd></div>
          </dl>
        </section>
        <section className="supplier-detail-card supplier-notes-card" aria-labelledby="supplier-notes-title">
          <h2 id="supplier-notes-title">Notes</h2>
          <p>{supplier.notes}</p>
        </section>
      </aside>
    </div>

    <Modal
      title="Edit supplier"
      open={editing}
      onOk={saveDetails}
      onCancel={() => setEditing(false)}
      okText="Save changes"
      destroyOnHidden
    >
      <div className="supplier-edit-fields">
        <label htmlFor="supplier-edit-contact">Contact person</label>
        <Input id="supplier-edit-contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
        <label htmlFor="supplier-edit-phone">Phone</label>
        <Input id="supplier-edit-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <label htmlFor="supplier-edit-email">Email</label>
        <Input id="supplier-edit-email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <label htmlFor="supplier-edit-address">Address</label>
        <Input id="supplier-edit-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} onPressEnter={saveDetails} />
      </div>
    </Modal>
  </div>;
}
