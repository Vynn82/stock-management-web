"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Select, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { customSupplierStorageKey, readCustomSuppliers, suppliers as initialSuppliers, type Supplier } from "@/components/suppliers/supplier-data";

const avatarColors = ["purple", "violet", "lavender", "blue"];

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [active, setActive] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    try {
      setSuppliers([...initialSuppliers, ...readCustomSuppliers()]);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Could not load saved suppliers.");
    }
  }, [messageApi]);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return suppliers;
    return suppliers.filter((supplier) => `${supplier.name} ${supplier.contact}`.toLowerCase().includes(normalizedSearch));
  }, [search, suppliers]);

  const openCreate = () => {
    setName("");
    setContact("");
    setActive(true);
    setModalOpen(true);
  };

  const addSupplier = () => {
    const supplierName = name.trim();
    const contactName = contact.trim();
    if (!supplierName || !contactName) {
      messageApi.error("Enter a supplier and contact person.");
      return;
    }
    if (suppliers.some((supplier) => supplier.name.toLowerCase() === supplierName.toLowerCase())) {
      messageApi.error("A supplier with this name already exists.");
      return;
    }
    const newSupplier: Supplier = {
      id: Date.now(),
      name: supplierName,
      contact: contactName,
      openOrders: 0,
      totalSpend: 0,
      active,
      phone: "",
      email: "",
      address: "",
      averageLeadTime: 0,
      ordersPlaced: 0,
      notes: "",
      purchaseOrders: [],
    };
    try {
      const customSuppliers = readCustomSuppliers();
      window.localStorage.setItem(customSupplierStorageKey, JSON.stringify([...customSuppliers, newSupplier]));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Could not save this supplier.");
      return;
    }
    setSuppliers((current) => [...current, newSupplier]);
    setModalOpen(false);
  };

  return <div className="manage-suppliers-page">
    {contextHolder}
    <div className="manage-suppliers-heading">
      <h1>Suppliers</h1>
      <Button className="manage-add-category" type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Supplier</Button>
    </div>
    <div className="suppliers-toolbar">
      <Input
        className="suppliers-search"
        prefix={<SearchOutlined />}
        placeholder="Search suppliers..."
        aria-label="Search suppliers"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </div>
    <div className="suppliers-table-wrap">
      <table className="suppliers-table">
        <thead><tr>
          <th scope="col">Supplier</th>
          <th scope="col">Contact person</th>
          <th scope="col">Open orders</th>
          <th scope="col">Total spend</th>
          <th scope="col">Status</th>
        </tr></thead>
        <tbody>
          {filteredSuppliers.map((supplier, index) => <tr
            className="supplier-row"
            key={supplier.id}
            tabIndex={0}
            aria-label={`View ${supplier.name} details`}
            onClick={() => router.push(`/suppliers/${supplier.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/suppliers/${supplier.id}`);
              }
            }}
          >
            <td><div className="supplier-name-cell">
              <span className={`supplier-avatar supplier-avatar-${avatarColors[index % avatarColors.length]}`} aria-hidden="true">
                {supplier.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <strong>{supplier.name}</strong>
            </div></td>
            <td>{supplier.contact}</td>
            <td>{supplier.openOrders}</td>
            <td>${supplier.totalSpend.toLocaleString("en-US")}</td>
            <td><span className={`supplier-status ${supplier.active ? "active" : "inactive"}`}>{supplier.active ? "Active" : "Inactive"}</span></td>
          </tr>)}
          {filteredSuppliers.length === 0 && <tr><td className="suppliers-empty" colSpan={5}>No suppliers found.</td></tr>}
        </tbody>
      </table>
    </div>
    <Modal
      title="Add supplier"
      open={modalOpen}
      onOk={addSupplier}
      onCancel={() => setModalOpen(false)}
      okText="Add supplier"
      destroyOnHidden
    >
      <div className="supplier-modal-fields">
        <label htmlFor="supplier-name">Supplier name</label>
        <Input id="supplier-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. PaperCo Supplies" />
        <label htmlFor="supplier-contact">Contact person</label>
        <Input id="supplier-contact" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="e.g. Ratana Sok" onPressEnter={addSupplier} />
        <label htmlFor="supplier-status">Status</label>
        <Select id="supplier-status" value={active ? "active" : "inactive"} onChange={(value: "active" | "inactive") => setActive(value === "active")} options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]} />
      </div>
    </Modal>
  </div>;
}
