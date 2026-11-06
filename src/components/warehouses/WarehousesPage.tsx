"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Modal, Popconfirm, message } from "antd";
import { HomeOutlined, PlusOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { codeFromName, warehousesApi, type WarehouseRow } from "@/features/live/master-data";
import Can from "@/components/common/Can";

const EMPTY = { name: "", address: "", manager: "", capacity: "" };

function percent(w: WarehouseRow): number | null {
  if (!w.capacity || w.capacity <= 0) return null;
  return Math.min(100, Math.round((w.usedQuantity / w.capacity) * 100));
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWarehouses(await warehousesApi.list());
    } catch (e) {
      setError(errorText(e, "Couldn't load warehouses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (w: WarehouseRow) => {
    setEditing(w);
    setForm({ name: w.name, address: w.address ?? "", manager: w.contactPerson ?? "", capacity: w.capacity ? String(w.capacity) : "" });
    setModalOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name || !form.address.trim() || !form.manager.trim()) {
      messageApi.error("Enter the warehouse name, location, and manager.");
      return;
    }
    if (warehouses.some((w) => w.name.toLowerCase() === name.toLowerCase() && w.id !== editing?.id)) {
      messageApi.error("A warehouse with this name already exists.");
      return;
    }
    const capacity = form.capacity.trim() === "" ? null : Number(form.capacity);
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 1)) {
      messageApi.error("Capacity must be a number of units, 1 or more (or leave it empty for no limit).");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await warehousesApi.update(editing.id, { name, address: form.address.trim(), contactPerson: form.manager.trim(), capacity });
        await load();
      } else {
        await warehousesApi.create({
          code: codeFromName(name),
          name,
          address: form.address,
          contactPerson: form.manager,
          ...(capacity !== null ? { capacity } : {}),
        });
        await load();
      }
      setModalOpen(false);
    } catch (e) {
      messageApi.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (w: WarehouseRow) => {
    try {
      await warehousesApi.deactivate(w.id);
      setWarehouses((cur) => cur.filter((x) => x.id !== w.id));
    } catch (e) {
      messageApi.error(errorText(e));
    }
  };

  return (
    <div className="manage-warehouses-page">
      {contextHolder}
      <div className="manage-warehouses-heading">
        <h1>Warehouses</h1>
        <Can any={"WAREHOUSE_MANAGE"}><Button className="manage-add-category" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Warehouse
        </Button></Can>
      </div>
      <LiveState loading={loading} error={error} empty={warehouses.length === 0} emptyText="No warehouses yet." loadingText="Loading warehouses…" onRetry={load}>
        <div className="warehouse-card-grid">
          {warehouses.map((w) => {
            const pct = percent(w);
            const color = pct === null ? "normal" : pct >= 90 ? "high" : pct >= 70 ? "medium" : "normal";
            const manager = w.contactPerson || "—";
            return (
              <article className="warehouse-card" key={w.id}>
                <div className="warehouse-card-heading">
                  <span className="warehouse-icon">
                    <HomeOutlined />
                  </span>
                  <div className="warehouse-title-copy">
                    <h2>{w.name}</h2>
                    <p>{w.address || "No address"}</p>
                  </div>
                </div>
                <div className="warehouse-capacity">
                  <div className="warehouse-capacity-label">
                    <span>Capacity used</span>
                    <strong className={`warehouse-capacity-value ${color}`}>{pct === null ? "No limit" : `${pct}%`}</strong>
                  </div>
                  <div className="warehouse-capacity-track" role="progressbar" aria-label={`${w.name} capacity used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? 0}>
                    <span className={color} style={{ width: `${pct ?? 0}%` }} />
                  </div>
                </div>
                <div className="warehouse-card-stats">
                  <div className="warehouse-items">
                    <span>Items</span>
                    <strong>{Math.round(w.usedQuantity).toLocaleString("en-US")}</strong>
                  </div>
                  <div className="warehouse-manager">
                    <span>Manager</span>
                    <div>
                      <strong>{manager}</strong>
                      <span className="warehouse-manager-avatar" aria-hidden="true">
                        {manager.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <Can any={"WAREHOUSE_MANAGE"}><Button size="small" onClick={() => openEdit(w)}>
                    Edit
                  </Button></Can>
                  <Can any={"WAREHOUSE_MANAGE"}><Popconfirm title="Remove warehouse?" description={`${w.name} will be hidden from the lists.`} okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => remove(w)}>
                    <Button size="small" danger>
                      Remove
                    </Button>
                  </Popconfirm></Can>
                </div>
              </article>
            );
          })}
        </div>
      </LiveState>
      <Modal title={editing ? "Edit warehouse" : "Add warehouse"} open={modalOpen} onOk={save} confirmLoading={saving} onCancel={() => setModalOpen(false)} okText={editing ? "Save changes" : "Add warehouse"} destroyOnHidden>
        <div className="warehouse-modal-fields">
          <label htmlFor="warehouse-name">Warehouse name</label>
          <Input id="warehouse-name" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Phnom Penh Main Warehouse" />
          <label htmlFor="warehouse-address">Address</label>
          <Input id="warehouse-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Warehouse location" />
          <label htmlFor="warehouse-manager">Manager</label>
          <Input id="warehouse-manager" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="Manager name" />
          <label htmlFor="warehouse-capacity">Capacity in units (optional)</label>
          <Input id="warehouse-capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} onPressEnter={save} placeholder="Leave empty for no limit" />
        </div>
      </Modal>
    </div>
  );
}
