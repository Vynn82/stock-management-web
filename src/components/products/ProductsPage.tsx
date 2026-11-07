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

const STATUS_TONE = { "In stock": "ok", "Low stock": "warn", "Out of stock": "bad" } as const;

export default function ProductsPage() {
  const router = useRouter();
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
      setError(err instanceof ApiError ? err.message : "Could not load products.");
    } finally {
      setLoading(false);
    }
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
      title: `Deactivate ${row.name}?`,
      content: "It will be hidden from stock lists. Its history is kept.",
      okText: "Deactivate",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateProduct(row.id);
          setRows((cur) => cur.filter((r) => r.id !== row.id));
          messageApi.success("Product deactivated.");
        } catch (err) {
          messageApi.error(err instanceof ApiError ? err.message : "Could not deactivate the product.");
        }
      },
    });
  }

  return (
    <div className="page-content data-page">
      {holder}
      <ProductImportModal open={importOpen} onClose={() => setImportOpen(false)} onDone={() => { messageApi.success("Products imported."); void load(); }} />
      <div className="page-heading">
        <h1>Products</h1>
        <p>Manage your inventory and keep stock levels healthy.</p>
      </div>
      <div className="panel-card">
        <div className="data-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search name, SKU, category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All status" },
              { value: "In stock", label: "In stock" },
              { value: "Low stock", label: "Low stock" },
              { value: "Out of stock", label: "Out of stock" },
            ]}
          />
          <Select
            showSearch
            optionFilterProp="label"
            value={category}
            onChange={setCategory}
            options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Refresh
          </Button>
          <Can any={"PRODUCT_IMPORT"}><Button onClick={() => setImportOpen(true)}>
            Import Excel
          </Button></Can>
          <Can any={"PRODUCT_CREATE"}><Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/products/create")}>
            Create product
          </Button></Can>
        </div>

        {error && !rows.length ? (
          <div className="empty-state" role="alert" style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", marginBottom: 12 }}>{error}</p>
            <Button onClick={load}>Try again</Button>
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
            locale={{ emptyText: rows.length ? "No products match your filters." : "No products yet. Create your first one." }}
            columns={[
              {
                title: "PRODUCT",
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
                        {r.hasVariants ? " · variants" : ""}
                      </div>
                    </div>
                  </div>
                ),
              },
              { title: "CATEGORY", dataIndex: "category" },
              { title: "BRAND", dataIndex: "brand" },
              { title: "WAREHOUSE", dataIndex: "warehouses" },
              { title: "STOCK", dataIndex: "quantity", sorter: (a, b) => a.quantity - b.quantity },
              {
                title: "STATUS",
                dataIndex: "status",
                render: (v: StockStatus) => <Pill tone={STATUS_TONE[v]}>{v}</Pill>,
              },
              { title: "PRICE", dataIndex: "price", sorter: (a, b) => a.price - b.price, render: (v: number) => `$${v.toFixed(2)}` },
              {
                title: "",
                key: "actions",
                width: 56,
                render: (_: unknown, r) => (
                  <Can any={"PRODUCT_UPDATE"}><Button type="text" danger aria-label={`Deactivate ${r.name}`} icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); confirmDeactivate(r); }} /></Can>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
