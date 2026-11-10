"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Select, Table, message } from "antd";
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { ApiError } from "@/features/live/http";
import { ProductRow, StockStatus, deactivateProduct, fetchProducts } from "@/features/products/products-live.api";
import { Pill } from "@/components/customer-orders/co-ui";
import Can from "@/components/common/Can";
import ProductImportModal from "./ProductImportModal";
import { useT, useTx } from "@/lib/i18n";

const STATUS_TONE = { "In stock": "ok", "Low stock": "warn", "Out of stock": "bad" } as const;

export default function ProductsPage() {
  const router = useRouter();
  const t = useT();
  const tx = useTx();
  const [messageApi, holder] = message.useMessage();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StockStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchProducts());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("prod.loadFail"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter((c) => c !== "—"))).sort(), [rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (category === "all" || r.category === category) &&
        (!q || `${r.name} ${r.sku} ${r.category} ${r.brand}`.toLowerCase().includes(q)),
    );
  }, [rows, query, status, category]);

  function confirmDeactivate(row: ProductRow) {
    Modal.confirm({
      title: t("prod.deactivateTitle", { name: row.name }),
      content: t("prod.deactivateBody"),
      okText: t("prod.deactivate"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateProduct(row.id);
          setRows((cur) => cur.filter((r) => r.id !== row.id));
          messageApi.success(t("prod.deactivated"));
        } catch (err) {
          messageApi.error(err instanceof ApiError ? err.message : t("prod.deactivateFail"));
        }
      },
    });
  }

  return (
    <div className="page-content data-page">
      {holder}
      <ProductImportModal open={importOpen} onClose={() => setImportOpen(false)} onDone={() => { messageApi.success(t("prod.imported")); void load(); }} />
      <div className="page-heading">
        <h1>{t("prod.title")}</h1>
        <p>{t("prod.subtitle")}</p>
      </div>
      <div className="panel-card">
        <div className="data-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t("prod.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: t("prod.allStatus") },
              { value: "In stock", label: tx("stockStatus", "In stock") },
              { value: "Low stock", label: tx("stockStatus", "Low stock") },
              { value: "Out of stock", label: tx("stockStatus", "Out of stock") },
            ]}
          />
          <Select
            showSearch
            optionFilterProp="label"
            value={category}
            onChange={setCategory}
            options={[{ value: "all", label: t("prod.allCategories") }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            {t("common.refresh")}
          </Button>
          <Can any={"PRODUCT_IMPORT"}><Button onClick={() => setImportOpen(true)}>
            {t("prod.import")}
          </Button></Can>
          <Can any={"PRODUCT_CREATE"}><Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/products/create")}>
            {t("prod.create")}
          </Button></Can>
        </div>

        {error && !rows.length ? (
          <div className="empty-state" role="alert" style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", marginBottom: 12 }}>{error}</p>
            <Button onClick={load}>{t("common.tryAgain")}</Button>
          </div>
        ) : (
          <Table<ProductRow>
            rowKey="id"
            onRow={(r) => ({
              onClick: () => router.push(`/products/${r.id}`),
              style: { cursor: "pointer" },
            })}
            loading={loading}
            dataSource={shown}
            pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
            locale={{ emptyText: rows.length ? t("prod.noMatch") : t("prod.none") }}
            columns={[
              {
                title: t("col.product"),
                dataIndex: "name",
                render: (value: string, r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" width={36} height={36} style={{ borderRadius: 8, objectFit: "cover" }} />
                    ) : (
                      <span
                        aria-hidden="true"
                        style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(124,58,237,0.12)", display: "grid", placeItems: "center", color: "var(--purple)", fontWeight: 700 }}
                      >
                        {value.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <strong>{value}</strong>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {r.sku}
                        {r.hasVariants ? ` · ${t("prod.variants")}` : ""}
                      </div>
                    </div>
                  </div>
                ),
              },
              { title: t("col.category"), dataIndex: "category" },
              { title: t("col.brand"), dataIndex: "brand" },
              { title: t("col.warehouse"), dataIndex: "warehouses" },
              { title: t("col.stock"), dataIndex: "quantity", sorter: (a, b) => a.quantity - b.quantity },
              {
                title: t("col.status"),
                dataIndex: "status",
                render: (v: StockStatus) => <Pill tone={STATUS_TONE[v]}>{tx("stockStatus", v)}</Pill>,
              },
              { title: t("col.price"), dataIndex: "price", sorter: (a, b) => a.price - b.price, render: (v: number) => `$${v.toFixed(2)}` },
              {
                title: "",
                key: "actions",
                width: 56,
                render: (_: unknown, r) => (
                  <Can any={"PRODUCT_UPDATE"}><Button type="text" danger aria-label={`${t("prod.deactivate")} ${r.name}`} icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); confirmDeactivate(r); }} /></Can>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
