"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Tag,
  Modal,
  Input,
  Select,
  Upload,
  message,
  Space,
  Badge,
  Card,
  Row,
  Col,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Table, Column } from "@/components/ui/table";
import {
  getRequests,
  importRequestsFile,
  getImportTemplate,
} from "@/features/requests/requests.api";
import { InventoryRequest } from "@/features/requests/requests.types";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<InventoryRequest | null>(null);

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
      message.error("Failed to load your requests.");
    } finally {
      setLoading(false);
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
      message.error("Failed to download template.");
    }
  }

  function getStatusTag(status: string) {
    switch (status) {
      case "APPROVED":
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Approved
          </Tag>
        );
      case "REJECTED":
        return (
          <Tag
            icon={<CloseCircleOutlined />}
            color="error"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Rejected
          </Tag>
        );
      case "COMMITTED":
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="purple"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Committed
          </Tag>
        );
      default:
        return (
          <Tag
            icon={<ClockCircleOutlined />}
            color="processing"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Pending Review
          </Tag>
        );
    }
  }

  const filteredRequests = requests.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      (r.product?.productName || "").toLowerCase().includes(q) ||
      (r.product?.productCode || "").toLowerCase().includes(q) ||
      (r.product?.productSku || "").toLowerCase().includes(q) ||
      (r.product?.categoryCode || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || r.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter(
    (r) => r.status === "APPROVED" || r.status === "COMMITTED",
  ).length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const columns: Column<InventoryRequest>[] = [
    {
      key: "id",
      header: "Request ID",
      width: 140,
      render: (r) => (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "var(--brand-600)",
            fontWeight: 600,
          }}
        >
          {r.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "product",
      header: "Product & SKU",
      render: (r) => (
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "var(--text-main)",
            }}
          >
            {r.product?.productName || "Product Intake"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            Code: {r.product?.productCode || "N/A"} • SKU:{" "}
            {r.product?.productSku || "N/A"}
          </div>
          <div style={{ marginTop: 4 }}>
            {r.product?.categoryCode && (
              <Tag style={{ fontSize: 11, borderRadius: 4 }}>
                {r.product.categoryCode}
              </Tag>
            )}
            {r.product?.brandCode && (
              <Tag style={{ fontSize: 11, borderRadius: 4 }}>
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
      width: 180,
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
              Intake: <strong>{totalStock} units</strong>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Approval Status",
      width: 150,
      render: (r) => getStatusTag(r.status),
    },
    {
      key: "approvers",
      header: "Signoff Progress",
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
      key: "createdAt",
      header: "Created Date",
      width: 130,
      render: (r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: 110,
      render: (r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRequest(r);
            setIsDetailModalOpen(true);
          }}
          style={{ borderRadius: 6, fontWeight: 500 }}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FileTextOutlined style={{ color: "var(--brand-600)" }} /> My
            Requests
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Manage and monitor product intake and stock requests submitted by
            you.
          </p>
        </div>

        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            style={{ height: 40, borderRadius: 10, fontWeight: 600 }}
          >
            Template
          </Button>

          <Button
            icon={<UploadOutlined />}
            onClick={() => setIsImportModalOpen(true)}
            style={{ height: 40, borderRadius: 10, fontWeight: 600 }}
          >
            Import Excel
          </Button>

          <Link href={ROUTES.PRODUCT_CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                backgroundColor: "var(--brand-600)",
                height: 40,
                borderRadius: 10,
                padding: "0 18px",
                fontWeight: 600,
              }}
            >
              New Request
            </Button>
          </Link>
        </Space>
      </div>

      {/* Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Total Requests
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "var(--text-main)",
              }}
            >
              {totalCount}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Pending Review
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "#f59e0b",
              }}
            >
              {pendingCount}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Approved
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "#10b981",
              }}
            >
              {approvedCount}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Rejected
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "#ef4444",
              }}
            >
              {rejectedCount}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--card-shadow)",
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by product, code, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 320, borderRadius: 8 }}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { label: "All Statuses", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
            ]}
          />
        </div>

        <Table
          columns={columns}
          data={filteredRequests}
          loading={loading}
          emptyText="No intake requests found."
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={`Request Details: ${selectedRequest?.product?.productName || selectedRequest?.id}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsDetailModalOpen(false)}
            style={{ borderRadius: 8 }}
          >
            Close
          </Button>,
        ]}
        width={680}
      >
        {selectedRequest && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Request ID" span={2}>
                <span
                  style={{ fontFamily: "monospace", color: "var(--brand-600)" }}
                >
                  {selectedRequest.id}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Product Name">
                <strong>{selectedRequest.product?.productName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Product Code">
                {selectedRequest.product?.productCode}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {selectedRequest.product?.categoryCode || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Brand">
                {selectedRequest.product?.brandCode || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Unit">
                {selectedRequest.product?.unit || "PCS"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedRequest.status)}
              </Descriptions.Item>
              {selectedRequest.remark && (
                <Descriptions.Item label="Remark / Feedback" span={2}>
                  <em>“{selectedRequest.remark}”</em>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Variants */}
            {selectedRequest.variants &&
              selectedRequest.variants.length > 0 && (
                <div>
                  <h4
                    style={{
                      margin: "10px 0 6px",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Variants ({selectedRequest.variants.length})
                  </h4>
                  <div
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        fontSize: 12.5,
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            textAlign: "left",
                          }}
                        >
                          <th style={{ padding: "8px 12px" }}>Code</th>
                          <th style={{ padding: "8px 12px" }}>Name</th>
                          <th style={{ padding: "8px 12px" }}>Cost Price</th>
                          <th style={{ padding: "8px 12px" }}>Selling Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequest.variants.map((v, i) => (
                          <tr
                            key={i}
                            style={{
                              borderTop: "1px solid var(--border-color)",
                            }}
                          >
                            <td
                              style={{
                                padding: "8px 12px",
                                fontFamily: "monospace",
                              }}
                            >
                              {v.variantCode}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              {v.variantName}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              ${v.variantCostPrice || 0}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              ${v.variantSellingPrice || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Stock per warehouse */}
            {selectedRequest.stock && selectedRequest.stock.length > 0 && (
              <div>
                <h4
                  style={{
                    margin: "10px 0 6px",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Intake Allocation
                </h4>
                <div
                  style={{
                    border: "1px solid var(--border-color)",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      fontSize: 12.5,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "rgba(0,0,0,0.02)",
                          textAlign: "left",
                        }}
                      >
                        <th style={{ padding: "8px 12px" }}>Warehouse</th>
                        <th style={{ padding: "8px 12px" }}>Variant</th>
                        <th style={{ padding: "8px 12px" }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.stock.map((s, i) => (
                        <tr
                          key={i}
                          style={{ borderTop: "1px solid var(--border-color)" }}
                        >
                          <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                            {s.warehouseCode}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            {s.variantCode}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                            {s.quantity} units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Intake Requests from Excel"
        open={isImportModalOpen}
        onCancel={() => {
          setIsImportModalOpen(false);
          setImportFileList([]);
        }}
        onOk={handleImportExcel}
        confirmLoading={importing}
        okText="Upload & Process"
        cancelText="Cancel"
      >
        <p style={{ fontSize: 13, color: "var(--text-sub)", marginTop: 12 }}>
          Upload a <code>.xlsx</code> or <code>.csv</code> file containing your
          batch product intake requests.
        </p>
        <Upload
          accept=".xlsx,.xls,.csv"
          maxCount={1}
          fileList={importFileList}
          beforeUpload={(file) => {
            setImportFileList([file]);
            return false;
          }}
          onRemove={() => setImportFileList([])}
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
      </Modal>
    </div>
  );
}
