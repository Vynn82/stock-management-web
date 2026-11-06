"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal, Table } from "antd";
import { ArrowLeftOutlined, EditOutlined, HistoryOutlined, PlusOutlined, QrcodeOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { Pill } from "@/components/customer-orders/co-ui";
import { LiveState, errorText } from "@/components/common/live-state";
import { usePermission } from "@/hooks/use-permission";
import { fetchProduct, type ProductDetail, type StockStatus } from "@/features/products/products-live.api";

const TONE = { "In stock": "ok", "Low stock": "warn", "Out of stock": "bad" } as const;
const price = (n: number | null) => (n == null ? "—" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

const card: React.CSSProperties = { padding: 20, borderRadius: 16 };
const caption: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase" };
const divider: React.CSSProperties = { borderTop: "1px solid var(--border, rgba(114,117,139,0.2))", margin: "14px 0" };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 3, fontSize: 14, fontWeight: 600, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="panel-card" style={{ ...card, padding: "16px 20px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 24, fontWeight: 800, color: tone }}>{value}</div>
    </div>
  );
}

function Qr({ code, title, size }: { code: string; title: string; size: number }) {
  const show = () =>
    Modal.info({
      title,
      icon: null,
      centered: true,
      okText: "Close",
      content: (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ display: "inline-block", background: "#fff", padding: 10, borderRadius: 12 }}>
            <QRCodeSVG value={code} size={240} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <div style={{ marginTop: 10, fontWeight: 800, color: "var(--purple)" }}>{code}</div>
        </div>
      ),
    });
  return (
    <button
      type="button"
      onClick={show}
      style={{ display: "flex", alignItems: "center", gap: 14, background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left", color: "inherit", font: "inherit" }}
    >
      <span style={{ background: "#fff", padding: 6, borderRadius: 10, display: "inline-flex" }}>
        <QRCodeSVG value={code} size={size} bgColor="#ffffff" fgColor="#000000" />
      </span>
      <span>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--purple)" }}>{code}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Scan with the mobile app&apos;s Scan tab to open this item</div>
      </span>
    </button>
  );
}

export default function ProductDetailPage({ productId }: { productId: string }) {
  const router = useRouter();
  const { can } = usePermission();
  const [p, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setProduct(await fetchProduct(productId));
    } catch (e) {
      setError(errorText(e, "Could not load this product."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const cost = p ? (p.hasVariants ? p.variants.reduce((s, v) => s + (v.costPrice ?? 0) * v.quantity, 0) : p.costPrice * p.quantity) : 0;

  return (
    <div className="page-content data-page">
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
        <Button
          shape="circle"
          size="middle"
          icon={<ArrowLeftOutlined />}
          aria-label="Back to products"
          onClick={() => router.push("/products")}
        />
        <Link href="/products" style={{ color: "var(--muted)", fontWeight: 600, textDecoration: "none" }}>
          Products
        </Link>
        <span aria-hidden="true" style={{ color: "var(--muted)", opacity: 0.6 }}>
          /
        </span>
        <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "50vw" }}>
          {p?.name ?? "Product"}
        </span>
      </nav>

      <LiveState loading={loading} error={error} onRetry={load}>
        {p && (
          <>
            {/* Title + actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", margin: "10px 0 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" width={64} height={64} style={{ borderRadius: 16, objectFit: "cover" }} />
                ) : (
                  <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(124,58,237,0.12)", display: "grid", placeItems: "center", color: "var(--purple)", fontWeight: 800, fontSize: 24 }}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {p.name} <Pill tone={TONE[p.status as StockStatus]}>{p.status}</Pill>
                  </h1>
                  <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                    SKU: {p.sku || "—"}
                    {[p.brand, p.category].some((v) => v && v !== "—") && ` · ${[p.brand, p.category].filter((v) => v && v !== "—").join(" • ")}`}
                    {!p.isActive && " · Deactivated"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {can("PRODUCT_EDIT") && (
                  <Button icon={<EditOutlined />} onClick={() => router.push(`/products/${p.id}/edit`)}>
                    Edit
                  </Button>
                )}
                {can("ADJUSTMENT_VIEW") && (
                  <Button icon={<HistoryOutlined />} onClick={() => router.push("/stock/history")}>
                    Stock history
                  </Button>
                )}
                <Button onClick={() => router.push(`/stock/${p.id}`)}>Open in Stock</Button>
                {can("STOCK_ADJUST") && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push(`/stock/${p.id}/adjust`)}>
                    Adjust stock
                  </Button>
                )}
              </div>
            </div>

            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 16 }}>
              <Kpi label="On hand" value={`${p.quantity.toLocaleString("en-US")} ${p.unit}`} />
              <Kpi label="Cost price" value={price(p.hasVariants ? null : p.costPrice)} />
              <Kpi label="Sale price" value={price(p.hasVariants ? null : p.sellingPrice)} tone="#16A34A" />
              <Kpi label="Total cost value" value={price(cost)} tone="var(--purple)" />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
              {/* Left: details + stock tables (2/3 on wide screens) */}
              <div style={{ display: "grid", gap: 16, flex: "2 1 560px", minWidth: 0 }}>
                <div className="panel-card" style={card}>
                  <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Product details</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "18px 28px" }}>
                    <Field label="Product code" value={p.code || "—"} />
                    <Field label="SKU" value={p.sku || "—"} />
                    <Field label="Barcode" value={p.barcode || "—"} />
                    <Field label="Category" value={p.category} />
                    <Field label="Brand" value={p.brand} />
                    <Field label="Supplier" value={p.supplier} />
                    <Field label="Unit" value={p.unit || "—"} />
                    <Field label="Min stock" value={p.minimumStock} />
                    <Field label="Max stock" value={p.maximumStock ?? "—"} />
                  </div>
                  {p.description && (
                    <>
                      <div style={divider} />
                      <Field label="Description" value={<span style={{ fontWeight: 500, color: "var(--muted)" }}>{p.description}</span>} />
                    </>
                  )}
                </div>

                {p.hasVariants && (
                  <div className="panel-card" style={card}>
                    <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Variants ({p.variants.length})</h2>
                    <Table
                      rowKey="id"
                      size="middle"
                      pagination={false}
                      dataSource={p.variants}
                      columns={[
                        { title: "VARIANT", dataIndex: "name", render: (v: string, r) => (<div><strong>{v}</strong><div style={{ color: "var(--muted)", fontSize: 12 }}>{r.sku}{r.attributes ? ` · ${r.attributes}` : ""}</div></div>) },
                        { title: "COST", dataIndex: "costPrice", align: "right", render: (v: number | null) => price(v) },
                        { title: "PRICE", dataIndex: "sellingPrice", align: "right", render: (v: number | null) => price(v) },
                        { title: "STOCK", dataIndex: "quantity", align: "right" },
                        { title: "COST VALUE", key: "value", align: "right", render: (_: unknown, r) => (r.costPrice == null ? "—" : price(r.costPrice * r.quantity)) },
                      ]}
                    />
                  </div>
                )}

                <div className="panel-card" style={card}>
                  <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Stock by warehouse</h2>
                  <Table
                    rowKey={(w) => w.code || w.name}
                    size="middle"
                    pagination={false}
                    dataSource={p.warehouseStocks}
                    locale={{ emptyText: "No stock recorded yet." }}
                    columns={[
                      { title: "WAREHOUSE", dataIndex: "name", render: (v: string) => <strong>{v}</strong> },
                      { title: "CODE", dataIndex: "code", render: (v: string) => v || "—" },
                      { title: "LOCATION", dataIndex: "location", render: (v: string) => v || "—" },
                      { title: "QUANTITY", dataIndex: "quantity", align: "right", render: (v: number) => <strong>{v}</strong> },
                    ]}
                  />
                </div>
              </div>

              {/* Right: QR codes */}
              {(p.sku || p.variants.some((v) => v.sku)) && (
                <div className="panel-card" style={{ ...card, flex: "1 1 280px", minWidth: 0 }}>
                  <div style={{ ...caption, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <QrcodeOutlined style={{ color: "var(--purple)", fontSize: 16 }} /> QR code
                  </div>
                  <div style={{ display: "grid", gap: 18 }}>
                    {p.sku && <Qr code={p.sku} title={p.name} size={110} />}
                    {p.variants
                      .filter((v) => v.sku)
                      .map((v) => (
                        <Qr key={v.id} code={v.sku} title={v.name} size={90} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </LiveState>
    </div>
  );
}
