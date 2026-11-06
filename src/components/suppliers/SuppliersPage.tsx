"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { listAll } from "@/features/live/http";
import { codeFromName, suppliersApi, type SupplierRow } from "@/features/live/master-data";
import Can from "@/components/common/Can";

const avatarColors = ["purple", "violet", "lavender", "blue"];
const OPEN = ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"];
const SPENT = ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED"];

interface Stats {
  open: number;
  spend: number;
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "" });
  const [messageApi, contextHolder] = message.useMessage();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSuppliers(await suppliersApi.list());
      // Order totals are optional: people without purchase-order access still see the list.
      listAll<{ status: string; totalAmount: number | string; supplier?: { code?: string } | null }>("purchase-orders")
        .then((orders) => {
          const next: Record<string, Stats> = {};
          for (const po of orders) {
            const code = po.supplier?.code;
            if (!code) continue;
            const s = (next[code] ??= { open: 0, spend: 0 });
            if (OPEN.includes(po.status)) s.open += 1;
            if (SPENT.includes(po.status)) s.spend += Number(po.totalAmount || 0);
          }
          setStats(next);
        })
        .catch(() => setStats({}));
    } catch (e) {
      setError(errorText(e, "Couldn't load suppliers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => `${s.name} ${s.code} ${s.contactPerson ?? ""}`.toLowerCase().includes(q));
  }, [search, suppliers]);

  const openCreate = () => {
    setForm({ name: "", contact: "", phone: "", email: "" });
    setModalOpen(true);
  };

  const addSupplier = async () => {
    const name = form.name.trim();
    if (!name || !form.contact.trim()) {
      messageApi.error("Enter a supplier and contact person.");
      return;
    }
    if (suppliers.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      messageApi.error("A supplier with this name already exists.");
      return;
    }
    setSaving(true);
    try {
      const created = await suppliersApi.create({
        code: codeFromName(name),
        name,
        contactPerson: form.contact,
        phone: form.phone,
        email: form.email,
      });
      setSuppliers((cur) => [...cur, created]);
      setModalOpen(false);
    } catch (e) {
      messageApi.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manage-suppliers-page">
      {contextHolder}
      <div className="manage-suppliers-heading">
        <h1>Suppliers</h1>
        <Can any={"SUPPLIER_MANAGE"}><Button className="manage-add-category" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Supplier
        </Button></Can>
      </div>
      <div className="suppliers-toolbar">
        <Input
          className="suppliers-search"
          prefix={<SearchOutlined />}
          placeholder="Search suppliers..."
          aria-label="Search suppliers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <LiveState loading={loading} error={error} onRetry={load} loadingText="Loading suppliers…">
        <div className="suppliers-table-wrap">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th scope="col">Supplier</th>
                <th scope="col">Contact person</th>
                <th scope="col">Open orders</th>
                <th scope="col">Total spend</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((supplier, index) => {
                const s = stats[supplier.code];
                return (
                  <tr
                    className="supplier-row"
                    key={supplier.id}
                    tabIndex={0}
                    aria-label={`View ${supplier.name} details`}
                    onClick={() => router.push(`/suppliers/${supplier.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/suppliers/${supplier.id}`);
                      }
                    }}
                  >
                    <td>
                      <div className="supplier-name-cell">
                        <span className={`supplier-avatar supplier-avatar-${avatarColors[index % avatarColors.length]}`} aria-hidden="true">
                          {supplier.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        <strong>{supplier.name}</strong>
                      </div>
                    </td>
                    <td>{supplier.contactPerson || "—"}</td>
                    <td>{s?.open ?? 0}</td>
                    <td>${(s?.spend ?? 0).toLocaleString("en-US")}</td>
                    <td>
                      <span className="supplier-status active">Active</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="suppliers-empty" colSpan={5}>
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </LiveState>
      <Modal title="Add supplier" open={modalOpen} onOk={addSupplier} confirmLoading={saving} onCancel={() => setModalOpen(false)} okText="Add supplier" destroyOnHidden>
        <div className="supplier-modal-fields">
          <label htmlFor="supplier-name">Supplier name</label>
          <Input id="supplier-name" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. PaperCo Supplies" />
          <label htmlFor="supplier-contact">Contact person</label>
          <Input id="supplier-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="e.g. Ratana Sok" />
          <label htmlFor="supplier-phone">Phone (optional)</label>
          <Input id="supplier-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+855 12 345 678" />
          <label htmlFor="supplier-email">Email (optional)</label>
          <Input id="supplier-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onPressEnter={addSupplier} placeholder="name@company.com" />
        </div>
      </Modal>
    </div>
  );
}
