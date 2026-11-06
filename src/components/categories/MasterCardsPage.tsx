"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Modal, Popconfirm, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { codeFromName, fetchProductCounts, type MasterRow } from "@/features/live/master-data";
import Can from "@/components/common/Can";

const COLORS = ["#6d28d9", "#16a34a", "#c25a08", "#5794f5", "#e4232d", "#0e7490", "#b45309"];

interface Resource {
  list: () => Promise<MasterRow[]>;
  create: (data: { code: string; name: string }) => Promise<MasterRow>;
  update: (id: string, data: { name: string }) => Promise<MasterRow>;
  deactivate: (id: string) => Promise<unknown>;
}

/** Card grid with add / rename / remove, shared by Categories and Brands. */
export default function MasterCardsPage({
  title,
  singular,
  placeholder,
  countKey,
  resource,
}: {
  title: string;
  singular: string;
  placeholder: string;
  countKey: "byCategory" | "byBrand";
  resource: Resource;
}) {
  const [rows, setRows] = useState<MasterRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await resource.list();
      setRows(list);
      // Item counts are a nice-to-have; the page still works without them.
      fetchProductCounts()
        .then((c) => setCounts(c[countKey]))
        .catch(() => setCounts({}));
    } catch (e) {
      setError(errorText(e, `Couldn't load ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [resource, countKey, title]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (row: MasterRow) => {
    setEditing(row);
    setName(row.name);
    setModalOpen(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      messageApi.error(`Enter a ${singular} name.`);
      return;
    }
    if (rows.some((r) => r.name.toLowerCase() === trimmed.toLowerCase() && r.id !== editing?.id)) {
      messageApi.error(`A ${singular} with this name already exists.`);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await resource.update(editing.id, { name: trimmed });
        setRows((cur) => cur.map((r) => (r.id === editing.id ? { ...r, ...updated, name: updated?.name ?? trimmed } : r)));
      } else {
        const created = await resource.create({ code: codeFromName(trimmed), name: trimmed });
        setRows((cur) => [...cur, created]);
      }
      setModalOpen(false);
    } catch (e) {
      messageApi.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: MasterRow) => {
    try {
      await resource.deactivate(row.id);
      setRows((cur) => cur.filter((r) => r.id !== row.id));
    } catch (e) {
      messageApi.error(errorText(e));
    }
  };

  return (
    <div className="manage-categories-page">
      {contextHolder}
      <div className="manage-categories-heading">
        <h1>{title}</h1>
        <Can any={countKey === "byBrand" ? "BRAND_MANAGE" : "CATEGORY_MANAGE"}><Button className="manage-add-category" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add {singular.charAt(0).toUpperCase() + singular.slice(1)}
        </Button></Can>
      </div>
      <LiveState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyText={`No ${title.toLowerCase()} yet.`}
        loadingText={`Loading ${title.toLowerCase()}…`}
        onRetry={load}
      >
        <div className="category-card-grid">
          {rows.map((row, i) => (
            <article className="category-card" key={row.id}>
              <span className="category-color-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <strong className="category-name">{row.name}</strong>
              <span className="category-item-count">{counts[row.code] ?? 0} items</span>
              <div className="category-card-actions">
                <Can any={countKey === "byBrand" ? "BRAND_MANAGE" : "CATEGORY_MANAGE"}><button type="button" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
                  <EditOutlined />
                </button></Can>
                <Can any={countKey === "byBrand" ? "BRAND_MANAGE" : "CATEGORY_MANAGE"}><Popconfirm
                  title={`Remove ${singular}?`}
                  description={`${row.name} will be hidden from the lists.`}
                  okText="Remove"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => remove(row)}
                >
                  <button type="button" className="category-delete-action" aria-label={`Remove ${row.name}`}>
                    <DeleteOutlined />
                  </button>
                </Popconfirm></Can>
              </div>
            </article>
          ))}
        </div>
      </LiveState>
      <Modal
        title={editing ? `Edit ${singular}` : `Add ${singular}`}
        open={modalOpen}
        onOk={save}
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save changes" : `Add ${singular}`}
        destroyOnHidden
      >
        <label className="category-modal-label" htmlFor="master-name">
          {singular.charAt(0).toUpperCase() + singular.slice(1)} name
        </label>
        <Input id="master-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} onPressEnter={save} placeholder={placeholder} />
      </Modal>
    </div>
  );
}
