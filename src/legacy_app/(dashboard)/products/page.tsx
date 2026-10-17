"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Tag,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Space,
  Badge,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ProductTable } from "@/features/products/components/product-table";
import { Product } from "@/features/products/products.types";
import { Table, Column } from "@/components/ui/table";
import {
  getRequests,
  commitRequest,
  importRequestsFile,
  getImportTemplate,
} from "@/features/requests/requests.api";
import { InventoryRequest } from "@/features/requests/requests.types";
import { ROUTES } from "@/lib/constants";

const INITIAL_CATALOG: Product[] = [
  {
    id: "prod-1",
    sku: "IP15",
    name: "iPhone 15",
    category: "SMARTPHONE",
    price: 799.0,
    stock: 80,
    status: "active",
  },
  {
    id: "prod-2",
    sku: "PRD-001",
    name: "Industrial Thermal Label Printer",
    category: "HARDWARE",
    price: 429.99,
    stock: 18,
    status: "active",
  },
  {
    id: "prod-3",
    sku: "PRD-002",
    name: "Handheld 2D Barcode Scanner",
    category: "HARDWARE",
    price: 89.5,
    stock: 45,
    status: "active",
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_CATALOG);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [search, setSearch] = useState("");

  // Commit Modal
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<InventoryRequest | null>(null);
  const [commitForm] = Form.useForm();
  const [committing, setCommitting] = useState(false);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await getRequests();
      setRequests(data);
    } catch {
      message.error("Failed to load product requests.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCommit(req: InventoryRequest) {
    setSelectedRequest(req);
    commitForm.resetFields();
    commitForm.setFieldsValue({
      action: "APPROVE",
      remark: "Everything is correct",
    });
    setIsCommitModalOpen(true);
  }

  async function handleCommitFinish(values: any) {
    if (!selectedRequest) return;
    setCommitting(true);
    try {
      await commitRequest(selectedRequest.id, {
        action: values.action,
        remark: values.remark,
      });
      message.success(
        `Request ${values.action === "APPROVE" ? "approved" : "rejected"} successfully.`,
      );

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: values.action === "APPROVE" ? "APPROVED" : "REJECTED",
                remark: values.remark,
              }
            : r,
        ),
      );

      // If approved, update catalog
      if (values.action === "APPROVE" && selectedRequest.product) {
        const totalQty = (selectedRequest.stock || []).reduce(
          (acc, item) => acc + (Number(item.quantity) || 0),
          0,
        );
        const newProd: Product = {
          id: selectedRequest.id,
          sku:
            selectedRequest.product.productSku ||
            selectedRequest.product.productCode,
          name: selectedRequest.product.productName,
          category: selectedRequest.product.categoryCode || "GENERAL",
          price: selectedRequest.variants?.[0]?.variantSellingPrice || 0,
          stock: totalQty,
          status: "active",
        };
        setProducts((prev) => [newProd, ...prev]);
      }

      setIsCommitModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || "Failed to commit request.");
    } finally {
      setCommitting(false);
    }
  }

  async function handleImportExcel() {
    if (importFileList.length === 0) {
      message.warning("Please select an Excel file (.xlsx) to import.");
      return;
    }
    setImporting(true);
    try {
      const file = importFileList[0].originFileObj || importFileList[0];
      await importRequestsFile(file);
      message.success("Product intake requests imported successfully.");
      setIsImportModalOpen(false);
      setImportFileList([]);
      loadRequests();
    } catch (err: any) {
      message.error(err?.message || "Failed to import Excel file.");
    } finally {
      setImporting(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      await getImportTemplate();
      message.info("Template download initiated.");
      const blob = new Blob(
        [
          "ProductCode,ProductName,CategoryCode,BrandCode,VariantCode,VariantName,CostPrice,SellingPrice,WarehouseCode,Quantity\nIP15,iPhone 15,SMARTPHONE,APPLE,IP15-BLK-128,Black / 128GB,700,799,WH001,50\nIP15,iPhone 15,SMARTPHONE,APPLE,IP15-BLU-256,Blue / 256GB,780,899,WH001,30\n",
        ],
        { type: "text/csv;charset=utf-8;" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "PRODUCT_CREATE_Template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      message.error("Failed to fetch template.");
    }
  }

  function getStatusTag(status?: string) {
    switch ((status || "").toUpperCase()) {
      case "APPROVED":
      case "COMMITTED":
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            APPROVED
          </Tag>
        );
      case "REJECTED":
        return (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            REJECTED
          </Tag>
        );
      case "PENDING":
      default:
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            PENDING
          </Tag>
        );
    }
  }

  const filteredRequests = requests.filter((r) => {
    const q = search.toLowerCase();
    const prodName = r.product?.productName?.toLowerCase() || "";
    const prodCode = r.product?.productCode?.toLowerCase() || "";
    const reqType = r.requestType?.toLowerCase() || "";
    const st = r.status?.toLowerCase() || "";
    return (
      prodName.includes(q) ||
      prodCode.includes(q) ||
      reqType.includes(q) ||
      st.includes(q)
    );
  });

  const requestColumns: Column<InventoryRequest>[] = [
    {
      key: "product",
      header: "Product / Request",
      render: (r) => (
        <div>
          <div
            style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 14 }}
          >
            {r.product?.productName || "Product Intake"}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <Tag color="purple" style={{ fontSize: 11 }}>
              {r.product?.productCode || "CODE"}
            </Tag>
            {r.product?.categoryCode && (
              <Tag color="geekblue" style={{ fontSize: 11 }}>
                {r.product.categoryCode}
              </Tag>
            )}
            {r.product?.brandCode && (
              <Tag color="blue" style={{ fontSize: 11 }}>
                {r.product.brandCode}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "variants",
      header: "Variants & Stock",
      render: (r) => {
        const variantCount = r.variants?.length || 0;
        const totalStock = (r.stock || []).reduce(
          (acc, s) => acc + (Number(s.quantity) || 0),
          0,
        );
        return (
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-main)",
              }}
            >
              {variantCount} variant{variantCount !== 1 ? "s" : ""}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              Intake Quantity: <strong>{totalStock} units</strong>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Approval Status",
      width: 140,
      render: (r) => getStatusTag(r.status),
    },
    {
      key: "approvers",
      header: "Approvers & Signoff",
      render: (r) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {r.approvers && r.approvers.length > 0 ? (
            r.approvers.map((app, i) => (
              <span key={i} style={{ fontSize: 11.5 }}>
                <Badge
                  status={app.status === "APPROVED" ? "success" : "processing"}
                  text={`${app.actionType}: ${app.status || "PENDING"}`}
                />
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Standard Intake
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: 130,
      render: (r) => (
        <div>
          {r.status === "PENDING" ? (
            <Button
              type="primary"
              size="small"
              onClick={() => handleOpenCommit(r)}
              style={{
                backgroundColor: "var(--brand-600)",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Review / Commit
            </Button>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {r.remark ? `“${r.remark}”` : "Completed"}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            Products & Inventory
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Manage product intake approval workflow, multi-variants, warehouse
            allocation, and live stock.
          </p>
        </div>

        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            style={{ height: 42, borderRadius: 10, fontWeight: 600 }}
          >
            Template
          </Button>

          <Button
            icon={<UploadOutlined />}
            onClick={() => setIsImportModalOpen(true)}
            style={{ height: 42, borderRadius: 10, fontWeight: 600 }}
          >
            Import Excel
          </Button>

          <Link href={ROUTES.PRODUCT_CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                backgroundColor: "var(--brand-600)",
                height: 42,
                borderRadius: 10,
                padding: "0 20px",
                fontWeight: 600,
              }}
            >
              New Product Request
            </Button>
          </Link>
        </Space>
      </div>

      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--card-shadow)",
          padding: 20,
        }}
      >
        <div style={{ marginBottom: 16, maxWidth: 360 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search products or requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "requests",
              label: (
                <span>
                  Intake Requests & Approvals{" "}
                  <Badge
                    count={
                      requests.filter((r) => r.status === "PENDING").length
                    }
                    style={{ backgroundColor: "var(--brand-600)" }}
                  />
                </span>
              ),
              children: (
                <Table
                  columns={requestColumns}
                  data={filteredRequests}
                  loading={loading}
                  emptyText="No pending intake requests found."
                />
              ),
            },
            {
              key: "inventory",
              label: "Current Catalog & Stock",
              children: (
                <ProductTable
                  products={products.filter(
                    (p) =>
                      p.name.toLowerCase().includes(search.toLowerCase()) ||
                      p.sku.toLowerCase().includes(search.toLowerCase()),
                  )}
                  onDelete={(id) =>
                    setProducts((prev) => prev.filter((p) => p.id !== id))
                  }
                />
              ),
            },
          ]}
        />
      </div>

      {/* Review & Commit Modal */}
      <Modal
        title={`Review Intake Request: ${selectedRequest?.product?.productName || "Product"}`}
        open={isCommitModalOpen}
        onCancel={() => setIsCommitModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={560}
      >
        {selectedRequest && (
          <div style={{ margin: "16px 0" }}>
            <div
              style={{
                backgroundColor: "rgba(124, 58, 237, 0.05)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                {selectedRequest.product?.productName} (
                {selectedRequest.product?.productCode})
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-sub)",
                  marginBottom: 4,
                }}
              >
                Category:{" "}
                <strong>{selectedRequest.product?.categoryCode}</strong> |
                Brand: <strong>{selectedRequest.product?.brandCode}</strong>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-sub)" }}>
                Variants:{" "}
                <strong>
                  {selectedRequest.variants
                    ?.map((v) => v.variantName)
                    .join(", ") || "None"}
                </strong>
              </div>
            </div>

            <Form
              form={commitForm}
              layout="vertical"
              onFinish={handleCommitFinish}
            >
              <Form.Item
                label="Commit Decision"
                name="action"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: "✅ APPROVE Intake", value: "APPROVE" },
                    { label: "❌ REJECT Intake", value: "REJECT" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Commit Remark / Review Notes"
                name="remark"
                rules={[{ required: true, message: "Please provide a remark" }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="e.g. Everything is correct"
                />
              </Form.Item>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <Button onClick={() => setIsCommitModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={committing}
                  style={{ backgroundColor: "var(--brand-600)" }}
                >
                  Confirm Commit
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Import Excel Modal */}
      <Modal
        title="Import Products & Stock from Excel"
        open={isImportModalOpen}
        onCancel={() => setIsImportModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <div style={{ margin: "20px 0" }}>
          <p
            style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 16 }}
          >
            Upload an Excel (.xlsx or .csv) file containing product intake
            definitions, variants, and stock allocations.
          </p>

          <Upload.Dragger
            maxCount={1}
            beforeUpload={(file) => {
              setImportFileList([file]);
              return false;
            }}
            fileList={importFileList}
            onRemove={() => setImportFileList([])}
          >
            <p className="ant-upload-drag-icon">
              <FileExcelOutlined style={{ fontSize: 48, color: "#10b981" }} />
            </p>
            <p className="ant-upload-text">
              Click or drag Excel file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Supports .xlsx and .csv formatted product catalogs
            </p>
          </Upload.Dragger>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleImportExcel}
              loading={importing}
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              Upload & Process
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
