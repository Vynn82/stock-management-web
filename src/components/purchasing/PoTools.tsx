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

/** Who a product was bought from, at what price and how fast. */
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

  return (
    <Modal open={Boolean(productId)} onCancel={onClose} footer={null} width={900} title={`Compare suppliers — ${productLabel}`}>
      {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
      <Table<SupplierOption>
        size="small"
        rowKey="supplierId"
        loading={loading}
        dataSource={rows}
        pagination={false}
        locale={{ emptyText: "This product has not been bought from anyone yet." }}
        scroll={{ x: 760 }}
        columns={[
          { title: "Supplier", render: (_, r) => <span>{r.name} {r.isDefault && <Tag color="purple">Default</Tag>}</span> },
          { title: "Orders", dataIndex: "timesOrdered", width: 70 },
          { title: "Last price", render: (_, r) => money(r.lastPrice), width: 95 },
          { title: "Lowest", render: (_, r) => money(r.lowestPrice), width: 90 },
          { title: "Avg lead", render: (_, r) => (r.averageLeadDays === null ? "—" : `${r.averageLeadDays} d`), width: 85 },
          { title: "Fill rate", render: (_, r) => (r.fillRate === null ? "—" : `${r.fillRate}%`), width: 80 },
          { title: "Rating", render: (_, r) => (r.averageRating === null ? "—" : `${r.averageRating} ★`), width: 75 },
          { title: "Issues", render: (_, r) => (r.damagedQuantity + r.wrongQuantity > 0 ? <Tag color="red">{r.damagedQuantity + r.wrongQuantity}</Tag> : "—"), width: 70 },
          { title: "", width: 90, render: (_, r) => <Button size="small" type="primary" onClick={() => onPick(r)}>Use</Button> },
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
  onAdd: (rows: ImportRow[]) => void;
}) {
  const [result, setResult] = useState<{ rows: ImportRow[]; validCount: number; errorCount: number } | null>(null);
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={820}
      title="Import products from Excel"
      okText={`Add ${existing.length} line${existing.length === 1 ? "" : "s"}`}
      okButtonProps={{ disabled: existing.length === 0 }}
      onOk={() => {
        onAdd(existing);
        onClose();
      }}
    >
      <p style={{ color: "#6B7280", marginTop: 0 }}>
        Columns: <code>product_code</code>, <code>variant_code</code> (if the product has variants), <code>quantity</code>, <code>unit_price</code>.
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

