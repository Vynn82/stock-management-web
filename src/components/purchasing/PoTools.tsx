"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Modal, Table, Tag, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ApiError } from "@/features/live/http";
import {
  fetchReorder,
  fetchSupplierHistory,
  previewPoImport,
  type ImportRow,
  type PoImportResult,
  type ReorderItem,
  type SupplierOption,
} from "@/features/purchasing/purchasing-live";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Products at or below minimum stock, with a suggested quantity to order. */
export function ReorderModal({
  open,
  warehouseCode,
  onClose,
  onAdd,
}: {
  open: boolean;
  warehouseCode: string;
  onClose: () => void;
  onAdd: (items: ReorderItem[]) => void;
}) {
  const [rows, setRows] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    setSelected([]);
    fetchReorder(warehouseCode || undefined)
      .then(setRows)
      .catch((e) => setError(errText(e, "Couldn't load reorder suggestions.")))
      .finally(() => setLoading(false));
  }, [open, warehouseCode]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Reorder suggestions"
      width={820}
      okText={`Add ${selected.length || ""} to order`.trim()}
      okButtonProps={{ disabled: selected.length === 0 }}
      onOk={() => {
        onAdd(rows.filter((r) => selected.includes(r.productId)));
        onClose();
      }}
    >
      {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
      <Table<ReorderItem>
        size="small"
        rowKey="productId"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 8, hideOnSinglePage: true }}
        locale={{ emptyText: "Nothing is below its minimum stock." }}
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys as string[]),
          getCheckboxProps: (r) => ({ disabled: r.covered }),
        }}
        columns={[
          { title: "Product", render: (_, r) => <span>{r.name}<br /><small style={{ color: "#6B7280" }}>{r.code}</small></span> },
          { title: "Stock", dataIndex: "stock", width: 70 },
          { title: "Min", dataIndex: "minimumStock", width: 60 },
          { title: "On order", dataIndex: "onOrder", width: 80 },
          { title: "Suggested", dataIndex: "suggestedQuantity", width: 90 },
          {
            title: "Status",
            width: 130,
            render: (_, r) =>
              r.covered ? <Tag color="green">Already covered</Tag> : r.status === "OUT" ? <Tag color="red">Out of stock{r.hasVariants ? " · variants" : ""}</Tag> : <Tag color="orange">Low{r.hasVariants ? " · variants" : ""}</Tag>,
          },
        ]}
      />
    </Modal>
  );
}

export type SupplierTag = { label: string; color: string };

const hasHistory = (o: SupplierOption) => o.timesOrdered > 0;
const problems = (o: SupplierOption) => o.damagedQuantity + o.wrongQuantity;

/** Dependable: delivers (almost) everything, rated 4+ and no damaged / wrong units. */
export const isReliable = (o: SupplierOption) =>
  hasHistory(o) && o.fillRate !== null && o.fillRate >= 95 && o.averageRating !== null && o.averageRating >= 4 && problems(o) === 0;

/** A tag only means something when there is someone to compare with (same rule as the mobile app). */
export function supplierTags(rows: SupplierOption[]): Map<string, SupplierTag[]> {
  const out = new Map<string, SupplierTag[]>();
  const add = (code: string, tag: SupplierTag) => out.set(code, [...(out.get(code) ?? []), tag]);
  const withHistory = rows.filter(hasHistory);
  const unique = (list: SupplierOption[], value: (o: SupplierOption) => number, lowest: boolean) => {
    if (list.length < 2) return null;
    const best = list.reduce((a, b) => ((lowest ? value(b) < value(a) : value(b) > value(a)) ? b : a));
    return list.filter((o) => value(o) === value(best)).length === 1 ? best.code : null;
  };
  const best = unique(withHistory, (o) => o.lastPrice, true);
  const fastest = unique(withHistory.filter((o) => o.averageLeadDays !== null), (o) => o.averageLeadDays as number, true);
  const most = unique(withHistory, (o) => o.timesOrdered, false);
  for (const o of rows) {
    if (isReliable(o)) add(o.code, { label: "Reliable", color: "green" });
    if (o.code === best) add(o.code, { label: "Best price", color: "green" });
    if (o.code === fastest) add(o.code, { label: "Fastest", color: "purple" });
    if (o.code === most) add(o.code, { label: "Most ordered", color: "purple" });
    if (o.isDefault) add(o.code, { label: "Usual supplier", color: "default" });
  }
  return out;
}

/** The supplier to suggest: a reliable one (best rated first), else the best rated / cheapest with history. */
export function recommendedSupplier(rows: SupplierOption[]): SupplierOption | null {
  const pool = rows.filter(hasHistory);
  if (pool.length === 0) return null;
  const reliable = pool.filter(isReliable);
  const list = reliable.length ? reliable : pool;
  return [...list].sort(
    (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || a.lastPrice - b.lastPrice || b.timesOrdered - a.timesOrdered,
  )[0];
}

export function RatingText({ o }: { o: SupplierOption }) {
  if (o.averageRating === null) return <span style={{ color: "#9CA3AF" }}>Not rated</span>;
  return (
    <span>
      <span style={{ color: "#F59E0B" }}>★</span> {o.averageRating.toFixed(1)}
      {o.ratingCount ? <small style={{ color: "#6B7280" }}> ({o.ratingCount})</small> : null}
    </span>
  );
}

/** Who a product was bought from, at what price and how fast, with a recommended pick. */
export function SupplierCompareModal({
  productId,
  productLabel,
  onClose,
  onPick,
}: {
  productId: string | null;
  productLabel: string;
  onClose: () => void;
  onPick: (s: SupplierOption) => void;
}) {
  const [rows, setRows] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError("");
    fetchSupplierHistory(productId)
      .then(setRows)
      .catch((e) => setError(errText(e, "Couldn't load supplier history.")))
      .finally(() => setLoading(false));
  }, [productId]);

  const tags = supplierTags(rows);
  const recommended = recommendedSupplier(rows);
  const sorted = [...rows].sort((a, b) => Number(b.code === recommended?.code) - Number(a.code === recommended?.code));

  return (
    <Modal open={Boolean(productId)} onCancel={onClose} footer={null} width={960} title={`Supplier recommendation — ${productLabel}`}>
      {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
      {recommended && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            <span>
              Recommended: <strong>{recommended.name}</strong> — {money(recommended.lastPrice)}
              {recommended.averageRating !== null && <> · ★ {recommended.averageRating.toFixed(1)}</>}
              {recommended.fillRate !== null && <> · {recommended.fillRate}% delivered</>}
            </span>
          }
          action={<Button size="small" type="primary" onClick={() => onPick(recommended)}>Use</Button>}
        />
      )}
      <Table<SupplierOption>
        size="small"
        rowKey="supplierId"
        loading={loading}
        dataSource={sorted}
        pagination={false}
        locale={{ emptyText: "This product has not been bought from anyone yet." }}
        scroll={{ x: 820 }}
        columns={[
          {
            title: "Supplier",
            render: (_, r) => (
              <span>
                <strong>{r.name}</strong>
                {r.code === recommended?.code && <Tag color="gold" style={{ marginLeft: 6 }}>Recommended</Tag>}
                <br />
                {(tags.get(r.code) ?? []).map((t) => (
                  <Tag key={t.label} color={t.color} style={{ marginTop: 4 }}>{t.label}</Tag>
                ))}
                {!hasHistory(r) && <small style={{ color: "#6B7280" }}>No orders yet</small>}
              </span>
            ),
          },
          { title: "Orders", dataIndex: "timesOrdered", width: 70 },
          { title: "Last price", render: (_, r) => money(r.lastPrice), width: 95 },
          { title: "Lowest", render: (_, r) => money(r.lowestPrice), width: 90 },
          { title: "Avg lead", render: (_, r) => (r.averageLeadDays === null ? "—" : `${r.averageLeadDays} d`), width: 85 },
          { title: "Fill rate", render: (_, r) => (r.fillRate === null ? "—" : `${r.fillRate}%`), width: 80 },
          { title: "Rating", render: (_, r) => <RatingText o={r} />, width: 110 },
          { title: "Issues", render: (_, r) => (problems(r) > 0 ? <Tag color="red">{problems(r)}</Tag> : "—"), width: 70 },
          { title: "", width: 80, render: (_, r) => <Button size="small" type={r.code === recommended?.code ? "primary" : "default"} onClick={() => onPick(r)}>Use</Button> },
        ]}
      />
    </Modal>
  );
}

/** Reads an Excel / CSV file on the server and lists what it found, row by row. */
export function ImportModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (rows: ImportRow[], order: { supplierCode?: string; warehouseCode?: string }) => void;
}) {
  const [result, setResult] = useState<PoImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setResult(null);
      setError("");
    }
  }, [open]);

  const existing = (result?.rows ?? []).filter((r) => !r.error);
  const newOnes = existing.filter((r) => r.isNew).length;
  const headerErrors = result?.headerErrors ?? [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={820}
      title="Import products from Excel"
      okText={`Add ${existing.length} line${existing.length === 1 ? "" : "s"}`}
      okButtonProps={{ disabled: existing.length === 0 || headerErrors.length > 0 }}
      onOk={() => {
        onAdd(existing, { supplierCode: result?.supplier?.code, warehouseCode: result?.warehouse?.code });
        onClose();
      }}
    >
      <p style={{ color: "#6B7280", marginTop: 0 }}>
        Columns: <code>product_code</code>, <code>variant_code</code> (if the product has variants), <code>quantity</code>, <code>unit_price</code>; optional <code>supplier_code</code> and <code>warehouse_code</code> fill the order's supplier and warehouse.
      </p>
      <Upload
        accept=".xlsx,.xls,.csv"
        maxCount={1}
        showUploadList={false}
        beforeUpload={(file) => {
          setBusy(true);
          setError("");
          previewPoImport(file as unknown as File)
            .then(setResult)
            .catch((e) => {
              setResult(null);
              setError(errText(e, "Couldn't read that file."));
            })
            .finally(() => setBusy(false));
          return false;
        }}
      >
        <Button icon={<UploadOutlined />} loading={busy}>Choose file</Button>
      </Upload>
      {error && <Alert type="error" message={error} style={{ marginTop: 12 }} />}
      {result && (
        <>
          {headerErrors.map((m) => (
            <Alert key={m} type="error" showIcon message={m} style={{ marginTop: 12 }} />
          ))}
          {(result.supplier || result.warehouse) && headerErrors.length === 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 12 }}
              message={
                <span>
                  The file sets {result.supplier && <>supplier <strong>{result.supplier.name}</strong></>}
                  {result.supplier && result.warehouse && " and "}
                  {result.warehouse && <>warehouse <strong>{result.warehouse.name}</strong></>} for this order.
                </span>
              }
            />
          )}
          <p style={{ margin: "12px 0" }}>
            <Tag color="green">{result.validCount} valid</Tag>
            {result.errorCount > 0 && <Tag color="red">{result.errorCount} with errors</Tag>}
            {newOnes > 0 && <Tag color="purple">{newOnes} new product(s) — created when the goods are received</Tag>}
          </p>
          <Table<ImportRow>
            size="small"
            rowKey="row"
            dataSource={result.rows}
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            columns={[
              { title: "Row", dataIndex: "row", width: 55 },
              { title: "Product", render: (_, r) => ([r.productName ?? r.productCode, r.variantName].filter(Boolean).join(" — ") || "—") + (r.isNew ? " (new)" : "") },
              { title: "Qty", dataIndex: "quantity", width: 70 },
              { title: "Unit price", render: (_, r) => (r.unitPrice === null ? "—" : money(r.unitPrice)), width: 95 },
              { title: "Result", width: 220, render: (_, r) => (r.error ? <span style={{ color: "#DC2626" }}>{r.error}</span> : <Tag color="green">OK</Tag>) },
            ]}
          />
        </>
      )}
    </Modal>
  );
}

