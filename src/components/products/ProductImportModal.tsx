"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Modal, Table, Upload } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { ApiError } from "@/features/live/http";
import { downloadProductTemplate, importProducts, previewProductImport, type ImportPreview } from "@/features/products/products-live.api";

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export default function ProductImportModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setError("");
    }
  }, [open]);

  const check = async (f: File) => {
    setFile(f);
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      setPreview(await previewProductImport(f));
    } catch (e) {
      setError(errText(e, "Couldn't read that file."));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      await importProducts(file);
      onDone();
      onClose();
    } catch (e) {
      setError(errText(e, "The import failed. Nothing was saved."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={860}
      title="Import products from Excel"
      okText={`Import ${preview?.count ?? ""} product${preview?.count === 1 ? "" : "s"}`.replace("  ", " ")}
      okButtonProps={{ disabled: !preview?.ok || !preview.count, loading: saving }}
      onOk={confirm}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Button icon={<DownloadOutlined />} onClick={() => downloadProductTemplate().catch((e) => setError(errText(e, "Couldn't download the template.")))}>
          Download template
        </Button>
        <Upload
          accept=".xlsx,.xls,.csv"
          maxCount={1}
          showUploadList={false}
          beforeUpload={(f) => {
            void check(f as unknown as File);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} loading={busy}>
            {file ? `Change file (${file.name})` : "Choose file"}
          </Button>
        </Upload>
      </div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
      {preview && !preview.ok && (
        <Alert
          type="error"
          message={preview.message || "The file has problems."}
          description={preview.errors && preview.errors.length > 1 ? <ul style={{ margin: 0, paddingLeft: 18 }}>{preview.errors.slice(0, 20).map((m, i) => <li key={i}>{m}</li>)}</ul> : undefined}
        />
      )}
      {preview?.ok && (
        <Table
          size="small"
          rowKey={(r) => r.code}
          dataSource={preview.rows ?? []}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          scroll={{ x: 700 }}
          columns={[
            { title: "Name", dataIndex: "name" },
            { title: "SKU", dataIndex: "sku", width: 110 },
            { title: "Category", dataIndex: "category", width: 120 },
            { title: "Variants", dataIndex: "variantCount", width: 80 },
            { title: "Warehouse", dataIndex: "warehouses", width: 120 },
            { title: "Qty", dataIndex: "quantity", width: 70 },
          ]}
        />
      )}
    </Modal>
  );
}
